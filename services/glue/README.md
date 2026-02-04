## Glue Service

All scripts are deployed manually on AWS Glue.

# parse_transcripts_job.py

Parses the latest transcripts using Claude 3.5 Sonnet: 1. junk/test classifier → skip if junk 2. structured parse (actions/decisions/risks) 3. optional enrichment/explanations
Outputs JSONL to S3.

Job params
• --GLUE_CONN Aurora connection
• --MODEL_ID anthropic.claude-3-5-sonnet-20240620-v1:0
• --S3_BUCKET pulse-glue-working-dir
• --S3_PREFIX meeting-insights/
• --CHECKPOINT_BUCKET your-bucket
• --CHECKPOINT_KEY meeting-insights/state/parse_checkpoint.json
• (Optional) --INITIAL_DAYS 7
• Additional modules: boto3==1.34.150,botocore==1.34.150,psycopg2-binary==2.9.9

⸻

# cache_user_info.py (daily snapshot)

Exports lightweight user + membership “dimensions” to S3 (Parquet):
• dim_users from users + organization_users (keeps: user_id,name,email,organization_id,job_title)
• dim_pulse_members from pulse_members (keeps: pulse_id,user_id,role)

Job params
• --GLUE_CONN Aurora connection
• --BUCKET pulse-glue-working-dir
• Additional modules:
boto3==1.34.150,botocore==1.34.150,psycopg2-binary==2.9.9,pandas==2.2.2,pyarrow==16.1.0,awswrangler==3.9.0

⸻

# allocate_recipients.py (Stage-B)

Reads Stage-A JSONL from S3, loads the cached dimensions (or falls back to DB if missing), assigns recipients per item using job-title/role heuristics, and upserts results into live_insights.

What it does
• Loads dim_users & dim_pulse_members (today/yesterday) from S3.
• Batches DB lookups for meetings → pulse_id, cache misses for pulse_members and users.
• Heuristic: owner if present → job_title keyword match → pulse leads/managers fallback.
• Upsert into live_insights (Laravel-friendly): item_hash, meeting_id, pulse_id, type, topic, description, explanation, share_with_user_ids (jsonb).

Job params
• --GLUE_CONN Aurora connection
• --S3_BUCKET pulse-glue-working-dir # Stage-A outputs bucket
• --S3_PREFIX meeting-insights/ # Stage-A prefix
• --CACHE_BUCKET pulse-glue-working-dir # snapshot cache bucket
• --CACHE_PREFIX meeting-insights/cache/ # snapshot cache prefix
• --DAYS_LOOKBACK 2 # read recent JSONL
• --MODEL_ID anthropic.claude-3-5-sonnet-20240620-v1:0
• --LLM_MAX_CANDIDATES 20 # how many people we pass into the model per item to consider/rank.
• --LLM_MAX_RECIPS 2 # how many people the model is allowed to return per item.
• --LLM_MIN_CONF 2 # confidence level to allocate a person
• --ALLOC_CHECKPOINT_BUCKET <bucket> (optional; defaults to --S3_BUCKET)
• --ALLOC_CHECKPOINT_KEY meeting-insights/state/allocate_checkpoint.json
• --ONLY_KEY # pass a key for step A output (eg:meeting-insights/parsed/ingest_date=2025-10-01/meeting_id=9ff5a1d4-79df-45cd-807c-41a4042e481a/items.run_id=20251001-085248-ccf29d34.jsonl)
• (Optional) --REGION ap-northeast-1
• Additional modules:
boto3==1.34.150,botocore==1.34.150,s3transfer==0.10.2,urllib3==1.26.18,pandas==2.2.2,pyarrow==16.1.0,awswrangler==3.9.0,psycopg2-binary==2.9.9
Run order 1. cache_user_info.py (daily) 2. parse_transcripts_job.py (frequent) 3. allocate_recipients.py (after #1 & #2)

# reduce_facts_storage.py (Stage-C)

Adds temporal state + versioning to facts. Reads recently updated kb_facts, derives lifecycle transitions (open → in_progress → stale → closed), emits immutable kb_fact_events (e.g., sighted, owner_changed, due_changed, text_changed, state_changed, auto_closed), appends kb_fact_versions snapshots, and updates kb_facts.lifecycle_state (keeps existing status for backward compatibility).

What it does
• Scans facts touched within --WINDOW_HOURS or since the reducer checkpoint.
• Derives lifecycle state:
– open → in_progress when owner assigned or confidence ≥ 0.75
– in_progress → stale when now - last_seen_at > --STALE_DAYS
– → closed via explicit close or an external auto-close hook (stubs for GitHub/Jira).
• Emits events with diffs (owner/due/text/state) and a sighted event when last_seen_at advances.
• Appends a versioned snapshot (kb_fact_versions) every run for time-travel queries.
• Updates kb_facts.lifecycle_state and timestamps (first_opened_at, last_transition_at, auto_closed_at).

Job params

• –GLUE_CONN Aurora connection
• –CHECKPOINT_BUCKET pulse-glue-working-dir
• –CHECKPOINT_KEY meeting-insights/state/stage_c_reducer_checkpoint.json
• –WINDOW_HOURS 24 # how far back to scan for candidates each run
• –STALE_DAYS 7 # days with no sighting → mark as stale
• (Optional) –REGION ap-northeast-1
• (Optional) –LOG_LEVEL INFO
• (Optional) –ENABLE_GITHUB # enable external auto-close hook (stub)
• (Optional) –ENABLE_JIRA # enable external auto-close hook (stub)
• Additional modules: boto3==1.34.150,botocore==1.34.150,psycopg2-binary==2.9.9

Run order 4. reduce_facts_storage.py (after #1–#3)

Notes
• --WINDOW_HOURS controls scan breadth; it doesn’t change the stale threshold. For reliable stale detection, keep it ≥ --STALE_DAYS \* 24 or run a periodic wider sweep.
• All changes are append-only (events/versions). Existing status stays (open/closed) for compatibility while lifecycle_state adds in_progress and stale.
