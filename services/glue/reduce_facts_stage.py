# glue_reduce_facts_stage_c.py
# Stage-C: Temporal fact reducer (state machine + events + versions)
import os, re, json, time, uuid, argparse, logging, traceback
from datetime import datetime, timedelta, timezone, date
from decimal import Decimal
import uuid
import boto3
import psycopg2, urllib.parse as up

# ---------- args ----------
p = argparse.ArgumentParser()
p.add_argument("--GLUE_CONN", required=True, nargs="+")
p.add_argument("--REGION", default=os.environ.get("AWS_REGION","ap-northeast-1"))
p.add_argument("--LOG_LEVEL", default=os.environ.get("LOG_LEVEL","INFO"))

# what facts to scan
p.add_argument("--WINDOW_HOURS", type=int, default=24, help="scan kb_facts updated within this many hours")
p.add_argument("--STALE_DAYS", type=int, default=7, help="days without sighting ⇒ stale")

# checkpoints (S3)
p.add_argument("--CHECKPOINT_BUCKET", required=True)
p.add_argument("--CHECKPOINT_KEY", default="meeting-insights/state/stage_c_reducer_checkpoint.json")

# external-auto-close toggles (stubs today)
p.add_argument("--ENABLE_GITHUB", action="store_true")
p.add_argument("--ENABLE_JIRA",   action="store_true")

args,_ = p.parse_known_args()
GLUE_CONN = " ".join(args.GLUE_CONN)

# ---------- logging ----------
logging.basicConfig(level=getattr(logging, str(args.LOG_LEVEL).upper(), logging.INFO),
                    format="%(message)s", force=True)
def jlog(event, **fields):
    try:
        logging.info(json.dumps({"event": event, "ts_utc": datetime.utcnow().isoformat()+"Z", **fields}, ensure_ascii=False))
    finally:
        pass

def jerr(event, err: Exception, **fields):
    fields.update({"error_type": type(err).__name__, "error_msg": str(err),
                   "trace": traceback.format_exc(limit=2)})
    try:
        logging.error(json.dumps({"event": event, "level":"ERROR", **fields}, ensure_ascii=False))
    finally:
        pass

def parse_iso_utc(s: str):
    if not s:
        return None
    # 'Z' → '+00:00' for fromisoformat
    s2 = s.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s2).astimezone(timezone.utc)
    except Exception:
        return None

