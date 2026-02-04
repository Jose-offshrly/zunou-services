# glue_parse_transcripts_stage_a.py
# Stage-A: Parse meeting transcripts, extract Decisions, Actions and Risks
import argparse,sys, os, re, json, boto3, psycopg2, urllib.parse as up, hashlib, uuid, datetime, time, traceback, logging
from boto3.session import Session

# ---------- args ----------
p = argparse.ArgumentParser()
p.add_argument("--GLUE_CONN", required=True, nargs="+")
p.add_argument("--MODEL_ID", required=True)  # LLM (classifier/parser/explainer)
p.add_argument("--EMBED_MODEL_ID", default="amazon.titan-embed-text-v2:0")  # Titan v2 embeddings
p.add_argument("--EMBED_DIM", type=int, default=1024)
p.add_argument("--CONF_THRESHOLD", type=float, default=0.6)
p.add_argument("--S3_BUCKET", required=True)
p.add_argument("--S3_PREFIX", default="")  # e.g. "meeting-insights/"
p.add_argument("--CHECKPOINT_BUCKET", required=True)
p.add_argument("--CHECKPOINT_KEY",   required=True)  # e.g. "meeting-insights/state/parse_checkpoint.json"
p.add_argument("--INITIAL_DAYS", type=int, default=1) # if no checkpoint yet
p.add_argument("--BATCH_SIZE",  type=int, default=200)
p.add_argument("--REGION", default=os.environ.get("AWS_REGION","ap-northeast-1"))
p.add_argument("--LOG_LEVEL", default=os.environ.get("LOG_LEVEL","INFO"))
# ----- new verbosity controls -----
p.add_argument("--TRACE", action="store_true", help="Log truncated prompts/responses and previews")
p.add_argument("--TRACE_MAX", type=int, default=800, help="Max chars for trace previews")
p.add_argument("--REDACT_PII", action="store_true", help="Mask emails and UUIDs in TRACE logs")
args, _ = p.parse_known_args()
GLUE_CONN = " ".join(args.GLUE_CONN)
# NEW: define LOG_LEVEL for jtrace() checks
LOG_LEVEL = getattr(logging, str(args.LOG_LEVEL).upper(), logging.INFO)

# ---------- logging ----------
# ---------- logging (forced to stdout, unbuffered) ----------
def _setup_logging():
    level_name = str(args.LOG_LEVEL).upper()
    level = getattr(logging, level_name, logging.INFO)

    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],  # Glue-friendly: send JSON to stdout
        force=True,  # replace Glue's preconfigured handlers
    )

    # Quiet noisy libs
    for noisy in ("boto3", "botocore", "urllib3", "s3transfer"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Ensure unbuffered behavior for CloudWatch
    os.environ["PYTHONUNBUFFERED"] = "1"

_setup_logging()
RUN_ID = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:8]

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
UUID_RE  = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b")

