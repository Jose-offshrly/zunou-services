# glue_parse_team_messages_stage_a.py
# Stage-A (team_messages): Parse ongoing team threads, extract Decisions, Actions and Risks

import argparse, sys, os, re, json, boto3, psycopg2, urllib.parse as up, hashlib, uuid, datetime, time, traceback, logging
from boto3.session import Session

# ---------- args ----------
p = argparse.ArgumentParser()
p.add_argument("--GLUE_CONN", required=True, nargs="+")
p.add_argument("--MODEL_ID", required=True)  # LLM (classifier/parser/explainer)
p.add_argument("--EMBED_MODEL_ID", default="amazon.titan-embed-text-v2:0")
p.add_argument("--EMBED_DIM", type=int, default=1024)
p.add_argument("--CONF_THRESHOLD", type=float, default=0.6)
p.add_argument("--S3_BUCKET", required=True)
p.add_argument("--S3_PREFIX", default="")  # e.g. "meeting-insights/"
p.add_argument("--CHECKPOINT_BUCKET", required=True)
p.add_argument("--CHECKPOINT_KEY", default="meeting-insights/state/team_messages_parse_checkpoint.json")
p.add_argument("--INITIAL_DAYS", type=int, default=1)
p.add_argument("--BATCH_SIZE", type=int, default=200)
p.add_argument("--REGION", default=os.environ.get("AWS_REGION", "ap-northeast-1"))
p.add_argument("--LOG_LEVEL", default=os.environ.get("LOG_LEVEL", "INFO"))
# verbosity / trace
p.add_argument("--TRACE", action="store_true", help="Log truncated prompts/responses and previews")
p.add_argument("--TRACE_MAX", type=int, default=800)
p.add_argument("--REDACT_PII", action="store_true")
args, _ = p.parse_known_args()
GLUE_CONN = " ".join(args.GLUE_CONN)
LOG_LEVEL = getattr(logging, str(args.LOG_LEVEL).upper(), logging.INFO)

# ---------- logging ----------
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
UUID_RE  = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\b")

def _setup_logging():
    level_name = str(args.LOG_LEVEL).upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )
    for noisy in ("boto3", "botocore", "urllib3", "s3transfer"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    os.environ["PYTHONUNBUFFERED"] = "1"

_setup_logging()
RUN_ID = None

def _redact(s: str) -> str:
    if not s:
        return s
    t = s
    if args.REDACT_PII:
        t = EMAIL_RE.sub("[EMAIL]", t)
        t = UUID_RE.sub("[UUID]", t)
    return t

def _preview(s: str, n: int = None) -> str:
    if s is None:
        return ""
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
        sys.stdout.flush()

def jtrace(event, **fields):
    if args.TRACE or LOG_LEVEL <= logging.DEBUG:
        safe_fields = {}
        for k, v in fields.items():
            if isinstance(v, str) and k in ("prompt_preview", "response_preview", "text_preview", "explanation_preview", "content_preview"):
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
    jdbc  = props["JDBC_CONNECTION_URL"]
    user, pw = props["USERNAME"], props["PASSWORD"]
    url   = "postgresql://" + jdbc.split("jdbc:postgresql://", 1)[1]
    pu    = up.urlparse(url)
    return {
        "host": pu.hostname,
        "port": pu.port or 5432,
        "db":   (pu.path or "/vapor").lstrip("/") or "vapor",
        "user": user,
        "pw":   pw,
    }

def pg_conn():
    c = get_conn_props(GLUE_CONN)
    jlog("db.connect.begin", host=c["host"], port=c["port"], db=c["db"])
    conn = psycopg2.connect(
        host=c["host"], port=c["port"], dbname=c["db"],
        user=c["user"], password=c["pw"], sslmode="require"
    )
    jlog("db.connect.ok")
    return conn

# ---------- checkpoint (S3, message-level) ----------
def load_checkpoint():
    try:
        jlog("checkpoint.load.begin", bucket=args.CHECKPOINT_BUCKET, key=args.CHECKPOINT_KEY)
        obj = s3.get_object(Bucket=args.CHECKPOINT_BUCKET, Key=args.CHECKPOINT_KEY)
        data = json.loads(obj["Body"].read())
        ts = data.get("last_created_at")
        last_id = data.get("last_id")
        done_ids = set(str(x) for x in (data.get("done_ids_at_ts") or []))
        since_ts = datetime.datetime.fromisoformat(ts) if ts else None
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
        "last_id": str(last_id) if last_id is not None else None,
        "done_ids_at_ts": sorted(list(done_ids_at_ts)) if done_ids_at_ts else [],
        "saved_at_utc": datetime.datetime.utcnow().isoformat() + "Z",
    }
    s3.put_object(
        Bucket=args.CHECKPOINT_BUCKET,
        Key=args.CHECKPOINT_KEY,
        Body=json.dumps(payload).encode("utf-8"),
    )
    jlog("checkpoint.save.ok",
         last_created_at=payload["last_created_at"],
         last_id=payload["last_id"],
         done_ids_at_ts=len(payload["done_ids_at_ts"]))

