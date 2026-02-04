# file: lambda_function.py
import os, json, urllib.parse, logging, time, random
import boto3, botocore

log = logging.getLogger()
log.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

glue = boto3.client("glue")

JOB_NAME        = os.environ["STAGE_B_JOB_NAME"]   # e.g. mi-stage-b
EXPECTED_BUCKET = os.environ.get("EXPECTED_BUCKET", "")
MANIFEST_PREFIX = os.environ.get("MANIFEST_PREFIX", "manifests/")
MANIFEST_SUFFIX = os.environ.get("MANIFEST_SUFFIX", "/manifest.json")

# Backoff controls (env-tunable)
RETRY_ATTEMPTS    = int(os.environ.get("START_RETRY_ATTEMPTS", "4"))
BASE_DELAY_SECS   = float(os.environ.get("START_BASE_DELAY_SECS", "1.0"))
MAX_SLEEP_SECS    = float(os.environ.get("START_MAX_SLEEP_SECS", "30"))

def start_glue_with_backoff(job_name, args):
    """Try StartJobRun with exponential backoff on ConcurrentRunsExceededException.
       Re-raise on final failure so Lambda async retries will occur."""
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            return glue.start_job_run(JobName=job_name, Arguments=args)
        except botocore.exceptions.ClientError as e:
            code = e.response.get("Error", {}).get("Code", "")
            if code == "ConcurrentRunsExceededException":
                if attempt >= RETRY_ATTEMPTS:
                    log.warning("ConcurrentRunsExceededException: giving up after %d attempts", attempt)
                    raise  # let Lambda treat the invocation as an error → async retry / DLQ
                sleep = min(BASE_DELAY_SECS * (2 ** (attempt - 1)) + random.random(), MAX_SLEEP_SECS)
                log.info("ConcurrentRunsExceeded: backing off %.2fs (attempt %d/%d)", sleep, attempt, RETRY_ATTEMPTS)
                time.sleep(sleep)
                continue
            # Any other error: fail fast so Lambda retries / DLQ catches it
            raise

def lambda_handler(event, _ctx):
    log.info("EVENT %s", json.dumps(event))
    detail = event.get("detail", {})
    bucket = (detail.get("bucket") or {}).get("name")
    key_enc = (detail.get("object") or {}).get("key")
    if not bucket or not key_enc:
        return {"ok": False, "why": "bad event shape"}

    key = urllib.parse.unquote_plus(key_enc)

    if EXPECTED_BUCKET and bucket != EXPECTED_BUCKET:
        log.info("Skip: bucket filter %s", bucket)
        return {"ok": False, "why": "wrong bucket", "bucket": bucket}

    # Only react to manifests
    if not (key.startswith(MANIFEST_PREFIX) and key.endswith(MANIFEST_SUFFIX)):
        log.info("Skip: not a manifest: %s", key)
        return {"ok": False, "why": "not manifest", "key": key}

    args = {"--ONLY_KEY": key}  # only this!
    log.info("Starting Glue %s with args=%s", JOB_NAME, json.dumps(args))

    # May raise on final failure → Lambda async retry behavior engages
    resp = start_glue_with_backoff(JOB_NAME, args)

    log.info("Glue JobRunId=%s", resp["JobRunId"])
    return {"ok": True, "job_run_id": resp["JobRunId"], "only_key": key}