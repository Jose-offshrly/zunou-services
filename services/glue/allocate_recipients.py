# glue_allocate_recipients_stage_b.py
# Stage-B: Allocate insights to correct people (meetings + team_messages)

import os, re, json, argparse, time, logging, traceback, uuid, sys
from datetime import datetime, timedelta
from difflib import get_close_matches

import boto3
import pandas as pd
import awswrangler as wr
import psycopg2, urllib.parse as up

# ---------- args ----------
p = argparse.ArgumentParser()
p.add_argument("--GLUE_CONN", required=True, nargs="+")              # e.g., --GLUE_CONN Aurora connection
p.add_argument("--S3_BUCKET", required=True)                         # Stage-A outputs bucket
p.add_argument("--S3_PREFIX", default="meeting-insights/")           # Stage-A prefix
p.add_argument("--CACHE_BUCKET", required=True)                      # snapshot cache bucket
p.add_argument("--CACHE_PREFIX", default="meeting-insights/cache/")  # snapshot cache prefix
p.add_argument("--DAYS_LOOKBACK", type=int, default=2)               # read recent JSONL
# LLM recipient ranking
p.add_argument("--MODEL_ID", required=True)                          # e.g. anthropic.claude-3-5-sonnet-20240620-v1:0
p.add_argument("--LLM_MAX_CANDIDATES", type=int, default=20)         # cap candidates passed to LLM
p.add_argument("--LLM_MAX_RECIPS", type=int, default=5)              # cap returned recipients per item
p.add_argument("--LLM_MIN_CONF", type=float, default=0.55)           # drop low-confidence picks
# Allocation checkpoint to avoid reprocessing
p.add_argument("--ALLOC_CHECKPOINT_BUCKET")                          # default -> S3_BUCKET
p.add_argument("--ALLOC_CHECKPOINT_KEY", default="meeting-insights/state/allocate_checkpoint.json")
# Event-driven single-file mode
p.add_argument("--ONLY_KEY")                                         # process exactly this JSONL or manifest key
p.add_argument("--FORCE", action="store_true", help="Process ONLY_KEY even if checkpoint says it's done")
p.add_argument("--REGION", default=os.environ.get("AWS_REGION", "ap-northeast-1"))
p.add_argument("--LOG_LEVEL", default=os.environ.get("LOG_LEVEL","INFO"))
args, _ = p.parse_known_args()
GLUE_CONN = " ".join(args.GLUE_CONN)

# Owner confidence gates (tunable)
OWNER_EXPLICIT_MIN = 0.45
OWNER_IMPLICIT_MIN = 0.70

# ---------- logging (forced to stdout, unbuffered) ----------
def _setup_logging():
    level_name = str(args.LOG_LEVEL).upper()
    level = getattr(logging, level_name, logging.INFO)

    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,  # replace Glue's preconfigured handlers
    )

    # Quiet noisy libs
    for noisy in ("boto3", "botocore", "urllib3", "s3transfer"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Ensure unbuffered behavior
    os.environ["PYTHONUNBUFFERED"] = "1"

_setup_logging()
RUN_ID = datetime.utcnow().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:8]

def jlog(event, **fields):
    base = {"event": event, "run_id": RUN_ID, "ts_utc": datetime.utcnow().isoformat() + "Z"}
    base.update(fields)
    try:
        logging.info(json.dumps(base, ensure_ascii=False))
    finally:
        sys.stdout.flush()

def jerr(event, err: Exception, **fields):
    fields.update({
        "error_type": type(err).__name__,
        "error_msg": str(err),
        "trace": traceback.format_exc(limit=2),
    })
    try:
        logging.error(json.dumps({"event": event, "level": "ERROR", **fields}, ensure_ascii=False))
    finally:
        sys.stdout.flush()

# ---------- AWS clients ----------
session = boto3.session.Session(region_name=args.REGION)
glue = session.client("glue")
s3   = session.client("s3")
brt  = session.client("bedrock-runtime")

ALLOC_CHECKPOINT_BUCKET = args.ALLOC_CHECKPOINT_BUCKET or args.S3_BUCKET

# ---------- helpers ----------
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

def latest_dt_candidates():
    today = datetime.utcnow().date()
    yield today.strftime("%Y-%m-%d")
    yield (today - timedelta(days=1)).strftime("%Y-%m-%d")