def initial_since():
    return datetime.datetime.utcnow() - datetime.timedelta(days=int(args.INITIAL_DAYS))

# ---------- small utils ----------
def put_text(bucket, key, text):
    s = time.perf_counter()
    s3.put_object(Bucket=bucket, Key=key, Body=text.encode("utf-8"))
    jlog("s3.put.ok", bucket=bucket, key=key, bytes=len(text.encode("utf-8")),
         ms=round((time.perf_counter() - s) * 1000, 1))

def _norm(s): return re.sub(r"\s+", " ", (s or "").strip().lower())

def to_jsonb(v): return json.dumps(v, ensure_ascii=False)

# ---------- Bedrock helper ----------
def _invoke_bedrock(model_id, body, label, extra=None):
    try:
        prompt_text = ""
        try:
            if isinstance(body, dict):
                msg = (body.get("messages") or [{}])[0]
                cont = (msg.get("content") or [{}])[0]
                prompt_text = cont.get("text", "")
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
        ms = round((time.perf_counter() - s) * 1000, 1)
        out = json.loads(resp["body"].read())
        content_txt = ""
        if isinstance(out.get("content"), list):
            content_txt = "".join([c.get("text", "") for c in out.get("content", [])])
        jlog("bedrock.invoke.ok", call=label, model_id=model_id, ms=ms,
             resp_chars=len(content_txt), **(extra or {}))
        jtrace("bedrock.invoke.resp", call=label, response_preview=_preview(_redact(content_txt)))
        return out, content_txt
    except Exception as e:
        jerr("bedrock.invoke.error", e, call=label)
        raise

def invoke_bedrock_json(model_id, prompt_text, max_tokens=800, call_label="generic"):
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt_text}]}],
        "max_tokens": max_tokens,
        "temperature": 0,
    }
    out, txt = _invoke_bedrock(model_id, body, call_label,
                               {"max_tokens": max_tokens, "prompt_chars": len(prompt_text)})
    if not txt.strip().startswith("{"):
        s, e = txt.find("{"), txt.rfind("}")
        if s >= 0 and e > s:
            txt = txt[s:e+1]
    try:
        return json.loads(txt)
    except Exception as e:
        jerr("bedrock.parse_json.error", e, call=call_label, preview=_preview(_redact(txt)))
        raise

# ---------- EMBEDDINGS ----------
def titan_embed(text: str, dim: int = 1024):
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
        ms = round((time.perf_counter() - s) * 1000, 1)
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
    if not vec:
        return None
    return "[" + ",".join(f"{float(x):.6f}" for x in vec) + "]"

# ---------- prompts ----------
TEST_KWS = re.compile(r"\b(test|testing|mic\s*check|dummy|sample|just\s*(to\s*)?(test|check)|end\s*(recording|call)|remove\s*(from\s*)?(call|meeting)|weekly|recurring|MonWedFri|MWTF)\b", re.I)
BIZ_KWS  = re.compile(r"\b(action\s*item|assign(ed)?|owner|due|deadline|pr|pull\s*request|issue|bug|decision|approve(d)?|eta|deploy|rollback|sprint|roadmap|stakeholder|budget|kpi|revenue)\b", re.I)