def to_aware_utc(dt):
    if dt is None:
        return None
    if isinstance(dt, str):
        return parse_iso_utc(dt)
    if getattr(dt, "tzinfo", None) is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def json_safe(obj):
    """Recursively convert Decimal/datetime/UUID/set → JSON-safe types."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime,)):
        # force UTC ISO8601 Z
        return obj.astimezone(timezone.utc).isoformat().replace("+00:00","Z")
    if isinstance(obj, date):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if isinstance(obj, set):
        return [json_safe(x) for x in obj]
    if isinstance(obj, list):
        return [json_safe(x) for x in obj]
    if isinstance(obj, tuple):
        return [json_safe(x) for x in obj]
    if isinstance(obj, dict):
        return {k: json_safe(v) for k, v in obj.items()}
    return obj

# ---------- AWS / DB ----------
session = boto3.session.Session(region_name=args.REGION)
s3 = session.client("s3")
glue = session.client("glue")

def get_conn_props(name):
    props = glue.get_connection(Name=name)["Connection"]["ConnectionProperties"]
    jdbc  = props["JDBC_CONNECTION_URL"]; user, pw = props["USERNAME"], props["PASSWORD"]
    url   = "postgresql://" + jdbc.split("jdbc:postgresql://",1)[1]
    pu    = up.urlparse(url)
    return dict(host=pu.hostname, port=pu.port or 5432,
                db=(pu.path or "/vapor").lstrip("/") or "vapor",
                user=user, pw=pw)

def pg_conn():
    c = get_conn_props(GLUE_CONN)
    jlog("db.connect.begin", host=c["host"], port=c["port"], db=c["db"])
    conn = psycopg2.connect(host=c["host"], port=c["port"], dbname=c["db"],
                            user=c["user"], password=c["pw"], sslmode="require")
    jlog("db.connect.ok")
    return conn

# ---------- checkpoint ----------
def load_ckpt():
    try:
        obj = s3.get_object(Bucket=args.CHECKPOINT_BUCKET, Key=args.CHECKPOINT_KEY)
        data = json.loads(obj["Body"].read())
        ts = data.get("last_processed_updated_at")
        last = parse_iso_utc(ts)
        jlog("ckpt.loaded", ts=ts)
        return last
    except s3.exceptions.NoSuchKey:
        jlog("ckpt.missing")
        return None
    except Exception as e:
        jerr("ckpt.error", e)
        return None

def save_ckpt(dt: datetime):
    ts = dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z") if dt else None
    payload = {"last_processed_updated_at": ts, "saved_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00","Z")}
    s3.put_object(Bucket=args.CHECKPOINT_BUCKET, Key=args.CHECKPOINT_KEY,
                  Body=json.dumps(payload).encode("utf-8"))
    jlog("ckpt.saved", ts=payload["last_processed_updated_at"])

# ---------- reducer logic ----------
FIELDS_FOR_VERSION = [
    "pulse_id","meeting_id","type","canonical_text","topic","status","lifecycle_state",
    "owner_user_id","due_at","confidence","first_seen_at","last_seen_at",
    "first_opened_at","last_transition_at","auto_closed_at"
]

def row_to_dict(row, cols):
    return {k: v for k,v in zip(cols, row)}

def snapshot_from_fact(d):
    out = {k: d.get(k) for k in FIELDS_FOR_VERSION}
    # Cast datetimes to iso
    for k in list(out.keys()):
        v = out[k]
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat()
    return out

def newest_version_no(cur, fact_id):
    cur.execute("SELECT COALESCE(MAX(version_no),0) FROM kb_fact_versions WHERE fact_id=%s::uuid", (fact_id,))
    return int(cur.fetchone()[0] or 0)

def insert_version(cur, fact_id, as_of_dt, snap):
    vno = newest_version_no(cur, fact_id) + 1
    cur.execute("""
      INSERT INTO kb_fact_versions (id, fact_id, version_no, as_of, snapshot, created_at, updated_at)
      VALUES (%s::uuid, %s::uuid, %s, %s, %s::jsonb, NOW(), NOW())
    """, (str(uuid.uuid4()), fact_id, vno, as_of_dt, json.dumps(json_safe(snap), ensure_ascii=False)))

def insert_event(cur, fact_id, etype, payload, source="stage_c", actor_type="system", actor_id=None, when=None):
    cur.execute("""
      INSERT INTO kb_fact_events (id, fact_id, event_type, payload, source, actor_type, actor_id, occurred_at, created_at, updated_at)
      VALUES (%s::uuid, %s::uuid, %s, %s::jsonb, %s, %s, %s, %s, NOW(), NOW())
    """, (str(uuid.uuid4()), fact_id, etype, json.dumps(json_safe(payload or {}), ensure_ascii=False),
          source, actor_type, actor_id, when or datetime.now(timezone.utc)))

def derive_lifecycle(d, now, stale_days):
    """
    open → in_progress: if owner set or confidence >= 0.75
    in_progress → stale: if last_seen_at older than stale_days
    * → closed: if status == 'closed' OR external signal says done
    """
    state = (d.get("lifecycle_state") or "open")
    status = (d.get("status") or "open")
    last_seen = d.get("last_seen_at")
    conf = float(d.get("confidence") or 0.0)
    owner = d.get("owner_user_id")
    closed = (status == "closed")  # explicit close keeps precedence

    if closed:
        return "closed"

    # external auto-close (stub hook)
    if check_external_done_stub(d):
        return "closed"

    # promote to in_progress
    if state in ("open", "stale") and (owner or conf >= 0.75):
        state = "in_progress"

    # stale if no sightings for N days
    if state in ("open","in_progress"):
        if isinstance(last_seen, datetime):
            if now - last_seen > timedelta(days=stale_days):
                state = "stale"

    return state

def check_external_done_stub(d):
    """
    Stub: wire to GitHub/Jira later.
    For now: if topic/canonical_text contains '[done]' or '[closed]' → auto-close.
    """
    t = (d.get("topic") or "") + " " + (d.get("canonical_text") or "")
    return bool(re.search(r"\[(done|closed)\]", t, re.I))

def diff_fields(before, after, keys):
    changes = {}
    for k in keys:
        if before.get(k) != after.get(k):
            changes[k] = {"before": before.get(k), "after": after.get(k)}
    return changes

def main():
    jlog("startup", region=args.REGION, window_hours=args.WINDOW_HOURS, stale_days=args.STALE_DAYS)

    ckpt_dt = load_ckpt()
    now = datetime.now(timezone.utc)
    window_from = (ckpt_dt if ckpt_dt else now - timedelta(hours=args.WINDOW_HOURS))

    conn = pg_conn()
    cur  = conn.cursor()

    # Pull candidate facts updated recently OR with recent sightings
    cur.execute("""
      SELECT
        id::text, pulse_id::text, meeting_id::text, type, canonical_text, topic,
        status, lifecycle_state, owner_user_id::text, due_at,
        confidence, first_seen_at, last_seen_at, first_opened_at, last_transition_at, auto_closed_at,
        updated_at
      FROM kb_facts
      WHERE (updated_at >= %s OR last_seen_at >= %s)
      ORDER BY updated_at ASC
    """, (window_from, window_from))

    rows = cur.fetchall()
    cols = ["id","pulse_id","meeting_id","type","canonical_text","topic",
            "status","lifecycle_state","owner_user_id","due_at",
            "confidence","first_seen_at","last_seen_at","first_opened_at","last_transition_at","auto_closed_at",
            "updated_at"]
    jlog("scan.results", candidates=len(rows), window_from=str(window_from))

    processed = 0
    last_upd = ckpt_dt or window_from

    for r in rows:
        d = row_to_dict(r, cols)
        for k in ["updated_at","last_seen_at","first_seen_at","first_opened_at","last_transition_at","due_at"]:
          d[k] = to_aware_utc(d.get(k))
        fact_id = d["id"]
        processed += 1
        if isinstance(d["updated_at"], datetime) and d["updated_at"] > last_upd:
            last_upd = d["updated_at"]

        # Load last version snapshot (if any)
        cur.execute("""
          SELECT snapshot
          FROM kb_fact_versions
          WHERE fact_id=%s::uuid
          ORDER BY version_no DESC
          LIMIT 1
        """, (fact_id,))
        rowv = cur.fetchone()
        before = rowv[0] if rowv else {}

        # Compute new lifecycle
        new_state = derive_lifecycle(d, now, args.STALE_DAYS)
        new_status = "closed" if new_state == "closed" else "open"

        # Build "after" (normalized) for diffing
        after = snapshot_from_fact({**d, "lifecycle_state": new_state, "status": new_status})

        # Event detection
        core_changes = diff_fields(before, after, ["owner_user_id","due_at","canonical_text"])
        state_changed = (before.get("lifecycle_state") != new_state) if before else True  # first snapshot ⇒ state event
        events_to_emit = []

        # sighted event when last_seen_at advanced vs previous snapshot
        if before:
            if before.get("last_seen_at") != after.get("last_seen_at"):
                events_to_emit.append(("sighted", {"before": before.get("last_seen_at"), "after": after.get("last_seen_at")}))
        else:
            # first materialization
            events_to_emit.append(("sighted", {"first_seen_at": after.get("first_seen_at")}))

        if "owner_user_id" in core_changes:
            events_to_emit.append(("owner_changed", core_changes["owner_user_id"]))
        if "due_at" in core_changes:
            events_to_emit.append(("due_changed", core_changes["due_at"]))
        if "canonical_text" in core_changes:
            events_to_emit.append(("text_changed", core_changes["canonical_text"]))

        # Auto-close marker
        if new_state == "closed" and (d.get("lifecycle_state") != "closed"):
            events_to_emit.append(("auto_closed", {"reason": "external_or_rule"}))

        if state_changed:
            events_to_emit.append(("state_changed", {
                "before": before.get("lifecycle_state"), "after": new_state
            }))

        # Persist: events → version → kb_facts updates
        try:
            with conn:
                with conn.cursor() as c:
                    # emit events
                    for et, payload in events_to_emit:
                        insert_event(c, fact_id, et, payload, source="stage_c", when=now)

                    # version snapshot (always append)
                    insert_version(c, fact_id, now, after)

                    # update kb_facts (keep 'status' for compatibility)
                    c.execute("""
                      UPDATE kb_facts
                      SET lifecycle_state=%s,
                          status=%s,
                          first_opened_at = COALESCE(first_opened_at, %s),
                          last_transition_at = %s,
                          auto_closed_at = CASE WHEN %s='closed' AND auto_closed_at IS NULL THEN %s ELSE auto_closed_at END,
                          updated_at = NOW()
                      WHERE id=%s::uuid
                    """, (new_state, new_status,
                          d.get("first_opened_at") or now,
                          now,
                          new_state, now,
                          fact_id))
        except Exception as e:
            jerr("stage_c.persist.error", e, fact_id=fact_id)

    jlog("stage_c.summary", processed=processed, last_upd=str(last_upd))
    save_ckpt(last_upd)
    cur.close(); conn.close()

if __name__ == "__main__":
    main()