def load_cache():
    users, members, chosen_dt = None, None, None
    for dt in latest_dt_candidates():
        try:
            s = time.perf_counter()
            users   = wr.s3.read_parquet(path=f"s3://{args.CACHE_BUCKET}/{args.CACHE_PREFIX}dim_users/dt={dt}/")
            members = wr.s3.read_parquet(path=f"s3://{args.CACHE_BUCKET}/{args.CACHE_PREFIX}dim_pulse_members/dt={dt}/")
            jlog("cache.load.ok", dt=dt, users=len(users), members=len(members),
                 ms=round((time.perf_counter()-s)*1000,1))
            chosen_dt = dt
            break
        except Exception as e:
            jerr("cache.load.try_fail", e, dt=dt)
            continue
    if users is None:
        users   = pd.DataFrame(columns=["user_id","name","email","organization_id","job_title"])
        jlog("cache.load.empty_users")
    if members is None:
        members = pd.DataFrame(columns=["pulse_id","user_id","role"])
        jlog("cache.load.empty_members")

    users   = users.reindex(columns=["user_id","name","email","organization_id","job_title"], fill_value="")
    members = members.reindex(columns=["pulse_id","user_id","role"], fill_value="")

    users["user_id"]    = users["user_id"].astype(str)
    members["user_id"]  = members["user_id"].astype(str)
    members["pulse_id"] = members["pulse_id"].astype(str)
    return users, members, chosen_dt

def list_jsonl_keys(days):
    keys, seen = [], set()
    bases = []
    sp = (args.S3_PREFIX or "").strip("/")
    if sp:
        bases += [f"{sp}/", f"{sp}/parsed/"]
    bases += ["parsed/", "meeting-insights/parsed/"]
    scanned = 0
    for base in dict.fromkeys(bases):
        for i in range(days):
            d = (datetime.utcnow().date() - timedelta(days=i)).isoformat()
            prefix = f"{base}ingest_date={d}/"
            jlog("s3.scan.begin", bucket=args.S3_BUCKET, prefix=prefix)
            token = None
            while True:
                scanned += 1
                kw = dict(Bucket=args.S3_BUCKET, Prefix=prefix)
                if token: kw["ContinuationToken"] = token
                rsp = s3.list_objects_v2(**kw)
                for o in rsp.get("Contents", []):
                    k = o["Key"]
                    if k.endswith(".jsonl") and k not in seen:
                        keys.append(k); seen.add(k)
                if not rsp.get("IsTruncated"):
                    break
                token = rsp.get("NextContinuationToken")
            jlog("s3.scan.ok", bucket=args.S3_BUCKET, prefix=prefix, new_files=len(keys))
    jlog("s3.scan.summary", prefixes_scanned=scanned, jsonl_found=len(keys))
    return keys

def read_jsonl(bucket, key):
    s = time.perf_counter()
    body = s3.get_object(Bucket=bucket, Key=key)["Body"].read().decode("utf-8").splitlines()
    jlog("s3.read_jsonl.ok", bucket=bucket, key=key, lines=len(body), ms=round((time.perf_counter()-s)*1000,1))
    for line in body:
        if line.strip():
            yield json.loads(line)

def is_uuid(s: str) -> bool:
    try:
        uuid.UUID(str(s)); return True
    except Exception:
        return False

def uuid_list(values):
    return [str(v) for v in values if is_uuid(v)]

# ---------- allocation checkpoint ----------
def load_allocate_checkpoint():
    try:
        obj = s3.get_object(Bucket=ALLOC_CHECKPOINT_BUCKET, Key=args.ALLOC_CHECKPOINT_KEY)
        data = json.loads(obj["Body"].read())
        processed = set(data.get("processed_keys", []))
        jlog("alloc.ckpt.loaded", bucket=ALLOC_CHECKPOINT_BUCKET, key=args.ALLOC_CHECKPOINT_KEY, processed=len(processed))
        return processed
    except s3.exceptions.NoSuchKey:
        jlog("alloc.ckpt.missing", bucket=ALLOC_CHECKPOINT_BUCKET, key=args.ALLOC_CHECKPOINT_KEY)
        return set()
    except Exception as e:
        jerr("alloc.ckpt.error", e, bucket=ALLOC_CHECKPOINT_BUCKET, key=args.ALLOC_CHECKPOINT_KEY)
        return set()

def save_allocate_checkpoint(processed_keys):
    pk_list = list(processed_keys)
    if len(pk_list) > 10000:
        pk_list = pk_list[-10000:]
    payload = {"processed_keys": pk_list, "saved_at_utc": datetime.utcnow().isoformat()+"Z"}
    s3.put_object(Bucket=ALLOC_CHECKPOINT_BUCKET, Key=args.ALLOC_CHECKPOINT_KEY,
                  Body=json.dumps(payload).encode("utf-8"))
    jlog("alloc.ckpt.saved", bucket=ALLOC_CHECKPOINT_BUCKET, key=args.ALLOC_CHECKPOINT_KEY, count=len(pk_list))

# ---------- ONLY_KEY helpers ----------
def resolve_only_key_to_jsonl(only_key: str):
    key = up.unquote(only_key.strip())
    if key.endswith(".jsonl"):
        return key
    if key.endswith("manifest.json"):
        try:
            obj = s3.get_object(Bucket=args.S3_BUCKET, Key=key)
            manifest = json.loads(obj["Body"].read())
            jlog("only_key.manifest.read", key=key, has_s3_key=bool(manifest.get("s3_key")))
            return manifest.get("s3_key")
        except Exception as e:
            jerr("only_key.manifest.error", e, key=key)
            return None
    return key