def thread_classifier_prompt(text, threshold, signals):
    sample = (text or "")[:12000]
    return f"""
Return VALID JSON ONLY:
{{
  "is_relevant": true|false,
  "label": "team_thread"|"chitchat"|"junk"|"test",
  "confidence": 0.0-1.0,
  "short_reason": "one line"
}}

You are classifying an INTERNAL TEAM CHAT THREAD.

Mark "is_relevant": true ONLY if the thread contains clearly work-related content,
for example:
- plans, decisions, or agreements
- tasks, action items, owners, or deadlines
- risks, blockers, issues, or follow-ups
- status updates about ongoing work

Mark "is_relevant": false for:
- test messages, greetings, emojis only
- random noise, debugging the bot, "just testing"
- threads with no substantive or actionable business content.

If uncertain (confidence < {threshold}), set "is_relevant": false.

SIGNALS: {json.dumps(signals, ensure_ascii=False)}

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
  - explicit if a name/email/UUID is directly tied to the task.
  - implicit if inferred via pronouns or nearby references.
  - unknown if not inferable.
""".strip()

def explainer_prompt(meta, item, context_snippet):
    return f"""
Return VALID JSON ONLY: {{"explanation": "80-150 words, business-friendly, based only on EVIDENCE_SNIPPET."}}
MEETING_TITLE: {meta['meeting_title']}
ITEM: {json.dumps(item, ensure_ascii=False)}
EVIDENCE_SNIPPET: {json.dumps(context_snippet, ensure_ascii=False)}
""".strip()

def entity_prompt(meta, item, context_snippet):
    return f"""
Return STRICT JSON ONLY:
{{"entities":[
  {{"kind":"customer|feature|project|metric|topic|doc","name":"string","aliases":["string"]?}}
]}}

Scope:
- Use ITEM.topic/description and EVIDENCE_SNIPPET only.
- Prefer concise, canonical names (no noise like “the team”).

ITEM: {json.dumps({"type": item.get("type"), "topic": item.get("topic"), "description": item.get("description")}, ensure_ascii=False)}
EVIDENCE_SNIPPET: {json.dumps(context_snippet, ensure_ascii=False)}
""".strip()

# ---------- signals / snippets ----------
def compute_signals(title, participants, lines):
    speakers = {(l.get("speaker") or "").strip().lower() for l in lines if l.get("speaker")}
    text = " ".join(l.get("text", "") for l in lines)[:20000].lower()
    toks = re.findall(r"[a-z0-9]+", text)
    ttr = (len(set(toks)) / len(toks)) if toks else 0.0
    rep = sum(
        1 for i in range(1, len(lines))
        if (lines[i].get("text", "")[:50].strip().lower()
            == lines[i-1].get("text", "")[:50].strip().lower())
    )
    repeat_ratio = rep / max(1, len(lines)-1)
    hard_flags = {
        "short_and_testy": (len(lines) <= 6 and len(speakers) <= 2 and TEST_KWS.search(text) and not BIZ_KWS.search(text)),
        "low_diversity":   (ttr < 0.35 and TEST_KWS.search(text) and not BIZ_KWS.search(text)),
        "title_event":     (re.search(r"\b(event|weekly|MonWedFri|MWTF|skip)\b", title or "", re.I) and len(lines) < 15 and not BIZ_KWS.search(text)),
        "repeat_low_spk":  (repeat_ratio >= 0.4 and len(speakers) <= 2 and not BIZ_KWS.search(text)),
    }
    return {
        "line_count": len(lines),
        "speaker_count": len(speakers),
        "ttr": round(ttr, 3),
        "test_kw": len(TEST_KWS.findall(text)),
        "biz_kw": len(BIZ_KWS.findall(text)),
        "repeat_ratio": round(repeat_ratio, 3),
        "hard_flags": hard_flags,
    }

def early_junk(sig): return any(sig.get("hard_flags", {}).values())

def lines_to_snippet(lines, start, end, pad=2, max_chars=800):
    start = max(1, int(start) - pad)
    end = int(end) + pad
    sel = [l for l in lines if start <= l["i"] <= end]
    text = "\n".join(f"{l['i']}: {l['speaker']}: {l['text']}" for l in sel)
    return (text[:max_chars] + "…") if len(text) > max_chars else text

