# glue_rank_recommend_stage_d.py
# Stage-D: Rank/suppress outbox using thumbs feedback signals
import os, json, re, argparse, time, logging, traceback, math
from datetime import datetime, timedelta, timezone

import boto3
import psycopg2, urllib.parse as up
import pandas as pd

p = argparse.ArgumentParser()
p.add_argument("--GLUE_CONN", required=True, nargs="+")
p.add_argument("--REGION", default=os.environ.get("AWS_REGION","ap-northeast-1"))
p.add_argument("--LOG_LEVEL", default=os.environ.get("LOG_LEVEL","INFO"))
# tunables
p.add_argument("--AGE_HALF_LIFE_H", type=float, default=48.0)    # freshness bonus half-life (hours)
p.add_argument("--FEEDBACK_HALF_LIFE_D", type=float, default=30) # thumbs decay (days)
p.add_argument("--LOW_SCORE_SUPPRESS", type=float, default=-0.40) # hide when below
p.add_argument("--BATCH_LIMIT_USERS", type=int, default=5000)    # safety
args,_ = p.parse_known_args()
GLUE_CONN = " ".join(args.GLUE_CONN)

def _setup_logging():
    logging.basicConfig(level=getattr(logging, str(args.LOG_LEVEL).upper(), logging.INFO),
                        format="%(message)s", force=True)
    os.environ["PYTHONUNBUFFERED"] = "1"
_setup_logging()

def jlog(event, **fields):
    logging.info(json.dumps({"event": event, "ts": datetime.utcnow().isoformat()+"Z", **fields}))

# --- DB helpers ---
glue = boto3.client("glue", region_name=args.REGION)
def get_conn_props(name):
    props = glue.get_connection(Name=name)["Connection"]["ConnectionProperties"]
    jdbc  = props["JDBC_CONNECTION_URL"]; user, pw = props["USERNAME"], props["PASSWORD"]
    url   = "postgresql://" + jdbc.split("jdbc:postgresql://",1)[1]
    pu    = up.urlparse(url)
    return dict(host=pu.hostname, port=pu.port or 5432, db=(pu.path or "/vapor").lstrip("/") or "vapor",
                user=user, pw=pw)

def pg_conn():
    c = get_conn_props(GLUE_CONN)
    return psycopg2.connect(host=c["host"], port=c["port"], dbname=c["db"], user=c["user"], password=c["pw"], sslmode="require")

# --- math helpers ---
def decay_by_days(ts, half_life_days):
    if not ts: return 1.0
    dt = datetime.now(timezone.utc) - ts
    days = max(0.0, dt.total_seconds()/86400.0)
    return math.exp(- math.log(2.0) * (days / float(half_life_days)))

def freshness_bonus(created_at, half_life_h):
    if not created_at: return 0.0
    dt = datetime.now(timezone.utc) - created_at
    h  = max(0.0, dt.total_seconds()/3600.0)
    # 1.0 at t=0, halves each half-life; we scale to 0..+1 then weight later
    return math.exp(- math.log(2.0) * (h / float(half_life_h)))

def norm_thumb_1to5(r):
    # map 1..5 to -1..+1 (1 -> -1, 3 -> 0, 5 -> +1)
    r = float(r or 3)
    return (r - 3.0) / 2.0

# --- load data slices from DB ---
BASE_SQL = """
WITH latest_feedback AS (
  SELECT DISTINCT ON (outbox_id, user_id)
    outbox_id, user_id, rating, tags, comment, created_at
  FROM live_insight_feedback
  ORDER BY outbox_id, user_id, created_at DESC
)
SELECT
  -- current pending/queued/sent items to rank
  o.id                         AS outbox_id,
  o.user_id                    AS target_user_id,
  o.item_hash,
  o.kb_fact_id,
  o.type                       AS fact_type,
  o.created_at                 AS outbox_created_at,
  k.confidence                 AS fact_confidence,
  (k.owner_user_id = o.user_id) AS is_owner,
  k.id                         AS fact_id
FROM live_insight_outbox o
LEFT JOIN kb_facts k ON k.id = o.kb_fact_id
WHERE o.delivery_status IN ('pending','queued','sent')
  AND COALESCE(o.suppressed, false) = false
"""