# ---------- owner resolution ----------
def resolve_owner_from_fields(owner_user_id, owner_name, cand_users_df):
    if owner_user_id and is_uuid(owner_user_id):
        return str(owner_user_id)
    alias = (owner_user_id or "").strip().lower()
    if "@" in alias:
        hit = cand_users_df[cand_users_df["email"].str.lower()==alias]
        if not hit.empty:
            return str(hit.iloc[0]["user_id"])
    name_alias = (owner_name or owner_user_id or "").strip().lower()
    if name_alias:
        cand_map = cand_users_df[["user_id","name","email"]].fillna("")
        cand_map["name_l"]  = cand_map["name"].str.lower()
        cand_map["email_l"] = cand_map["email"].str.lower()
        pool = list(set(cand_map["name_l"].tolist() + cand_map["email_l"].tolist()))
        best = get_close_matches(name_alias, pool, n=1, cutoff=0.82)
        if best:
            row = cand_map[(cand_map["name_l"]==best[0]) | (cand_map["email_l"]==best[0])].head(1)
            if not row.empty:
                return str(row.iloc[0]["user_id"])
    return None

def resolve_owner(item, cand_users_df):
    orsl = item.get("owner_resolution") or {}
    or_status = (orsl.get("status") or "").lower()
    try:
        or_conf = float(orsl.get("confidence") or item.get("owner_confidence") or 0.0)
    except Exception:
        or_conf = 0.0

    if or_status == "explicit" and or_conf >= OWNER_EXPLICIT_MIN:
        uid = resolve_owner_from_fields(item.get("owner_user_id"), item.get("owner_name"), cand_users_df)
        if uid: return uid
        uid = resolve_owner_from_fields(orsl.get("owner_email"), orsl.get("owner_name"), cand_users_df)
        if uid: return uid

    if or_status == "implicit" and or_conf >= OWNER_IMPLICIT_MIN:
        uid = resolve_owner_from_fields(item.get("owner_user_id"), item.get("owner_name"), cand_users_df)
        if uid: return uid
        uid = resolve_owner_from_fields(orsl.get("owner_email"), orsl.get("owner_name"), cand_users_df)
        if uid: return uid

    return resolve_owner_from_fields(item.get("owner_user_id"), item.get("owner_name"), cand_users_df)

def normalize_type(t):
    t = (t or "").strip().lower()
    if t in ("action","task","todo","follow-up","followup"): return "action"
    if t in ("decision","agreement","approval"):            return "decision"
    if t in ("risk","issue","concern","blocker"):           return "risk"
    return None

# ---------- LLM ----------
def _invoke_bedrock(model_id, body, label, extra=None):
    s = time.perf_counter()
    resp = brt.invoke_model(
        modelId=model_id,
        body=json.dumps(body).encode("utf-8"),
        contentType="application/json",
        accept="application/json"
    )
    ms = round((time.perf_counter()-s)*1000,1)
    out = json.loads(resp["body"].read())
    txt = "".join([c.get("text","") for c in out.get("content",[])])
    jlog("bedrock.invoke.ok", call=label, model_id=model_id, ms=ms,
         resp_chars=len(txt), **(extra or {}))
    return out, txt

def invoke_bedrock_json(model_id, prompt_text, max_tokens=800, call_label="allocator"):
    body = {
        "anthropic_version":"bedrock-2023-05-31",
        "messages":[{"role":"user","content":[{"type":"text","text": prompt_text}]}],
        "max_tokens": max_tokens, "temperature": 0
    }
    out, txt = _invoke_bedrock(model_id, body, call_label, {"max_tokens": max_tokens, "prompt_chars": len(prompt_text)})
    if not txt.strip().startswith("{"):
        s,e = txt.find("{"), txt.rfind("}")
        if s>=0 and e>s:
            txt = txt[s:e+1]
    try:
        return json.loads(txt)
    except Exception as e:
        jerr("bedrock.parse_json.error", e, call=call_label, preview=txt[:2000])
        raise

# --- allocation prompt (uses catalog too) ---
def allocation_prompt(item, candidates, max_recips, min_conf, catalog):
    expl = (item.get("explanation") or "")
    if len(expl) > 800:
        expl = expl[:800] + "..."
    payload = {
        "item": {
            "type": item.get("type"),
            "topic": item.get("topic"),
            "description": item.get("description"),
            "explanation": expl
        },
        "candidates": candidates,
        "catalog": catalog[:30]  # cap for prompt size
    }
    return f"""
You are a routing assistant. Choose who should be notified about an insight.
Pick users **only when there is a clear, defensible reason** based on topic/description vs job_title and/or pulse_role.

Return STRICT JSON only:
{{
  "recipients": [
    {{"user_id":"uuid","reason":"short why","confidence":0.0-1.0}}
  ]
}}

Rules:
- Max {max_recips} recipients.
- Give reasons referencing specific keywords (e.g., "Auth0 login → backend/security"), or leadership role for decisions.
- Reject weak matches; do not add people without a concrete link.
- If no suitable candidate, return an empty list.
- Prefer the explicit owner if clearly responsible.

DATA:
{json.dumps(payload, ensure_ascii=False)}
""".strip()