def _setup_logging():
    level_name = str(args.LOG_LEVEL).upper()
    level = getattr(logging, level_name, logging.INFO)

    # Force reconfigure root logger (Glue sets its own handlers)
    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Quiet noisy libs (optional)
    for noisy in ("boto3", "botocore", "urllib3", "s3transfer"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    # Make stdout/stderr unbuffered in this process
    os.environ["PYTHONUNBUFFERED"] = "1"

_setup_logging()
RUN_ID = None

def _redact(s: str) -> str:
    if not s: return s
    t = s
    if args.REDACT_PII:
        t = EMAIL_RE.sub("[EMAIL]", t)
        t = UUID_RE.sub("[UUID]", t)
    return t

def _preview(s: str, n: int = None) -> str:
    if s is None: return ""
    n = n or int(args.TRACE_MAX)
    return (s[:n] + "…") if len(s) > n else s

def jlog(event, **fields):
    base = {
        "event": event,
        "run_id": RUN_ID,
        "ts_utc": datetime.datetime.utcnow().isoformat() + "Z",
    }
    base.update(fields)
    try:
        logging.info(json.dumps(base, ensure_ascii=False))
    finally:
        # Glue ships stdout continuously when continuous logging is on
        sys.stdout.flush()

def jtrace(event, **fields):
    # Only emit when --TRACE or DEBUG level
    if args.TRACE or LOG_LEVEL <= logging.DEBUG:
        # light redaction + truncation for large text fields
        safe_fields = {}
        for k,v in fields.items():
            if isinstance(v, str) and k in ("prompt_preview","response_preview","text_preview","explanation_preview","content_preview"):
                safe_fields[k] = _preview(_redact(v))
            else:
                safe_fields[k] = v
        jlog(event, **safe_fields)

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
session = Session(region_name=args.REGION)
glue = session.client("glue")
brt  = session.client("bedrock-runtime")
s3   = session.client("s3")

# ---------- DB helpers ----------
def get_conn_props(name):
    props = glue.get_connection(Name=name)["Connection"]["ConnectionProperties"]
    jdbc  = props["JDBC_CONNECTION_URL"]; user, pw = props["USERNAME"], props["PASSWORD"]
    url   = "postgresql://" + jdbc.split("jdbc:postgresql://",1)[1]
    pu    = up.urlparse(url)
    return {"host": pu.hostname, "port": pu.port or 5432, "db": (pu.path or "/vapor").lstrip("/") or "vapor",
            "user": user, "pw": pw}

def pg_conn():
    c = get_conn_props(GLUE_CONN)
    jlog("db.connect.begin", host=c["host"], port=c["port"], db=c["db"])
    conn = psycopg2.connect(host=c["host"], port=c["port"], dbname=c["db"],
                            user=c["user"], password=c["pw"], sslmode="require")
    jlog("db.connect.ok")
    return conn

def detect_id_type(conn):
    with conn.cursor() as c:
        c.execute("""
          SELECT data_type
          FROM information_schema.columns
          WHERE table_schema='public' AND table_name='transcripts' AND column_name='id'
        """)
        row = c.fetchone()
    dtype = (row[0] if row else "uuid").lower()
    jlog("db.transcripts.id_type", id_type=dtype)
    return dtype

# ---------- checkpoint (S3) ----------
def load_checkpoint():
    try:
        jlog("checkpoint.load.begin", bucket=args.CHECKPOINT_BUCKET, key=args.CHECKPOINT_KEY)
        obj = s3.get_object(Bucket=args.CHECKPOINT_BUCKET, Key=args.CHECKPOINT_KEY)
        data = json.loads(obj["Body"].read())
        ts = data.get("last_created_at")
        last_id = data.get("last_id")  # keep as string
        since_ts = datetime.datetime.fromisoformat(ts) if ts else None
        # NEW: IDs already processed at exactly last_created_at
        done_ids = set(str(x) for x in (data.get("done_ids_at_ts") or []))
        jlog("checkpoint.load.ok", last_created_at=ts, last_id=last_id, done_ids_at_ts=len(done_ids))
        return since_ts, done_ids
    except s3.exceptions.NoSuchKey:
        jlog("checkpoint.load.missing")
        return None, set()
    except Exception as e:
        jerr("checkpoint.load.error", e)
        return None, set()

def save_checkpoint(last_created_at, done_ids_at_ts, last_id=None):
    payload = {
        "last_created_at": last_created_at.isoformat() if last_created_at else None,
        "last_id": str(last_id) if last_id is not None else None,  # keep for back-compat/visibility
        "done_ids_at_ts": sorted(list(done_ids_at_ts)) if done_ids_at_ts else [],
        "saved_at_utc": datetime.datetime.utcnow().isoformat() + "Z"
    }
    s3.put_object(Bucket=args.CHECKPOINT_BUCKET, Key=args.CHECKPOINT_KEY,
                  Body=json.dumps(payload).encode("utf-8"))
    jlog("checkpoint.save.ok", last_created_at=payload["last_created_at"], last_id=payload["last_id"], done_ids_at_ts=len(payload["done_ids_at_ts"]))

# ---------- small utils ----------
def put_text(bucket, key, text):
    s = time.perf_counter()
    s3.put_object(Bucket=bucket, Key=key, Body=text.encode("utf-8"))
    jlog("s3.put.ok", bucket=bucket, key=key, bytes=len(text.encode("utf-8")),
         ms=round((time.perf_counter()-s)*1000,1))

def grab(pat, text):
    m = re.search(pat, text, re.IGNORECASE|re.MULTILINE)
    return m.group(1).strip() if m else None

def parse_meta(content, meeting_id_value):
    plist = []
    pm = re.search(r"^Participants:\s*(\[[^\n]*\])", content, re.IGNORECASE|re.MULTILINE)
    if pm:
        raw = pm.group(1)
        try: plist = json.loads(raw)
        except: plist = [s.strip() for s in raw.strip()[1:-1].split(",") if s.strip()]
    meta = {
        "meeting_id": meeting_id_value or "unknown",
        "meeting_title": grab(r"^Title:\s*(.+)$", content) or grab(r"^EXT:\s*(.+)$", content) or "Unknown",
        "meeting_datetime": grab(r"^Date:\s*([^\n]+)$", content) or "",
        "timezone": "Asia/Tokyo",
        "participants": plist,
    }
    jtrace("parse.meta", meeting_id=str(meeting_id_value), title=_preview(_redact(meta["meeting_title"]), 160),
           participants_count=len(plist))
    return meta

def parse_chunks(content):
    body  = content.split("### Transcript:",1)[1] if "### Transcript:" in content else content
    lines, i = [], 1
    speakers = set()
    for line in body.splitlines():
        line=line.strip()
        if not line: continue
        m = re.match(r"^\[(.*?)\]\s*([^:]+?):\s*(.+)$", line)
        if m:
            ts, spk, txt = m.groups()
            speakers.add(spk.strip())
            lines.append({"i": i, "ts": ts, "speaker": spk.strip(), "text": txt.strip()}); i += 1
    jtrace("parse.chunks", lines=len(lines), speakers=len(speakers),
           first_lines=_preview("\n".join([f"{l['i']}: {l['speaker']}: {l['text']}" for l in lines[:5]])))
    return [{"chunk_id":"CHK_1","lines":lines}]

def _invoke_bedrock(model_id, body, label, extra=None):
    try:
        prompt_text = ""
        try:
            # for Anthropic payload, extract the first text segment for trace preview
            if isinstance(body, dict):
                msg = (body.get("messages") or [{}])[0]
                cont = (msg.get("content") or [{}])[0]
                prompt_text = cont.get("text","")
        except Exception:
            pass
        jtrace("bedrock.invoke.begin", call=label, model_id=model_id,
               prompt_chars=len(prompt_text), prompt_preview=_preview(_redact(prompt_text)))
        s = time.perf_counter()
        resp = brt.invoke_model(
            modelId=model_id,
            body=json.dumps(body).encode("utf-8"),
            contentType="application/json",
            accept="application/json"
        )
        ms = round((time.perf_counter()-s)*1000,1)
        out = json.loads(resp["body"].read())
        content_txt = ""
        if isinstance(out.get("content"), list):
            content_txt = "".join([c.get("text","") for c in out.get("content",[])])
        jlog("bedrock.invoke.ok", call=label, model_id=model_id, ms=ms,
             resp_chars=len(content_txt), **(extra or {}))
        jtrace("bedrock.invoke.resp", call=label, response_preview=_preview(_redact(content_txt)))
        return out, content_txt
    except Exception as e:
        jerr("bedrock.invoke.error", e, call=label)
        raise

def invoke_bedrock_json(model_id, prompt_text, max_tokens=800, call_label="generic"):
    body = {
      "anthropic_version":"bedrock-2023-05-31",
      "messages":[{"role":"user","content":[{"type":"text","text": prompt_text}]}],
      "max_tokens": max_tokens, "temperature": 0
    }
    out, txt = _invoke_bedrock(model_id, body, call_label, {"max_tokens": max_tokens, "prompt_chars": len(prompt_text)})
    if not txt.strip().startswith("{"):
        s,e = txt.find("{"), txt.rfind("}")
        if s>=0 and e>s: txt = txt[s:e+1]
    try:
        return json.loads(txt)
    except Exception as e:
        jerr("bedrock.parse_json.error", e, call=call_label, preview=_preview(_redact(txt)))
        raise

# ---------- EMBEDDINGS (Titan v2) ----------
def titan_embed(text: str, dim: int = 1024):
    """Return float list or None on error."""
    try:
        payload = {"inputText": (text or "")[:50000], "dimensions": int(dim)}
        jtrace("embed.begin", dim=dim, input_chars=len(payload["inputText"]),
               text_preview=_preview(_redact(payload["inputText"]), 200))
        s = time.perf_counter()
        resp = brt.invoke_model(
            modelId=args.EMBED_MODEL_ID,
            body=json.dumps(payload).encode("utf-8"),
            contentType="application/json",
            accept="application/json",
        )
        ms = round((time.perf_counter()-s)*1000,1)
        out = json.loads(resp["body"].read())
        vec = out.get("embedding")
        if isinstance(vec, dict):
            vec = vec.get("values") or vec.get("embedding")
        if not isinstance(vec, list):
            jlog("embed.missing_vector", dim=dim, ms=ms)
            return None
        jlog("embed.ok", dim=dim, ms=ms, returned=len(vec))
        return [float(x) for x in vec]
    except Exception as e:
        jerr("embed.error", e)
        return None

def vector_literal(vec):
    if not vec: return None
    return "[" + ",".join(f"{float(x):.6f}" for x in vec) + "]"

# ---------- prompts (hardened) ----------
TEST_KWS = re.compile(r"\b(test|testing|mic\s*check|dummy|sample|just\s*(to\s*)?(test|check)|end\s*(recording|call)|remove\s*(from\s*)?(call|meeting)|weekly|recurring|MonWedFri|MWTF)\b", re.I)
BIZ_KWS  = re.compile(r"\b(action\s*item|assign(ed)?|owner|due|deadline|pr|pull\s*request|issue|bug|decision|approve(d)?|eta|deploy|rollback|sprint|roadmap|stakeholder|budget|kpi|revenue)\b", re.I)

def classifier_prompt(text, threshold, title, participants, signals):
    sample = text[:12000]
    return f"""
Return VALID JSON ONLY:
{{"is_meeting": true|false, "label": "meeting"|"junk", "confidence": 0.0-1.0, "short_reason": "one line"}}
CONTEXT_METRICS: {json.dumps({"title": title, "participants_count": len(participants or [])}, ensure_ascii=False)}
SIGNALS: {json.dumps(signals, ensure_ascii=False)}
If uncertain (confidence < {threshold}), set is_meeting=false.
TEXT:
<<<
{sample}
>>>
""".strip()

def parser_prompt(meta, chunks):
    return f"""
Output STRICT JSON only:
{{
  "meeting_id": "string",
  "items": [
    {{
      "type": "action" | "decision" | "risk",
      "topic": "string",
      "description": "string",
      "owner_user_id": "string?",
      "owner_name": "string?",
      "owner_resolution": {{
        "status": "explicit" | "implicit" | "unknown",
        "owner_name": "string?",
        "owner_email": "string?",
        "confidence": 0.0-1.0,
        "rationale": "string",
        "evidence": [{{ "chunk_id":"string", "line_range":[start_int,end_int] }}],
        "candidates": [{{"name":"string","confidence":0.0-1.0}}]?
      }},
      "due": "YYYY-MM-DD?",
      "priority": "low" | "medium" | "high"?,
      "evidence": [{{ "chunk_id":"string", "line_range":[start_int,end_int] }}]
    }}
  ]
}}
MEETING_META: {json.dumps({k: meta[k] for k in ["meeting_id","meeting_title","meeting_datetime","timezone"]}, ensure_ascii=False)}
TRANSCRIPT_CHUNKS: {json.dumps(chunks, ensure_ascii=False)}

Rules:
- JSON only; max 20 items; no extra keys beyond schema.
- Always provide owner_resolution:
  - **explicit** if a name/email/UUID is directly tied to the task.
  - **implicit** if inferred via pronouns or nearby references (look ±10 lines; resolve “he/she/they/you” to the most recent named speaker).
  - **unknown** if not inferable.
- If both owner_user_id/owner_name are present, keep them and also fill owner_resolution.
- Evidence must cite where the assignment/decision/risk is stated (and where the owner is implied, if implicit).
""".strip()

def explainer_prompt(meta, item, context_snippet):
    return f"""
Return VALID JSON ONLY: {{"explanation": "80-150 words, business-friendly, based only on EVIDENCE_SNIPPET."}}
MEETING_TITLE: {meta['meeting_title']}
ITEM: {json.dumps(item, ensure_ascii=False)}
EVIDENCE_SNIPPET: {json.dumps(context_snippet, ensure_ascii=False)}
""".strip()

# --- entity extraction prompt ---
def entity_prompt(meta, item, context_snippet):
    return f"""
Return STRICT JSON ONLY:
{{"entities":[
  {{"kind":"customer|feature|project|metric|topic|doc","name":"string","aliases":["string"]?}}
]}}

Scope:
- Use ITEM.topic/description and EVIDENCE_SNIPPET only.
- Prefer concise, canonical names (no noise like “the team”).
- Kinds:
  - customer: client/org names (Acme Corp)
  - feature: product/module/capability (Auth0 login, Calendar sync)
  - project: internal project names (Phoenix, V2 rewrite)
  - metric: KPIs or metrics referenced (NPS, churn)
  - topic: general topics (Billing, Onboarding)
  - doc: docs/PRDs/specs if clearly referenced

ITEM: {json.dumps({"type": item.get("type"), "topic": item.get("topic"), "description": item.get("description")}, ensure_ascii=False)}
EVIDENCE_SNIPPET: {json.dumps(context_snippet, ensure_ascii=False)}
""".strip()

def compute_signals(title, participants, lines):
    speakers = { (l.get("speaker") or "").strip().lower() for l in lines if l.get("speaker") }
    text = " ".join(l.get("text","") for l in lines)[:20000].lower()
    toks = re.findall(r"[a-z0-9]+", text); ttr = (len(set(toks))/len(toks)) if toks else 0.0
    rep = sum(1 for i in range(1,len(lines)) if (lines[i].get("text","")[:50].strip().lower()==lines[i-1].get("text","")[:50].strip().lower()))
    repeat_ratio = rep / max(1, len(lines)-1)
    hard_flags = {
        "short_and_testy": (len(lines)<=6 and len(speakers)<=2 and TEST_KWS.search(text) and not BIZ_KWS.search(text)),
        "low_diversity":   (ttr<0.35 and TEST_KWS.search(text) and not BIZ_KWS.search(text)),
        "title_event":     (re.search(r"\b(event|weekly|MonWedFri|MWTF|skip)\b", title or "", re.I) and len(lines)<15 and not BIZ_KWS.search(text)),
        "repeat_low_spk":  (repeat_ratio>=0.4 and len(speakers)<=2 and not BIZ_KWS.search(text)),
    }
    return {"line_count":len(lines),"speaker_count":len(speakers),"ttr":round(ttr,3),
            "test_kw":len(TEST_KWS.findall(text)),"biz_kw":len(BIZ_KWS.findall(text)),
            "repeat_ratio":round(repeat_ratio,3),"hard_flags":hard_flags}

def early_junk(sig): return any(sig.get("hard_flags",{}).values())

def lines_to_snippet(lines, start, end, pad=2, max_chars=800):
    start = max(1, int(start) - pad); end = int(end) + pad
    sel = [l for l in lines if start <= l["i"] <= end]
    text = "\n".join(f"{l['i']}: {l['speaker']}: {l['text']}" for l in sel)
    return (text[:max_chars] + "…") if len(text) > max_chars else text

def build_context_snippet(chunks, item):
    if not item.get("evidence"): return ""
    lines = []
    for ch in chunks:
        if ch["chunk_id"] == item["evidence"][0]["chunk_id"]:
            lines = ch["lines"]; break
    if not lines: return ""
    out = []
    for ev in item["evidence"][:2]:
        lr = ev.get("line_range", [])
        if isinstance(lr, list) and len(lr)==2:
            out.append(lines_to_snippet(lines, lr[0], lr[1]))
    return "\n---\n".join(out)

def _norm(s): return re.sub(r"\s+"," ", (s or "").strip().lower())

def stable_item_hash(meeting_id, item):
    base = {
        "ns": "live-insights:v1",
        "meeting_id": _norm(meeting_id),
        "type": _norm(item.get("type","")),
        "topic": _norm(item.get("topic","")),
        "evidence": sorted([
            {"chunk_id": e.get("chunk_id",""),
             "start": int(e.get("line_range",[0,0])[0]),
             "end":   int(e.get("line_range",[0,0])[1])}
            for e in (item.get("evidence") or [])[:2]
        ], key=lambda x:(x["chunk_id"], x["start"], x["end"]))
    }
    h = hashlib.sha256(json.dumps(base, separators=(",",":"), sort_keys=True).encode())
    return h.hexdigest()[:32]

# ---------- KB helpers ----------
def canonicalize_item(item):
    t = (item.get("type") or "").strip().lower()
    topic = (item.get("topic") or "").strip()
    desc = (item.get("description") or "").strip()
    canonical = f"[{t}] {topic} — {desc}".strip()
    canon_norm = _norm(canonical)
    can_hash = hashlib.sha256(canon_norm.encode("utf-8")).hexdigest()
    return canonical, can_hash

def identity_hash_for_item(item):
    # Stable identity from type + topic only (description changes become text_changed events)
    t = (item.get("type") or "").strip().lower()
    topic = (item.get("topic") or "").strip().lower()
    base = f"{t}|{topic}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()

def parse_due_ts(item):
    d = (item.get("due") or "").strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", d):
        try:
            return datetime.datetime.fromisoformat(d + "T00:00:00+00:00")
        except Exception:
            return None
    return None

def to_jsonb(v):
    return json.dumps(v, ensure_ascii=False)

def upsert_kb_fact(cur, pulse_id, meeting_id, item, conf_default=0.70):
    """
    Returns fact_id (UUID as string) and the canonical_hash used.
    """
    canonical_text, canonical_hash = canonicalize_item(item)
    status = "open"
    try:
        owner_status = (item.get("owner_resolution",{}).get("status") or "").lower()
        evid = item.get("evidence") or []
        conf = float(item.get("owner_confidence") or conf_default)
        conf = min(0.95, max(conf, 0.50 + 0.05 * min(len(evid), 4) + (0.05 if owner_status == "explicit" else 0.0)))
    except Exception:
        conf = conf_default

    jtrace("kb.fact.prepare", canonical_preview=_preview(_redact(canonical_text), 240),
           canonical_hash=canonical_hash, owner_status=item.get("owner_resolution",{}).get("status"),
           evidence_spans=len(item.get("evidence") or []), conf=conf)

    vec = titan_embed(canonical_text, args.EMBED_DIM)
    vec_lit = vector_literal(vec)

    source_spans = item.get("evidence") or []
    cand_assignees = (item.get("owner_resolution") or {}).get("candidates") or []

    owner_user_id = item.get("owner_user_id")
    if not (owner_user_id and re.match(r"^[0-9a-fA-F-]{36}$", str(owner_user_id))):
        owner_user_id = None

    due_at = parse_due_ts(item)

    sql = """
    INSERT INTO kb_facts
      (id, pulse_id, meeting_id, type, canonical_text, topic, status,
       owner_user_id, candidate_assignees, due_at, confidence, source_spans,
       first_seen_at, last_seen_at, canonical_hash, embedding, created_at, updated_at)
    VALUES
      (%(id)s, %(pulse_id)s, %(meeting_id)s, %(type)s, %(canonical_text)s, %(topic)s, %(status)s,
       %(owner_user_id)s, %(candidate_assignees)s::jsonb, %(due_at)s, %(confidence)s, %(source_spans)s::jsonb,
       NOW(), NOW(), %(canonical_hash)s,
       CASE WHEN %(embedding)s IS NULL THEN NULL ELSE %(embedding)s::vector END,
       NOW(), NOW())
    ON CONFLICT (canonical_hash) DO UPDATE
    SET last_seen_at = NOW(),
        confidence   = GREATEST(kb_facts.confidence, EXCLUDED.confidence),
        meeting_id   = EXCLUDED.meeting_id,
        pulse_id     = EXCLUDED.pulse_id,
        topic        = COALESCE(EXCLUDED.topic, kb_facts.topic),
        embedding    = COALESCE(EXCLUDED.embedding, kb_facts.embedding),
        updated_at   = NOW()
    RETURNING id::text;
    """
    pid = str(uuid.uuid4())
    params = {
        "id": pid,
        "pulse_id": str(pulse_id) if pulse_id else None,
        "meeting_id": str(meeting_id) if meeting_id else None,
        "type": item.get("type"),
        "canonical_text": canonical_text,
        "topic": item.get("topic"),
        "status": status,
        "owner_user_id": owner_user_id,
        "candidate_assignees": to_jsonb(cand_assignees),
        "due_at": due_at,
        "confidence": conf,
        "source_spans": to_jsonb(source_spans),
        "canonical_hash": canonical_hash,
        "embedding": vec_lit,
    }
    cur.execute(sql, params)
    fact_id = cur.fetchone()[0]
    jlog("kb.fact.upserted", fact_id=fact_id, canonical_hash=canonical_hash,
         owner_user_id=str(owner_user_id) if owner_user_id else None,
         embedding_present=bool(vec_lit), confidence=conf)
    # Optional: link owner
    if owner_user_id:
        try:
            # --- normalize to_type based on DB CHECK constraint ---
            to_type_user = normalize_link_to_type(cur, "user")
            cur.execute("""
                INSERT INTO kb_fact_links (fact_id, to_type, to_id, relation, weight, created_at, updated_at)
                VALUES (%s, %s, %s, 'assigned_to', %s, NOW(), NOW())
                ON CONFLICT DO NOTHING
            """, (fact_id, to_type_user, owner_user_id, params["confidence"]))
            jtrace("kb.fact.link_owner", fact_id=fact_id, owner_user_id=str(owner_user_id))
        except Exception as e:
            jerr("kb.link_owner.error", e, fact_id=fact_id, owner_user_id=str(owner_user_id))

    return fact_id, canonical_hash

# --- entities upsert/link helpers ---
def upsert_kb_entity(cur, pulse_id, kind, name, aliases, embed_dim):
    if not (pulse_id and kind and name):
        return None, None

    cur.execute("""
        SELECT id::text, COALESCE(aliases,'[]'::jsonb)
        FROM kb_entities
        WHERE pulse_id=%s::uuid AND kind=%s AND lower(name)=lower(%s)
        LIMIT 1
    """, (str(pulse_id), kind, name))
    row = cur.fetchone()

    alias_txt = ", ".join(aliases or [])[:400]
    vec = titan_embed((name + (" | " + alias_txt if alias_txt else ""))[:50000], embed_dim)
    vec_lit = vector_literal(vec)

    if row:
        ent_id, existing_aliases = row[0], row[1]
        try:
            if isinstance(existing_aliases, str):
                existing = set(json.loads(existing_aliases) or [])
            else:
                existing = set(existing_aliases or [])
        except Exception:
            existing = set()
        new_aliases = list(sorted(existing.union(set(aliases or []))))
        cur.execute("""
            UPDATE kb_entities
            SET aliases = %s::jsonb,
                embedding = COALESCE(CASE WHEN %s IS NULL THEN NULL ELSE %s::vector END, embedding),
                updated_at = NOW()
            WHERE id=%s::uuid
        """, (json.dumps(new_aliases, ensure_ascii=False), vec_lit, vec_lit, ent_id))
        jlog("kb.entity.updated", entity_id=ent_id, kind=kind, name=name, alias_count=len(new_aliases),
             embedding_updated=bool(vec_lit))
        return ent_id, "update"
    else:
        ent_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO kb_entities (id, pulse_id, kind, name, aliases, embedding, created_at, updated_at)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s::jsonb,
              CASE WHEN %s IS NULL THEN NULL ELSE %s::vector END,
              NOW(), NOW())
        """, (ent_id, str(pulse_id), kind, name, json.dumps(aliases or [], ensure_ascii=False), vec_lit, vec_lit))
        jlog("kb.entity.inserted", entity_id=ent_id, kind=kind, name=name, alias_count=len(aliases or []),
             embedding_present=bool(vec_lit))
        return ent_id, "insert"

# --- NEW: to_type normalization for kb_fact_links (introspect CHECK constraint) ---
LINK_TO_TYPE_OPTIONS = None
def load_link_to_type_options(cur):
    global LINK_TO_TYPE_OPTIONS
    if LINK_TO_TYPE_OPTIONS is not None:
        return LINK_TO_TYPE_OPTIONS
    try:
        cur.execute("""
          SELECT pg_get_constraintdef(c.oid)
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          WHERE t.relname='kb_fact_links' AND c.conname='kb_fact_links_to_type_check'
        """)
        row = cur.fetchone()
        opts = []
        if row and row[0]:
            opts = [m for m in re.findall(r"'([^']+)'", row[0]) if m]
        LINK_TO_TYPE_OPTIONS = opts or ["user","kb_entity","entity","pulse","meeting"]
        jlog("kb.link.to_type.options", options=LINK_TO_TYPE_OPTIONS)
    except Exception as e:
        jerr("kb.link.to_type.inspect.error", e)
        LINK_TO_TYPE_OPTIONS = ["user","kb_entity","entity","pulse","meeting"]
    return LINK_TO_TYPE_OPTIONS

def normalize_link_to_type(_cur, desired: str) -> str:
    d = (desired or "").strip().lower()
    # Force deterministic mapping
    if d in ("user", "kb_entity", "pulse", "meeting"):
        return d
    if d in ("entity",):
        return "kb_entity"
    # Last resort: never map entities to user
    return d

def link_fact_entity(cur, fact_id, entity_id, relation="mentions", weight=None):
    if not (fact_id and entity_id): return
    # --- normalize to_type for entities ---
    to_type_entity = normalize_link_to_type(cur, "entity")
    cur.execute("""
        INSERT INTO kb_fact_links (fact_id, to_type, to_id, relation, weight, created_at, updated_at)
        VALUES (%s::uuid, %s, %s::uuid, %s, %s, NOW(), NOW())
        ON CONFLICT DO NOTHING
    """, (fact_id, to_type_entity, entity_id, relation, weight))
    jtrace("kb.fact.link_entity", fact_id=fact_id, entity_id=entity_id, relation=relation)

def extract_entities(meta, item, chunks):
    ctx = build_context_snippet(chunks, item)
    seeded = []
    if (item.get("topic") or "").strip():
        seeded.append({"kind":"topic","name":item["topic"].strip(),"aliases":[]})
    try:
        out = invoke_bedrock_json(args.MODEL_ID, entity_prompt(meta, item, ctx), max_tokens=400, call_label="entities")
        ents = out.get("entities", []) if isinstance(out, dict) else []
    except Exception as e:
        jerr("entities.extract.error", e, topic=item.get("topic"))
        ents = []
    seen, final = set(), []
    for e in (seeded + ents)[:20]:
        kind = (e.get("kind") or "").strip().lower()
        name = (e.get("name") or "").strip()
        if not (kind and name): continue
        k = (kind, name.lower())
        if k in seen: continue
        seen.add(k)
        final.append({"kind": kind, "name": name, "aliases": e.get("aliases") or []})
    jtrace("entities.extracted", count=len(final), names=[f"{e['kind']}:{e['name']}" for e in final[:8]])
    return final

# ---------- fetching new rows ----------
def initial_since():
    return datetime.datetime.utcnow() - datetime.timedelta(days=int(args.INITIAL_DAYS))

def fetch_new_batch(cur, since_ts, done_ids_at_ts, limit, id_type=None):
    # id_type is unused now; kept in signature for compatibility with callers/logging
    ids_list = list(done_ids_at_ts or [])
    sql = """
      SELECT id,
             data_source_id,
             meeting_id,
             content,
             created_at
      FROM public.transcripts
      WHERE created_at IS NOT NULL
        AND (
              created_at > %s
           OR (created_at = %s AND NOT (id = ANY(%s::uuid[])))
        )
      ORDER BY created_at ASC, id ASC
      LIMIT %s
    """
    s = time.perf_counter()
    cur.execute(sql, (since_ts, since_ts, ids_list, limit))
    rows = cur.fetchall()
    jlog("db.fetch_batch.ok",
         since_ts=str(since_ts), since_id=str(f"{len(ids_list)} ids@ts"),  # keep key name for logging continuity
         limit=limit, returned=len(rows),
         ms=round((time.perf_counter()-s)*1000,1))
    return rows

# ---------- meeting -> pulse cache ----------
def ensure_pulse_id(cur, mid, cache):
    if mid in cache:
        return cache[mid]
    cur.execute("SELECT pulse_id::text FROM meetings WHERE id=%s::uuid", (str(mid),))
    row = cur.fetchone()
    cache[mid] = row[0] if row and row[0] else None
    jtrace("meeting.pulse_lookup", meeting_id=str(mid), pulse_id=cache[mid])
    return cache[mid]

# --- NEW: pulse -> organization cache/lookup ---
def ensure_org_id_for_pulse(cur, pid, cache):
    if not pid:
        return None
    if pid in cache:
        return cache[pid]
    cur.execute("SELECT organization_id::text FROM pulses WHERE id=%s::uuid", (str(pid),))
    row = cur.fetchone()
    cache[pid] = row[0] if row and row[0] else None
    jtrace("pulse.org_lookup", pulse_id=str(pid), organization_id=cache[pid])
    return cache[pid]

# ---------- main ----------
def main():
    global RUN_ID
    RUN_ID = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:8]

    print('{"probe":"main_enter"}'); sys.stdout.flush()
    jlog("startup", region=args.REGION, glue_conn=GLUE_CONN, s3_bucket=args.S3_BUCKET,
         s3_prefix=args.S3_PREFIX, model_id=args.MODEL_ID, embed_model_id=args.EMBED_MODEL_ID,
         conf_threshold=args.CONF_THRESHOLD, batch_size=args.BATCH_SIZE, log_level=str(args.LOG_LEVEL).upper(),
         trace=args.TRACE, trace_max=args.TRACE_MAX, redact_pii=args.REDACT_PII)
    
    
    conn = pg_conn()
    cur  = conn.cursor()

    id_type = detect_id_type(conn)
    since_ts, done_ids_at_ts = load_checkpoint()
    if since_ts is None:
        since_ts = initial_since()
        done_ids_at_ts = set()
        jlog("checkpoint.starting_from_default", initial_days=args.INITIAL_DAYS, since_ts=str(since_ts), id_type=id_type)

    root = args.S3_PREFIX.strip("/")
    root = (root + "/") if root else ""

    # metrics
    metrics = {
        "transcripts_seen": 0,
        "skipped_empty": 0,
        "skipped_heuristic": 0,
        "skipped_classifier": 0,
        "classifier_errors": 0,
        "parse_errors": 0,
        "items_total": 0,
        "kb_upserts": 0,
        "kb_errors": 0,
        "entities_upserted": 0,
        "entity_errors": 0,
        "explainer_errors": 0,
        "files_written": 0
    }

    last_ts = since_ts
    last_id = None                             # FIX: was since_id (no longer exists)
    last_ts_done_ids = set(done_ids_at_ts)     # FIX: ensure defined before first fetch
    mid_to_pulse = {}
    pulse_to_org = {}  # NEW: cache for pulse -> organization

    while True:
        rows = fetch_new_batch(cur, since_ts=last_ts, done_ids_at_ts=last_ts_done_ids, limit=args.BATCH_SIZE, id_type=id_type)
        if not rows:
            break

        for (tid, dsid, mid, content, created_at) in rows:
            metrics["transcripts_seen"] += 1
            created_at = created_at or last_ts

            # if timestamp advanced, reset per-ts done set
            if created_at > last_ts:
                last_ts = created_at
                last_ts_done_ids = set()

            ingest_date = created_at.date().isoformat()

            meeting_id_value = mid or dsid
            if not mid:
                jlog("transcript.warn.missing_meeting_id_using_dsid",
                     transcript_id=str(tid), data_source_id=str(dsid))

            jlog("transcript.begin",
                 transcript_id=str(tid),
                 data_source_id=str(dsid),
                 meeting_id=str(meeting_id_value),
                 created_at=str(created_at),
                 content_chars=len(content or ""))

            if not content:
                metrics["skipped_empty"] += 1
                jlog("transcript.skip.empty", transcript_id=str(tid))
                # advance checkpoint cursor (timestamp-only) + mark id done at ts
                last_ts, last_id = created_at, str(tid)
                last_ts_done_ids.add(str(tid))
                continue

            meta   = parse_meta(content, meeting_id_value)
            chunks = parse_chunks(content)
            lines  = chunks[0]["lines"] if chunks else []
            signals= compute_signals(meta["meeting_title"], meta.get("participants",[]), lines)
            jlog("transcript.metrics",
                 transcript_id=str(tid),
                 line_count=len(lines),
                 speaker_count=signals.get("speaker_count"),
                 test_kw=signals.get("test_kw"),
                 biz_kw=signals.get("biz_kw"),
                 repeat_ratio=signals.get("repeat_ratio"),
                 hard_flags=signals.get("hard_flags"))

            # heuristic
            if early_junk(signals):
                metrics["skipped_heuristic"] += 1
                jlog("transcript.skip.heuristic", transcript_id=str(tid), hard_flags=signals.get("hard_flags"))
                # advance checkpoint cursor (timestamp-only) + mark id done at ts
                last_ts, last_id = created_at, str(tid)
                last_ts_done_ids.add(str(tid))
                continue

            # classify
            try:
                cls = invoke_bedrock_json(
                    args.MODEL_ID,
                    classifier_prompt(content, args.CONF_THRESHOLD, meta["meeting_title"], meta.get("participants",[]), signals),
                    max_tokens=200,
                    call_label="classifier"
                )
                conf = float(cls.get("confidence",0))
                jlog("classifier.result",
                     transcript_id=str(tid),
                     is_meeting=bool(cls.get("is_meeting",False)),
                     confidence=conf,
                     short_reason=cls.get("short_reason"))
                if not cls.get("is_meeting",False) or conf < args.CONF_THRESHOLD:
                    metrics["skipped_classifier"] += 1
                    jlog("transcript.skip.classifier", transcript_id=str(tid), confidence=conf)
                    # advance checkpoint cursor (timestamp-only) + mark id done at ts
                    last_ts, last_id = created_at, tid
                    last_ts_done_ids.add(str(tid))
                    continue
            except Exception as e:
                metrics["classifier_errors"] += 1
                jerr("classifier.error", e, transcript_id=str(tid))
                # advance checkpoint cursor (timestamp-only) + mark id done at ts
                last_ts, last_id = created_at, tid
                last_ts_done_ids.add(str(tid))
                continue

            # parse
            try:
                parsed = invoke_bedrock_json(args.MODEL_ID, parser_prompt(meta, chunks), max_tokens=2500, call_label="parser")
                items = parsed.get("items",[])
                jlog("parser.result", transcript_id=str(tid), items_count=len(items))
                jtrace("parser.items.preview",
                       items=[{"type":i.get("type"),"topic":_preview(i.get("topic",""),120),"desc_len":len(i.get("description",""))} for i in items[:5]])
            except Exception as e:
                metrics["parse_errors"] += 1
                jerr("parser.error", e, transcript_id=str(tid))
                # advance checkpoint cursor (timestamp-only) + mark id done at ts
                last_ts, last_id = created_at, tid
                last_ts_done_ids.add(str(tid))
                continue

            # ensure pulse_id (for KB upsert)
            pulse_id = None
            organization_id = None
            try:
                if re.match(r"^[0-9a-fA-F-]{36}$", str(meta["meeting_id"])):
                    pulse_id = ensure_pulse_id(cur, meta["meeting_id"], mid_to_pulse)
                    # NEW: resolve organization_id from pulse (one org per pulse)
                    organization_id = ensure_org_id_for_pulse(cur, pulse_id, pulse_to_org) if pulse_id else None
            except Exception as e:
                jerr("pulse.lookup.error", e, meeting_id=str(meta["meeting_id"]))

            # explain + owner_confidence + hash + KB upsert + write JSONL
            jsonl_lines = []
            for it in items[:20]:
                ow = it.get("owner_resolution") or {}
                try:
                    it["owner_confidence"] = float(ow.get("confidence", 0))
                except Exception:
                    it["owner_confidence"] = 0.0

                jtrace("item.summary",
                       type=it.get("type"), topic=_preview(_redact(it.get("topic","")),180),
                       owner_status=ow.get("status"), owner_conf=it["owner_confidence"])

                # explanation
                try:
                    ctx = build_context_snippet(chunks, it)
                    exp = invoke_bedrock_json(args.MODEL_ID, explainer_prompt(meta, it, ctx), max_tokens=600, call_label="explainer")
                    it["explanation"] = (exp or {}).get("explanation") or it.get("description","")
                    jtrace("explainer.text", explanation_preview=_preview(_redact(it["explanation"])))
                except Exception as e:
                    metrics["explainer_errors"] += 1
                    it["explanation"] = it.get("description","")
                    jerr("explainer.error", e, transcript_id=str(tid), topic=it.get("topic"))

                ihash = stable_item_hash(meta["meeting_id"], it)
                it["item_hash"] = ihash
                jtrace("item.hash", item_hash=ihash)

                # ---- KB upsert ----
                kb_fact_id, canonical_hash = None, None
                try:
                    kb_fact_id, canonical_hash = upsert_kb_fact(cur,
                        pulse_id=pulse_id, meeting_id=meta["meeting_id"], item=it)
                    conn.commit()
                    metrics["kb_upserts"] += 1
                except Exception as e:
                    conn.rollback()
                    metrics["kb_errors"] += 1
                    jerr("kb.upsert.error", e, meeting_id=str(meta["meeting_id"]), topic=it.get("topic"))

                # ---- Entities: extract → upsert → link ----
                try:
                    if pulse_id and kb_fact_id:
                        ents = extract_entities(meta, it, chunks)
                        for e in ents:
                            ent_id, op = upsert_kb_entity(cur, pulse_id, e["kind"], e["name"], e.get("aliases") or [], args.EMBED_DIM)
                            if ent_id:
                                rel = "mentions"
                                if it.get("type") in ("action","risk") and e["kind"] in ("feature","project","customer"):
                                    rel = "affects"
                                link_fact_entity(cur, kb_fact_id, ent_id, relation=rel, weight=None)
                                metrics["entities_upserted"] += 1
                        conn.commit()
                except Exception as e:
                    conn.rollback()
                    metrics["entity_errors"] += 1
                    jerr("entities.upsert_or_link.error", e, kb_fact_id=kb_fact_id)

                rec = {
                    "meeting_id": meta["meeting_id"],
                    "meeting_title": meta["meeting_title"],
                    "pulse_id": pulse_id,                 # NEW
                    "organization_id": organization_id,   # NEW
                    "item_hash": ihash,
                    "canonical_hash": canonical_hash,
                    "kb_fact_id": kb_fact_id,
                    "item": it
                }
                jsonl_lines.append(json.dumps(rec, ensure_ascii=False))

            if jsonl_lines:
                key = f"{root}parsed/ingest_date={ingest_date}/meeting_id={meta['meeting_id']}/items.run_id={RUN_ID}.jsonl"
                put_text(args.S3_BUCKET, key, "\n".join(jsonl_lines))
                metrics["items_total"] += len(jsonl_lines)
                metrics["files_written"] += 1
                manifest = {"run_id": RUN_ID, "meeting_id": meta["meeting_id"], "transcript_id": tid,
                            "s3_key": key, "items_written": len(jsonl_lines)}
                mkey = f"{root}manifests/meeting_id={meta['meeting_id']}/run_id={RUN_ID}/manifest.json"
                put_text(args.S3_BUCKET, mkey, json.dumps(manifest))
                jlog("s3.write.items_and_manifest",
                     transcript_id=str(tid), key_items=key, key_manifest=mkey,
                     items=len(jsonl_lines))
            else:
                jlog("transcript.no_items", transcript_id=str(tid))

            # advance checkpoint cursor
            last_ts, last_id = created_at, tid
            last_ts_done_ids.add(str(tid))
            jlog("transcript.end", transcript_id=str(tid))

    # save checkpoint (only after loop completes)
    save_checkpoint(last_ts, last_ts_done_ids, last_id)
    cur.close(); conn.close()

    # final metrics
    jlog("run.summary", **metrics,
         last_checkpoint_ts=str(last_ts), last_checkpoint_id=str(last_id))
    print(f"Done. Items written: {metrics['items_total']}. Checkpoint → {last_ts} / id {last_id}")

if __name__ == "__main__":
    main()