def build_context_snippet(chunks, item):
    if not item.get("evidence"):
        return ""
    lines = []
    for ch in chunks:
        if ch["chunk_id"] == item["evidence"][0]["chunk_id"]:
            lines = ch["lines"]
            break
    if not lines:
        return ""
    out = []
    for ev in item["evidence"][:2]:
        lr = ev.get("line_range", [])
        if isinstance(lr, list) and len(lr) == 2:
            out.append(lines_to_snippet(lines, lr[0], lr[1]))
    return "\n---\n".join(out)

def stable_item_hash(meeting_id, item):
    base = {
        "ns": "live-insights:v1",
        "meeting_id": _norm(meeting_id),
        "type": _norm(item.get("type", "")),
        "topic": _norm(item.get("topic", "")),
        "evidence": sorted([
            {"chunk_id": e.get("chunk_id", ""),
             "start": int(e.get("line_range", [0, 0])[0]),
             "end":   int(e.get("line_range", [0, 0])[1])}
            for e in (item.get("evidence") or [])[:2]
        ], key=lambda x: (x["chunk_id"], x["start"], x["end"]))
    }
    h = hashlib.sha256(json.dumps(base, separators=(",", ":"), sort_keys=True).encode())
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

def parse_due_ts(item):
    d = (item.get("due") or "").strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", d):
        try:
            return datetime.datetime.fromisoformat(d + "T00:00:00+00:00")
        except Exception:
            return None
    return None

# link normalization (same as transcripts Stage-A)
def normalize_link_to_type(_cur, desired: str) -> str:
    d = (desired or "").strip().lower()
    if d in ("user", "kb_entity", "pulse", "meeting"):
        return d
    if d in ("entity",):
        return "kb_entity"
    return d