def llm_rank_recipients(item, cand_df, catalog):
    c = cand_df[["user_id","name","email","job_title","role"]].fillna("")
    c = c.drop_duplicates(subset=["user_id"]).head(args.LLM_MAX_CANDIDATES)
    cand_list = c.to_dict(orient="records")
    prompt = allocation_prompt(item, cand_list, args.LLM_MAX_RECIPS, args.LLM_MIN_CONF, catalog)
    try:
        out = invoke_bedrock_json(args.MODEL_ID, prompt, max_tokens=600, call_label="allocator")
        recs = out.get("recipients", [])
        keep = []
        valid_ids = set(c["user_id"] for c in cand_list)
        accepted = []
        for r in recs:
            uid = str(r.get("user_id",""))
            conf = float(r.get("confidence", 0) or 0)
            if uid in valid_ids and conf >= args.LLM_MIN_CONF:
                keep.append(uid)
                accepted.append({"user_id": uid, "confidence": conf, "reason": r.get("reason","")[:160]})
        jlog("allocator.result", requested=len(cand_list), returned=len(recs), accepted=len(accepted), picks=accepted[:5])
        return keep, recs
    except Exception as e:
        jerr("allocator.error", e)
        return [], []

# ---------- heuristic + LLM ----------
MOBILE_PAT   = re.compile(r"\b(android|ios|mobile|capacitor)\b", re.I)
AUTH_PAT     = re.compile(r"\b(auth0|login|oauth|token|refresh)\b", re.I)
BACKEND_PAT  = re.compile(r"\b(calendar|integration|api|backend)\b", re.I)
FRONTEND_PAT = re.compile(r"\b(ui|css|safari|tailwind|frontend|ux|design)\b", re.I)
LEAD_PAT     = re.compile(r"owner|lead|manager", re.I)

def choose_recipients(item, pulse_id, dim_users, dim_members, catalog):
    itype = normalize_type(item.get("type"))
    if not itype:
        return []

    members = dim_members[dim_members["pulse_id"] == str(pulse_id)]
    cand = members.merge(dim_users, on="user_id", how="left")

    recips = set()

    # 1) Owner from Step-A (explicit/implicit + thresholds)
    owner_id = resolve_owner(item, cand)
    if owner_id:
        recips.add(owner_id)

    # 2) Heuristic shortlist by job_title
    topic_text = f"{item.get('topic','')} {item.get('description','')}".lower()
    jt = cand["job_title"].fillna("")
    shortlist = pd.DataFrame(columns=cand.columns)
    if MOBILE_PAT.search(topic_text):
        shortlist = pd.concat([shortlist, cand[jt.str.contains("android|ios|mobile", case=False, regex=True, na=False)]])
    if AUTH_PAT.search(topic_text):
        shortlist = pd.concat([shortlist, cand[jt.str.contains("backend|platform|security|sre|devops|engineer", case=False, regex=True, na=False)]])
    if BACKEND_PAT.search(topic_text):
        shortlist = pd.concat([shortlist, cand[jt.str.contains("backend|platform|integration|engineer|api", case=False, regex=True, na=False)]])
    if FRONTEND_PAT.search(topic_text):
        shortlist = pd.concat([shortlist, cand[jt.str.contains("frontend|web|ui|ux|design|css|tailwind", case=False, regex=True, na=False)]])
    if itype == "decision":
        shortlist = pd.concat([shortlist, cand[cand["role"].str.contains(LEAD_PAT, na=False)]])

    if shortlist.empty:
        shortlist = cand

    # 3) LLM ranking on shortlist (with catalog)
    llm_ids, _raw = llm_rank_recipients(
        {"type": itype, "topic": item.get("topic"), "description": item.get("description"), "explanation": item.get("explanation","")},
        shortlist,
        catalog
    )
    recips.update(llm_ids)

    # 4) safety fallback if still empty
    if not recips:
        leads = cand[cand["role"].str.contains(LEAD_PAT, na=False)]["user_id"].astype(str).tolist()
        recips.update(leads or cand["user_id"].astype(str).tolist()[:3])

    return sorted(set(recips))

# --- fetch entities per pulse to build a small catalog ---
def fetch_pulse_entities(cur, pulse_ids):
    result = {}
    if not pulse_ids:
        return result
    pid_list = uuid_list(pulse_ids)
    if not pid_list:
        return result
    cur.execute("""
      SELECT pulse_id::text, id::text, kind, name
      FROM kb_entities
      WHERE pulse_id = ANY(%s::uuid[])
    """, (pid_list,))
    for p_id, e_id, kind, name in cur.fetchall():
        result.setdefault(p_id, []).append({"id": e_id, "kind": kind, "name": name})
    return result