# feedback used to build affinities for the rater (target_user_id)
# We’ll compute these on the fly with small group-bys.
AFFINITY_SQL = """
WITH latest_feedback AS (
  SELECT DISTINCT ON (f.outbox_id, f.user_id)
    f.outbox_id, f.user_id, f.rating, f.created_at
  FROM live_insight_feedback f
  ORDER BY f.outbox_id, f.user_id, f.created_at DESC
),
joined AS (
  SELECT
    o.user_id       AS rater_user_id,
    o.kb_fact_id    AS fact_id,
    k.type          AS fact_type,
    lf.rating,
    lf.created_at   AS rated_at
  FROM latest_feedback lf
  JOIN live_insight_outbox o ON o.id = lf.outbox_id
  LEFT JOIN kb_facts k ON k.id = o.kb_fact_id
  WHERE o.kb_fact_id IS NOT NULL
)
SELECT *
FROM joined
WHERE rater_user_id = ANY(%s::uuid[]);
"""

# entities for facts (to compute entity affinity)
ENTITIES_SQL = """
SELECT l.fact_id::uuid AS fact_id, l.to_id::uuid AS entity_id
FROM kb_fact_links l
WHERE l.to_type = 'kb_entity' AND l.fact_id = ANY(%s::uuid[]);
"""

def fetch_base(conn):
    df = pd.read_sql(BASE_SQL, conn, parse_dates=["outbox_created_at"])
    return df

def fetch_affinity_data(conn, user_ids):
    if not user_ids: 
        return (pd.DataFrame(columns=["rater_user_id","fact_id","fact_type","rating","rated_at"]),
                pd.DataFrame(columns=["fact_id","entity_id"]))
    a = pd.read_sql(AFFINITY_SQL, conn, params=(user_ids,), parse_dates=["rated_at"])
    fact_ids = list(a["fact_id"].dropna().astype(str).unique())
    if fact_ids:
        e = pd.read_sql(ENTITIES_SQL, conn, params=(fact_ids,))
    else:
        e = pd.DataFrame(columns=["fact_id","entity_id"])
    return a, e

def build_affinity_maps(a_df, e_df, half_life_days):
    """
    Returns 3 dicts keyed by user:
      type_aff[(user, type)] -> float
      fact_aff[(user, fact_id)] -> float
      ent_aff[(user, entity_id)] -> float
    """
    type_aff, fact_aff, ent_aff = {}, {}, {}

    # pre-map fact -> [entities]
    ents_by_fact = {}
    if not e_df.empty:
        for r in e_df.itertuples(index=False):
            ents_by_fact.setdefault(str(r.fact_id), []).append(str(r.entity_id))

    for r in a_df.itertuples(index=False):
        u  = str(r.rater_user_id)
        f  = str(r.fact_id) if r.fact_id else None
        t  = (r.fact_type or "").strip() or None
        rt = norm_thumb_1to5(r.rating)
        w  = decay_by_days(r.rated_at, half_life_days)

        eff = rt * w
        if f:
            fact_aff[(u, f)] = fact_aff.get((u, f), 0.0) + eff
            for eid in ents_by_fact.get(f, []):
                ent_aff[(u, eid)]  = ent_aff.get((u, eid), 0.0) + eff
        if t:
            type_aff[(u, t)] = type_aff.get((u, t), 0.0) + eff

    return type_aff, fact_aff, ent_aff

def item_quality_from_feedback(conn, half_life_days):
    """
    Aggregate global item quality per item_hash from latest feedback across all raters.
    """
    sql = """
    WITH latest AS (
      SELECT DISTINCT ON (outbox_id, user_id)
        outbox_id, user_id, rating, created_at
      FROM live_insight_feedback
      ORDER BY outbox_id, user_id, created_at DESC
    )
    SELECT o.item_hash,
           SUM( (CASE WHEN l.rating BETWEEN 1 AND 5 THEN (l.rating-3)/2.0 ELSE 0 END)
                * EXP(- GREATEST(0, EXTRACT(EPOCH FROM (now() - l.created_at)))/(86400.0*%s)) ) AS q
    FROM latest l
    JOIN live_insight_outbox o ON o.id = l.outbox_id
    GROUP BY o.item_hash;
    """
    df = pd.read_sql(sql, conn, params=(half_life_days,))
    return {str(r.item_hash): float(r.q or 0.0) for r in df.itertuples(index=False)}