def upsert_kb_fact(cur, pulse_id, meeting_id, item, conf_default=0.70):
    canonical_text, canonical_hash = canonicalize_item(item)
    status = "open"
    try:
        owner_status = (item.get("owner_resolution", {}).get("status") or "").lower()
        evid = item.get("evidence") or []
        conf = float(item.get("owner_confidence") or conf_default)
        conf = min(
            0.95,
            max(conf,
                0.50 + 0.05 * min(len(evid), 4) + (0.05 if owner_status == "explicit" else 0.0))
        )
    except Exception:
        conf = conf_default

    jtrace("kb.fact.prepare",
           canonical_preview=_preview(_redact(canonical_text), 240),
           canonical_hash=canonical_hash,
           owner_status=item.get("owner_resolution", {}).get("status"),
           evidence_spans=len(item.get("evidence") or []),
           conf=conf)

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
        meeting_id   = COALESCE(EXCLUDED.meeting_id, kb_facts.meeting_id),
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

    # optional: link owner
    if owner_user_id:
        try:
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
        jlog("kb.entity.updated", entity_id=ent_id, kind=kind, name=name,
             alias_count=len(new_aliases), embedding_updated=bool(vec_lit))
        return ent_id, "update"
    else:
        ent_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO kb_entities (id, pulse_id, kind, name, aliases, embedding, created_at, updated_at)
            VALUES (%s::uuid, %s::uuid, %s, %s, %s::jsonb,
              CASE WHEN %s IS NULL THEN NULL ELSE %s::vector END,
              NOW(), NOW())
        """, (ent_id, str(pulse_id), kind, name,
              json.dumps(aliases or [], ensure_ascii=False),
              vec_lit, vec_lit))
        jlog("kb.entity.inserted", entity_id=ent_id, kind=kind, name=name,
             alias_count=len(aliases or []), embedding_present=bool(vec_lit))
        return ent_id, "insert"

def link_fact_entity(cur, fact_id, entity_id, relation="mentions", weight=None):
    if not (fact_id and entity_id):
        return
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
        seeded.append({"kind": "topic", "name": item["topic"].strip(), "aliases": []})
    try:
        out = invoke_bedrock_json(args.MODEL_ID, entity_prompt(meta, item, ctx),
                                  max_tokens=400, call_label="entities")
        ents = out.get("entities", []) if isinstance(out, dict) else []
    except Exception as e:
        jerr("entities.extract.error", e, topic=item.get("topic"))
        ents = []
    seen, final = set(), []
    for e in (seeded + ents)[:20]:
        kind = (e.get("kind") or "").strip().lower()
        name = (e.get("name") or "").strip()
        if not (kind and name):
            continue
        k = (kind, name.lower())
        if k in seen:
            continue
        seen.add(k)
        final.append({"kind": kind, "name": name, "aliases": e.get("aliases") or []})
    jtrace("entities.extracted", count=len(final),
           names=[f"{e['kind']}:{e['name']}" for e in final[:8]])
    return final

# ---------- team_messages fetch / grouping ----------
def fetch_new_messages(cur, since_ts, done_ids_at_ts, limit):
    ids_list = list(done_ids_at_ts or [])
    sql = """
      SELECT
        m.id                AS message_id,
        m.team_thread_id    AS thread_id,
        m.user_id,
        m.content,
        m.created_at
      FROM public.team_messages m
      WHERE m.created_at IS NOT NULL
        AND (
              m.created_at > %s
           OR (m.created_at = %s AND NOT (m.id = ANY(%s::uuid[])))
        )
      ORDER BY m.created_at ASC, m.id ASC
      LIMIT %s
    """
    s = time.perf_counter()
    cur.execute(sql, (since_ts, since_ts, ids_list, limit))
    rows = cur.fetchall()
    out = [{
        "message_id": r[0],
        "thread_id": r[1],
        "user_id": r[2],
        "content": r[3],
        "created_at": r[4],
    } for r in rows]
    jlog("db.fetch_messages.ok",
         since_ts=str(since_ts), since_id=f"{len(ids_list)} ids@ts",
         limit=limit, returned=len(out),
         ms=round((time.perf_counter() - s) * 1000, 1))
    return out

def load_thread(cur, thread_id):
    # thread meta
    cur.execute("""
      SELECT t.id::text, t.pulse_id::text, t.organization_id::text
      FROM public.team_threads t
      WHERE t.id = %s::uuid
    """, (str(thread_id),))
    thr = cur.fetchone()
    if not thr:
        return None, []

    thread = {
        "thread_id": thr[0],
        "pulse_id": thr[1],
        "organization_id": thr[2],
    }

    # full message history for thread (we can later window if too large)
    cur.execute("""
      SELECT
        m.id::text,
        m.user_id::text,
        u.name,
        m.content,
        m.created_at,
        m.replied_to_message_id::text,
        m.role,
        m.is_system
      FROM public.team_messages m
      LEFT JOIN public.users u ON u.id = m.user_id
      WHERE m.team_thread_id = %s::uuid
        AND m.deleted_at IS NULL
      ORDER BY m.created_at ASC, m.id ASC
    """, (str(thread_id),))
    msgs = [{
        "message_id": r[0],
        "user_id": r[1],
        "sender_name": r[2],
        "content": r[3],
        "created_at": r[4],
        "replied_to_message_id": r[5],
        "role": r[6],
        "is_system": bool(r[7]),
    } for r in cur.fetchall()]

    jtrace("thread.loaded",
           thread_id=str(thread_id),
           pulse_id=thread["pulse_id"],
           organization_id=thread["organization_id"],
           message_count=len(msgs))
    return thread, msgs

def build_meta_for_thread(thread, msgs):
    participants = sorted({
        (m["sender_name"] or m["user_id"]) for m in msgs if (m.get("content") or "").strip()
    })
    first_ts = next((m["created_at"] for m in msgs if m["created_at"]), None)
    meta = {
        "meeting_id": thread["thread_id"],
        "meeting_title": f"Team thread {thread['thread_id']}",
        "meeting_datetime": first_ts.isoformat() if first_ts else "",
        "timezone": "Asia/Tokyo",
        "participants": participants,
    }
    jtrace("thread.meta",
           meeting_id=meta["meeting_id"],
           title=_preview(_redact(meta["meeting_title"]), 160),
           participants_count=len(participants))
    return meta

def parse_chunks_from_messages(msgs):
    # build parent snippets for reply context
    parent_snippet = {}
    for m in msgs:
        txt = (m.get("content") or "").strip()
        if not txt:
            continue
        sender = (m.get("sender_name") or m.get("user_id") or "")[:40]
        parent_snippet[m["message_id"]] = f"{sender}: {txt[:80]}"

    lines = []
    i = 1
    for m in msgs:
        text = (m.get("content") or "").strip()
        if not text:
            continue
        if m.get("is_system") and not text:
            continue
        # include reply context inline
        rto = m.get("replied_to_message_id")
        if rto and rto in parent_snippet:
            text = f"(reply to {parent_snippet[rto]}) " + text

        speaker_base = (m.get("sender_name") or m.get("user_id") or "")[:80]
        role = (m.get("role") or "").lower()
        if role and role != "user":
            speaker = f"{speaker_base} ({role})"
        else:
            speaker = speaker_base

        lines.append({
            "i": i,
            "ts": m["created_at"].isoformat() if m.get("created_at") else "",
            "speaker": speaker,
            "text": text,
        })
        i += 1

    jtrace("thread.chunks",
           lines=len(lines),
           first_lines=_preview("\n".join(
               [f"{l['i']}: {l['speaker']}: {l['text']}" for l in lines[:5]]
           ), 800))
    return [{"chunk_id": "CHAT_1", "lines": lines}]

def build_thread_text(msgs, max_chars=12000):
    lines = []
    for m in msgs:
        txt = (m.get("content") or "").strip()
        if not txt:
            continue
        who = (m.get("sender_name") or m.get("user_id") or "")[:80]
        rto = m.get("replied_to_message_id")
        prefix = ""
        if rto:
            prefix = "(reply) "
        clean = txt.replace("\n", " ")
        lines.append(f"{who}: {prefix}{clean}")
    joined = "\n".join(lines)
    return joined[:max_chars]

# ---------- main ----------
def main():
    global RUN_ID
    RUN_ID = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M%S") + "-" + uuid.uuid4().hex[:8]

    print('{"probe":"team_messages_main_enter"}')
    sys.stdout.flush()

    jlog("startup",
         region=args.REGION, glue_conn=GLUE_CONN, s3_bucket=args.S3_BUCKET,
         s3_prefix=args.S3_PREFIX, model_id=args.MODEL_ID,
         embed_model_id=args.EMBED_MODEL_ID,
         conf_threshold=args.CONF_THRESHOLD, batch_size=args.BATCH_SIZE,
         log_level=str(args.LOG_LEVEL).upper(),
         trace=args.TRACE, trace_max=args.TRACE_MAX, redact_pii=args.REDACT_PII)

    conn = pg_conn()
    cur  = conn.cursor()

    since_ts, done_ids_at_ts = load_checkpoint()
    if since_ts is None:
        since_ts = initial_since()
        done_ids_at_ts = set()
        jlog("checkpoint.starting_from_default",
             initial_days=args.INITIAL_DAYS,
             since_ts=str(since_ts))

    root = args.S3_PREFIX.strip("/")
    root = (root + "/") if root else ""

    metrics = {
        "messages_seen": 0,
        "threads_touched": 0,
        "threads_processed": 0,
        "skipped_empty_thread": 0,
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
        "files_written": 0,
    }

    last_ts = since_ts
    last_id = None
    last_ts_done_ids = set(done_ids_at_ts)

    processed_threads_this_run = set()

    while True:
        msgs_batch = fetch_new_messages(cur, since_ts=last_ts,
                                        done_ids_at_ts=last_ts_done_ids,
                                        limit=args.BATCH_SIZE)
        if not msgs_batch:
            break

        for m in msgs_batch:
            metrics["messages_seen"] += 1
            created_at = m["created_at"] or last_ts

            # checkpoint update per message
            if created_at > last_ts:
                last_ts = created_at
                last_ts_done_ids = set()
            last_ts_done_ids.add(str(m["message_id"]))
            last_id = m["message_id"]

            thread_id = m["thread_id"]
            metrics["threads_touched"] += 1

            # only process each thread once per run batch
            if thread_id in processed_threads_this_run:
                continue
            processed_threads_this_run.add(thread_id)

            # load full thread
            thread, msgs_full = load_thread(cur, thread_id)
            if not thread or not msgs_full:
                metrics["skipped_empty_thread"] += 1
                continue

            ingest_dt = max(
                (mm["created_at"] for mm in msgs_full if mm.get("created_at")),
                default=created_at
            ).date().isoformat()

            meta = build_meta_for_thread(thread, msgs_full)
            chunks = parse_chunks_from_messages(msgs_full)
            lines  = chunks[0]["lines"] if chunks else []
            signals = compute_signals(meta["meeting_title"], meta.get("participants", []), lines)
            jlog("thread.metrics",
                 meeting_id=meta["meeting_id"],
                 thread_id=str(thread_id),
                 line_count=len(lines),
                 speaker_count=signals.get("speaker_count"),
                 test_kw=signals.get("test_kw"),
                 biz_kw=signals.get("biz_kw"),
                 repeat_ratio=signals.get("repeat_ratio"),
                 hard_flags=signals.get("hard_flags"))

            # heuristic junk filter
            if early_junk(signals):
                metrics["skipped_heuristic"] += 1
                jlog("thread.skip.heuristic",
                     meeting_id=meta["meeting_id"],
                     hard_flags=signals.get("hard_flags"))
                continue

            # classifier: work-relevant team thread vs junk/chitchat/test
            try:
                cls_text = build_thread_text(msgs_full)
                cls = invoke_bedrock_json(
                    args.MODEL_ID,
                    thread_classifier_prompt(cls_text, args.CONF_THRESHOLD, signals),
                    max_tokens=200,
                    call_label="classifier_team"
                )
                conf = float(cls.get("confidence", 0) or 0)
                is_rel = bool(cls.get("is_relevant", False))

                jlog(
                    "classifier.result",
                    meeting_id=meta["meeting_id"],
                    is_relevant=is_rel,
                    label=cls.get("label"),
                    confidence=conf,
                    short_reason=cls.get("short_reason"),
                )

                if (not is_rel) or conf < args.CONF_THRESHOLD:
                    metrics["skipped_classifier"] += 1
                    jlog(
                        "thread.skip.classifier",
                        meeting_id=meta["meeting_id"],
                        confidence=conf,
                        label=cls.get("label"),
                    )
                    continue
            except Exception as e:
                metrics["classifier_errors"] += 1
                jerr("classifier.error", e,
                     meeting_id=meta["meeting_id"])
                continue

            # parser
            try:
                parsed = invoke_bedrock_json(
                    args.MODEL_ID,
                    parser_prompt(meta, chunks),
                    max_tokens=2500,
                    call_label="parser_team"
                )
                items = parsed.get("items", [])
                jlog("parser.result",
                     meeting_id=meta["meeting_id"],
                     items_count=len(items))
                jtrace("parser.items.preview",
                       items=[{"type": i.get("type"),
                               "topic": _preview(i.get("topic", ""), 120),
                               "desc_len": len(i.get("description", ""))}
                              for i in items[:5]])
            except Exception as e:
                metrics["parse_errors"] += 1
                jerr("parser.error", e,
                     meeting_id=meta["meeting_id"])
                continue

            pulse_id = thread["pulse_id"]
            organization_id = thread["organization_id"]

            jsonl_lines = []

            for it in items[:20]:
                ow = it.get("owner_resolution") or {}
                try:
                    it["owner_confidence"] = float(ow.get("confidence", 0))
                except Exception:
                    it["owner_confidence"] = 0.0

                jtrace("item.summary",
                       type=it.get("type"),
                       topic=_preview(_redact(it.get("topic", "")), 180),
                       owner_status=ow.get("status"),
                       owner_conf=it["owner_confidence"])

                # explanation
                try:
                    ctx = build_context_snippet(chunks, it)
                    exp = invoke_bedrock_json(
                        args.MODEL_ID,
                        explainer_prompt(meta, it, ctx),
                        max_tokens=600,
                        call_label="explainer_team"
                    )
                    it["explanation"] = (exp or {}).get("explanation") or it.get("description", "")
                    jtrace("explainer.text",
                           explanation_preview=_preview(_redact(it["explanation"])))
                except Exception as e:
                    metrics["explainer_errors"] += 1
                    it["explanation"] = it.get("description", "")
                    jerr("explainer.error", e,
                         meeting_id=meta["meeting_id"],
                         topic=it.get("topic"))

                ihash = stable_item_hash(meta["meeting_id"], it)
                it["item_hash"] = ihash
                jtrace("item.hash", item_hash=ihash)

                # KB upsert
                # NOTE: team threads do NOT have a row in `meetings`, so we must NOT
                # set meeting_id here or we'll hit the FK. Use NULL instead.
                kb_fact_id, canonical_hash = None, None
                try:
                    kb_fact_id, canonical_hash = upsert_kb_fact(
                        cur,
                        pulse_id=pulse_id,
                        meeting_id=None,   # <<< important change
                        item=it,
                    )
                    conn.commit()
                    metrics["kb_upserts"] += 1
                except Exception as e:
                    conn.rollback()
                    metrics["kb_errors"] += 1
                    jerr("kb.upsert.error", e,
                        meeting_id=meta["meeting_id"],
                        topic=it.get("topic"))

                # Entities
                try:
                    if pulse_id and kb_fact_id:
                        ents = extract_entities(meta, it, chunks)
                        for e in ents:
                            ent_id, op = upsert_kb_entity(
                                cur, pulse_id,
                                e["kind"], e["name"],
                                e.get("aliases") or [],
                                args.EMBED_DIM
                            )
                            if ent_id:
                                rel = "mentions"
                                if it.get("type") in ("action", "risk") and e["kind"] in ("feature", "project", "customer"):
                                    rel = "affects"
                                link_fact_entity(cur, kb_fact_id, ent_id, relation=rel, weight=None)
                                metrics["entities_upserted"] += 1
                        conn.commit()
                except Exception as e:
                    conn.rollback()
                    metrics["entity_errors"] += 1
                    jerr("entities.upsert_or_link.error", e,
                         kb_fact_id=kb_fact_id)

                rec = {
                    "source": "team_messages",
                    "meeting_id": meta["meeting_id"],
                    "meeting_title": meta["meeting_title"],
                    "pulse_id": pulse_id,
                    "organization_id": organization_id,
                    "item_hash": ihash,
                    "canonical_hash": canonical_hash,
                    "kb_fact_id": kb_fact_id,
                    "item": it,
                }
                jsonl_lines.append(json.dumps(rec, ensure_ascii=False))

            if jsonl_lines:
                key = f"{root}parsed/ingest_date={ingest_dt}/meeting_id={meta['meeting_id']}/items.run_id={RUN_ID}.jsonl"
                put_text(args.S3_BUCKET, key, "\n".join(jsonl_lines))
                metrics["items_total"] += len(jsonl_lines)
                metrics["files_written"] += 1
                manifest = {
                    "run_id": RUN_ID,
                    "source": "team_messages",
                    "meeting_id": meta["meeting_id"],
                    "thread_id": str(thread_id),
                    "s3_key": key,
                    "items_written": len(jsonl_lines),
                }
                mkey = f"{root}manifests/meeting_id={meta['meeting_id']}/run_id={RUN_ID}/manifest_team_messages.json"
                put_text(args.S3_BUCKET, mkey, json.dumps(manifest))
                jlog("s3.write.items_and_manifest",
                     thread_id=str(thread_id),
                     key_items=key,
                     key_manifest=mkey,
                     items=len(jsonl_lines))
            else:
                jlog("thread.no_items",
                     meeting_id=meta["meeting_id"],
                     thread_id=str(thread_id))

            metrics["threads_processed"] += 1

        # end for each message in batch

    # save checkpoint after loop completes
    save_checkpoint(last_ts, last_ts_done_ids, last_id)
    cur.close()
    conn.close()

    jlog("run.summary", **metrics,
         last_checkpoint_ts=str(last_ts),
         last_checkpoint_id=str(last_id))
    print(f"Team-messages Stage-A done. Items written: {metrics['items_total']}. Checkpoint → {last_ts} / id {last_id}")

if __name__ == "__main__":
    main()