# --- to_type normalization for kb_fact_links ---
def normalize_link_to_type(_cur, desired: str) -> str:
    d = (desired or "").strip().lower()
    if d in ("user", "kb_entity", "pulse", "meeting"):
        return d
    if d in ("entity",):
        return "kb_entity"
    return d

# --- insert user links to kb_fact_links ---
def insert_user_links(cur, fact_id, primary_uid, all_recips, weight=None):
    """
    Insert kb_fact_links rows for recipients:
      - primary_uid → relation='assigned_to'
      - everyone else → relation='affects'
    Uses ON CONFLICT DO NOTHING and SAVEPOINTs so one bad row won't abort the txn.
    """
    if not fact_id:
        return 0

    inserted = 0
    try:
        to_type_user = normalize_link_to_type(cur, "user")

        # local UUID guard
        def _is_uuid(x):
            try:
                uuid.UUID(str(x))
                return True
            except Exception:
                return False

        recips = [u for u in (all_recips or []) if _is_uuid(u)]
        p_uid  = primary_uid if _is_uuid(primary_uid) else None

        # Primary first (assigned_to)
        if p_uid:
            cur.execute("SAVEPOINT sp_primary")
            try:
                cur.execute("""
                    INSERT INTO kb_fact_links
                      (fact_id, to_type, to_id, relation, weight, created_at, updated_at)
                    VALUES
                      (%s::uuid, %s, %s::uuid, 'assigned_to', %s, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, (fact_id, to_type_user, p_uid, weight))
                inserted += 1
                cur.execute("RELEASE SAVEPOINT sp_primary")
            except Exception as e:
                cur.execute("ROLLBACK TO SAVEPOINT sp_primary")
                jerr("kb.user_link.insert_primary.fail", e, fact_id=fact_id, user_id=str(p_uid))

        # Others as affects
        for uid in recips:
            if uid == p_uid:
                continue
            cur.execute("SAVEPOINT sp_affects")
            try:
                cur.execute("""
                    INSERT INTO kb_fact_links
                      (fact_id, to_type, to_id, relation, weight, created_at, updated_at)
                    VALUES
                      (%s::uuid, %s, %s::uuid, 'affects', %s, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """, (fact_id, to_type_user, uid, weight))
                inserted += 1
                cur.execute("RELEASE SAVEPOINT sp_affects")
            except Exception as e:
                cur.execute("ROLLBACK TO SAVEPOINT sp_affects")
                jerr("kb.user_link.insert_affects.fail", e, fact_id=fact_id, user_id=str(uid))

        return inserted
    except Exception as e:
        jerr("kb.user_links.insert.error", e, fact_id=fact_id,
             primary_user_id=str(primary_uid), recipients=len(all_recips or []))
        return 0

# --- pulse -> organization map ---
def fetch_pulse_orgs(cur, pulse_ids):
    result = {}
    if not pulse_ids:
        return result
    pid_list = uuid_list(pulse_ids)
    if not pid_list:
        return result
    cur.execute("""
      SELECT id::text, organization_id::text
      FROM pulses
      WHERE id = ANY(%s::uuid[])
    """, (pid_list,))
    for pid, oid in cur.fetchall():
        result[pid] = oid
    return result

# ---------- main ----------
def main():
    jlog("startup",
         region=args.REGION, glue_conn=GLUE_CONN, s3_bucket=args.S3_BUCKET,
         s3_prefix=args.S3_PREFIX, cache_bucket=args.CACHE_BUCKET, model_id=args.MODEL_ID,
         days_lookback=args.DAYS_LOOKBACK, log_level=str(args.LOG_LEVEL).upper(),
         alloc_ckpt_bucket=(ALLOC_CHECKPOINT_BUCKET or ""), alloc_ckpt_key=args.ALLOC_CHECKPOINT_KEY,
         only_key=(args.ONLY_KEY or ""), force=args.FORCE)

    metrics = {
        "jsonl_files": 0,
        "keys_to_process": 0,
        "records_read": 0,
        "meetings_seen": 0,
        "meetings_mapped": 0,
        "messages_seen": 0,      # actually team_messages for now
        "messages_mapped": 0,    # actually team_messages for now
        "items_seen": 0,
        "items_skipped_type": 0,
        "owner_resolved": 0,
        "llm_calls": 0,
        "llm_errors": 0,
        "recipients_selected_total": 0,
        "rows_upserted": 0,
        "fallback_pulse_members": 0,
        "fallback_users": 0,
        "dup_skipped_in_run": 0,
        "kb_user_links": 0,
        "kb_user_link_errors": 0
    }

    dim_users, dim_members, cache_dt = load_cache()
    processed_keys = load_allocate_checkpoint()

    if args.ONLY_KEY:
        resolved = resolve_only_key_to_jsonl(args.ONLY_KEY)
        if not resolved:
            jlog("only_key.resolve.failed", only_key=args.ONLY_KEY)
            print("ONLY_KEY could not be resolved to a JSONL.")
            return
        keys_to_process = [resolved]
        jlog("only_key.mode", only_key=args.ONLY_KEY, resolved_jsonl=resolved)

        if (resolved in processed_keys) and (not args.FORCE):
            jlog("only_key.already_processed.skip", key=resolved)
            print("ONLY_KEY already processed (checkpoint). Use --FORCE to reprocess.")
            return
    else:
        jsonl_keys = list_jsonl_keys(args.DAYS_LOOKBACK)
        metrics["jsonl_files"] = len(jsonl_keys)
        keys_to_process = [k for k in jsonl_keys if k not in processed_keys]
        jlog("alloc.ckpt.filter", total=len(jsonl_keys), already=len(processed_keys), to_process=len(keys_to_process))

        if not keys_to_process:
            jlog("stage_b.no_new_inputs")
            print("No Stage-A new outputs to process.")
            return

    metrics["keys_to_process"] = len(keys_to_process)

    # Gather meeting_ids and team_message_ids ONLY from keys_to_process
    meeting_ids = set()
    team_message_ids = set()
    provided_pulse_ids = set()

    for k in keys_to_process:
        try:
            for rec in read_jsonl(args.S3_BUCKET, k):
                metrics["records_read"] += 1

                mid_raw   = str(rec.get("meeting_id","")).strip()
                tmid_raw  = str(rec.get("team_message_id","")).strip()
                pid0      = str(rec.get("pulse_id","")).strip()

                if is_uuid(mid_raw):
                    meeting_ids.add(mid_raw)
                if is_uuid(tmid_raw):
                    team_message_ids.add(tmid_raw)
                if is_uuid(pid0):
                    provided_pulse_ids.add(pid0)
        except Exception as e:
            jerr("s3.read_jsonl.error", e, key=k)

    meeting_ids       = list(meeting_ids)
    team_message_ids  = list(team_message_ids)
    metrics["meetings_seen"]  = len(meeting_ids)
    metrics["messages_seen"]  = len(team_message_ids)
    jlog("inputs.compiled", meetings=len(meeting_ids), team_messages=len(team_message_ids), records=metrics["records_read"])

    # DB lookups
    conn = pg_conn(); cur = conn.cursor()

    # meetings -> pulse_id
    mid_to_pulse = {}
    mid_list = uuid_list(meeting_ids)
    if mid_list:
        s = time.perf_counter()
        cur.execute("""
          SELECT id::text AS meeting_id, pulse_id::text
          FROM meetings
          WHERE id = ANY(%s::uuid[])
        """, (mid_list,))
        rows = cur.fetchall()
        mid_to_pulse = {r[0]: r[1] for r in rows}
        metrics["meetings_mapped"] = len(mid_to_pulse)
        jlog("db.map_meetings.ok", mapped=len(mid_to_pulse), by="meetings.id", ms=round((time.perf_counter()-s)*1000,1))

    # team_messages -> pulse_id
    tmid_to_pulse = {}
    tmid_list = uuid_list(team_message_ids)
    if tmid_list:
        s = time.perf_counter()
        try:
            cur.execute("""
              SELECT tm.id::text AS team_message_id, tm.pulse_id::text
              FROM team_messages tm
              WHERE tm.id = ANY(%s::uuid[])
            """, (tmid_list,))
            rows = cur.fetchall()
            tmid_to_pulse = {r[0]: r[1] for r in rows if r[1]}
            metrics["messages_mapped"] = len(tmid_to_pulse)
            jlog("db.map_team_messages.ok", mapped=len(tmid_to_pulse), by="team_messages.id", ms=round((time.perf_counter()-s)*1000,1))
        except Exception as e:
            jerr("db.map_team_messages.error", e)

    # ensure pulse_members cache (fallback)
    pulse_ids = sorted(set(
        [p for p in mid_to_pulse.values() if p] +
        [p for p in tmid_to_pulse.values() if p] +
        list(provided_pulse_ids)
    ))
    cached = dim_members[dim_members["pulse_id"].isin(pulse_ids)]
    have = set(cached["pulse_id"].unique())
    missing_pulses = [p for p in pulse_ids if p not in have]
    if missing_pulses:
        mp_list = uuid_list(missing_pulses)
        if mp_list:
            s = time.perf_counter()
            cur.execute("""
              SELECT pulse_id::text, user_id::text, role
              FROM pulse_members
              WHERE pulse_id = ANY(%s::uuid[])
            """, (mp_list,))
            miss_rows = cur.fetchall()
            if miss_rows:
                miss_df = pd.DataFrame(miss_rows, columns=["pulse_id","user_id","role"])
                dim_members = pd.concat([dim_members, miss_df], ignore_index=True)
                metrics["fallback_pulse_members"] += len(miss_rows)
            jlog("db.fetch_pulse_members.ok", fetched=len(miss_rows), ms=round((time.perf_counter()-s)*1000,1))

    # ensure users cache (fallback)
    user_ids = sorted(set(dim_members[dim_members["pulse_id"].isin(pulse_ids)]["user_id"].astype(str)))
    cached_users = dim_users[dim_users["user_id"].isin(user_ids)]
    have_users = set(cached_users["user_id"].astype(str))
    missing_users = [u for u in user_ids if u not in have_users]
    if missing_users:
        mu_list = uuid_list(missing_users)
        if mu_list:
            s = time.perf_counter()
            cur.execute("""
              SELECT u.id::text AS user_id, u.name, u.email,
                     ou.organization_id::text, ou.job_title
              FROM organization_users ou
              JOIN users u ON u.id = ou.user_id
              WHERE ou.user_id = ANY(%s::uuid[])
            """, (mu_list,))
            miss_users = cur.fetchall()
            if miss_users:
                miss_df = pd.DataFrame(miss_users, columns=["user_id","name","email","organization_id","job_title"])
                dim_users = pd.concat([dim_users, miss_df], ignore_index=True)
                metrics["fallback_users"] += len(miss_users)
            jlog("db.fetch_users.ok", fetched=len(miss_users), ms=round((time.perf_counter()-s)*1000,1))

    # load entity catalog per pulse
    pulse_entities = fetch_pulse_entities(cur, pulse_ids)

    # pulse -> organization_id map
    pulse_to_org = fetch_pulse_orgs(cur, pulse_ids)

    # build per-recipient rows (with in-run de-dupe)
    rows = []
    seen_pairs = set()  # (item_hash, user_id)
    processed_now = set()
    user_links_stash = []  # stash for kb user links

    def resolve_fact_id_if_missing(rec_kb_fact_id, rec_canon_hash):
        if rec_kb_fact_id:
            return rec_kb_fact_id
        if rec_canon_hash:
            try:
                cur.execute("SELECT id::text FROM kb_facts WHERE canonical_hash=%s", (rec_canon_hash,))
                r = cur.fetchone()
                return r[0] if r else None
            except Exception as e:
                jerr("kb.lookup_by_hash.error", e, canonical_hash=rec_canon_hash)
        return None

    for k in keys_to_process:
        new_rows_for_key = 0
        try:
            for rec in read_jsonl(args.S3_BUCKET, k):
                mid_raw   = str(rec.get("meeting_id","")).strip()
                tmid_raw  = str(rec.get("team_message_id","")).strip()
                pid0      = str(rec.get("pulse_id","")).strip()

                meeting_id      = mid_raw if is_uuid(mid_raw) else None
                team_message_id = tmid_raw if is_uuid(tmid_raw) else None

                # Resolve pulse_id priority: explicit, meeting, then team_message
                pid = pid0 if is_uuid(pid0) else None
                if not pid and meeting_id:
                    pid = mid_to_pulse.get(meeting_id)
                if not pid and team_message_id:
                    pid = tmid_to_pulse.get(team_message_id)
                if not pid:
                    # cannot tie to a pulse → skip
                    continue

                org_id = pulse_to_org.get(pid)

                item = rec.get("item", {}) or {}
                ntype = normalize_type(item.get("type"))
                if not ntype:
                    metrics["items_skipped_type"] += 1
                    continue
                item["type"] = ntype
                metrics["items_seen"] += 1

                # ensure explanation present
                item["explanation"] = (item.get("explanation") or item.get("description") or "")

                # choose recipients (with catalog)
                try:
                    salloc = time.perf_counter()
                    catalog = pulse_entities.get(pid, [])
                    recipients = choose_recipients(item, pid, dim_users, dim_members, catalog)
                    alloc_ms = round((time.perf_counter()-salloc)*1000,1)
                    metrics["llm_calls"] += 1
                    metrics["recipients_selected_total"] += len(recipients)
                    if item.get("owner_resolution",{}).get("status") in ("explicit","implicit"):
                        metrics["owner_resolved"] += 1
                    jlog("allocation.done", key=k, meeting_id=meeting_id, team_message_id=team_message_id,
                         pulse_id=pid, type=ntype, topic=item.get("topic"),
                         recips=len(recipients), ms=alloc_ms)
                except Exception as e:
                    metrics["llm_errors"] += 1
                    jerr("allocation.error", e, meeting_id=meeting_id, team_message_id=team_message_id, topic=item.get("topic"))
                    recipients = []

                kb_fact_id = resolve_fact_id_if_missing(rec.get("kb_fact_id"), rec.get("canonical_hash"))
                evidence = item.get("evidence") or []
                try:
                    item_conf = float(item.get("owner_confidence") or 0.7)
                except Exception:
                    item_conf = None

                # decide primary recipient (prefer resolved owner if selected) and stash links
                try:
                    members = dim_members[dim_members["pulse_id"] == str(pid)]
                    cand = members.merge(dim_users, on="user_id", how="left")
                    owner_uid = resolve_owner(item, cand)
                    primary_uid = owner_uid if (owner_uid and owner_uid in recipients) else (recipients[0] if recipients else None)

                    valid_recips = [u for u in recipients if is_uuid(u)]
                    primary_uid = primary_uid if is_uuid(primary_uid) else None

                    if kb_fact_id and valid_recips:
                        user_links_stash.append((kb_fact_id, primary_uid, valid_recips[:], item_conf))
                except Exception as e:
                    jerr("kb.primary_owner.choose.error", e, meeting_id=meeting_id, team_message_id=team_message_id)

                for uid in recipients:
                    pair = (rec.get("item_hash",""), uid)
                    if pair in seen_pairs:
                        metrics["dup_skipped_in_run"] += 1
                        continue
                    seen_pairs.add(pair)

                    rows.append({
                        "item_hash": rec.get("item_hash",""),
                        "meeting_id": meeting_id,
                        "team_message_id": team_message_id,
                        "pulse_id": pid,
                        "organization_id": org_id,
                        "type": ntype,
                        "topic": item.get("topic"),
                        "description": item.get("description"),
                        "explanation": item.get("explanation"),
                        "user_id": uid,
                        "delivery_status": "pending",
                        "kb_fact_id": kb_fact_id,
                        "confidence": item_conf,
                        "evidence": json.dumps(evidence, ensure_ascii=False)
                    })
                    new_rows_for_key += 1
            jlog("jsonl.processed", key=k, rows=new_rows_for_key)
            processed_now.add(k)
        except Exception as e:
            jerr("jsonl.process.error", e, key=k)

    jlog("allocation.summary_pre_upsert", candidate_rows=len(rows), dup_skipped_in_run=metrics["dup_skipped_in_run"])
    if not rows:
        cur.close(); conn.close()
        if processed_now:
            processed_keys |= processed_now
            save_allocate_checkpoint(processed_keys)
        jlog("stage_b.no_rows_to_write")
        print("Prepared 0 outbox rows.")
        return

    # upsert to public.live_insight_outbox (linking kb_fact_id, evidence, confidence, team_message_id)
    upsert_sql = """
    INSERT INTO public.live_insight_outbox
      (item_hash, meeting_id, team_message_id, pulse_id, organization_id, type, topic, description, explanation,
       user_id, delivery_status, kb_fact_id, confidence, evidence,
       created_at, updated_at)
    VALUES
      (%(item_hash)s, %(meeting_id)s, %(team_message_id)s, %(pulse_id)s, %(organization_id)s, %(type)s, %(topic)s,
       %(description)s, %(explanation)s, %(user_id)s, %(delivery_status)s,
       %(kb_fact_id)s, %(confidence)s, %(evidence)s::jsonb,
       NOW(), NOW())
    ON CONFLICT (item_hash, user_id) DO UPDATE SET
      meeting_id      = COALESCE(EXCLUDED.meeting_id, public.live_insight_outbox.meeting_id),
      team_message_id = COALESCE(EXCLUDED.team_message_id, public.live_insight_outbox.team_message_id),
      pulse_id        = EXCLUDED.pulse_id,
      organization_id = EXCLUDED.organization_id,
      type            = EXCLUDED.type,
      topic           = EXCLUDED.topic,
      description     = EXCLUDED.description,
      explanation     = EXCLUDED.explanation,
      kb_fact_id      = COALESCE(EXCLUDED.kb_fact_id, public.live_insight_outbox.kb_fact_id),
      confidence      = GREATEST(COALESCE(public.live_insight_outbox.confidence,0), COALESCE(EXCLUDED.confidence,0)),
      evidence        = COALESCE(EXCLUDED.evidence, public.live_insight_outbox.evidence),
      delivery_status = CASE
          WHEN public.live_insight_outbox.delivery_status IN ('seen','closed')
          THEN public.live_insight_outbox.delivery_status
          ELSE EXCLUDED.delivery_status
      END,
      updated_at      = NOW();
    """

    upserted = 0
    kb_links_done = 0
    with conn:
        with conn.cursor() as c:
            s = time.perf_counter()
            for r in rows:
                c.execute(upsert_sql, r)
                upserted += 1
            jlog("db.upsert.ok", rows=upserted, ms=round((time.perf_counter()-s)*1000,1))

            # insert kb_fact_links for recipients (same transaction)
            try:
                if user_links_stash:
                    s2 = time.perf_counter()
                    for fact_id, primary_uid, recips_list, weight in user_links_stash:
                        kb_links_done += insert_user_links(c, fact_id, primary_uid, recips_list, weight=weight)
                    jlog("db.kb_user_links.ok", links=kb_links_done, ms=round((time.perf_counter()-s2)*1000,1))
                else:
                    jlog("db.kb_user_links.none")
            except Exception as e:
                jerr("db.kb_user_links.error", e)

    metrics["rows_upserted"] = upserted
    metrics["kb_user_links"] = kb_links_done

    cur.close(); conn.close()

    # save allocation checkpoint for the keys we finished
    if processed_now:
        processed_keys |= processed_now
        save_allocate_checkpoint(processed_keys)

    jlog("run.summary", **metrics)
    print(f"Stage-B complete. Upserted rows: {upserted}")

if __name__ == "__main__":
    main()