def score_row(row, type_aff, fact_aff, ent_aff, item_q, age_half_life_h):
    u  = str(row.target_user_id)
    f  = str(row.kb_fact_id) if row.kb_fact_id else None
    t  = (row.fact_type or "").strip() or None
    conf = float(row.fact_confidence or 0.0)
    owner = 1.0 if bool(row.is_owner) else 0.0
    age_bonus = freshness_bonus(row.outbox_created_at, age_half_life_h)
    tq  = item_q.get(str(row.item_hash), 0.0)

    # affinities
    ta = type_aff.get((u, t), 0.0) if t else 0.0
    fa = fact_aff.get((u, f), 0.0) if f else 0.0

    # entity affinity: sum over fact’s entities (we keep it simple by looking up once in fact_aff builder)
    # we didn’t keep per-row entities here; approximate by taking max of user’s entity affinities for this fact via fact_aff already captured.
    # If you want exact entity sum, join ENTITIES_SQL per batch and sum—left simple for speed.
    ea = 0.0  # kept zero; fact_aff usually captures very specific signals

    # final weighted score (tunable)
    score = (
        0.35*conf
      + 0.35*owner
      + 0.20*ta
      + 0.25*ea
      + 0.25*fa
      + 0.10*tq
      + 0.20*age_bonus
    )
    reason = {
        "conf": round(conf,4),
        "owner": int(owner),
        "type_aff": round(ta,4),
        "entity_aff": round(ea,4),
        "fact_aff": round(fa,4),
        "item_quality": round(tq,4),
        "age_bonus": round(age_bonus,4)
    }
    return float(score), reason

def main():
    jlog("startup", region=args.REGION)

    conn = pg_conn()

    # 1) fetch candidate outbox rows to rank
    base = fetch_base(conn)
    if base.empty:
        jlog("noop.no_outbox")
        conn.close(); return

    # 2) gather users (cap for safety)
    users = list(base["target_user_id"].astype(str).unique())[:args.BATCH_LIMIT_USERS]
    base = base[base["target_user_id"].astype(str).isin(users)]

    # 3) load data to compute affinities
    a_df, e_df = fetch_affinity_data(conn, users)
    type_aff, fact_aff, ent_aff = build_affinity_maps(a_df, e_df, args.FEEDBACK_HALF_LIFE_D)

    # 4) global item quality (once)
    item_q = item_quality_from_feedback(conn, args.FEEDBACK_HALF_LIFE_D)

    # 5) score per user, rank, suppress
    updates = []  # (rec_score, rec_rank, rec_reason_json, recommended_at, suppressed, outbox_id)
    now = datetime.now(timezone.utc)
    for uid, dfu in base.groupby(base["target_user_id"].astype(str)):
        rows = []
        for r in dfu.itertuples(index=False):
            sc, rs = score_row(r, type_aff, fact_aff, ent_aff, item_q, args.AGE_HALF_LIFE_H)
            rows.append((sc, rs, r.outbox_id))
        # rank high → low
        rows.sort(key=lambda x: x[0], reverse=True)
        for rank, (sc, rs, oid) in enumerate(rows, start=1):
            suppressed = (sc <= args.LOW_SCORE_SUPPRESS)
            updates.append((round(sc,4), rank, json.dumps(rs), now, suppressed, int(oid)))

    # 6) write back in chunks
    if updates:
        with conn:
            with conn.cursor() as c:
                c.executemany("""
                  UPDATE live_insight_outbox
                  SET rec_score = %s,
                      rec_rank = %s,
                      rec_reason = %s::jsonb,
                      recommended_at = %s,
                      suppressed = %s,
                      updated_at = NOW()
                  WHERE id = %s
                """, updates)
        jlog("updated", rows=len(updates))
    else:
        jlog("noop.no_updates")

    conn.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logging.error(json.dumps({"event":"fatal", "error": str(e), "trace": traceback.format_exc()}))
        raise