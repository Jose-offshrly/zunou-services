# error-assistant

Lambda that watches the API queue log group for ERROR events. When one occurs, it collects the error and all logs from that request, then can deduplicate, run an AI agent, and open a PR. Notifications go via SES.

**Trigger:** CloudWatch Logs subscription on the Vapor GraphQL API queue log group. Development and staging use the staging queue; production uses the production queue.

---

## What it does

1. Subscribes to ERROR logs from the API queue (filter: `$.level_name = "ERROR"` or `$.level = "ERROR"`).
2. Fetches the full request log (same `requestId`) for context.
3. Deduplicates via S3 hashes, then runs the ReAct agent (clone repo, analyze, fix, open PR).
4. Sends email notifications (SES) when configured.

---

## Deploy

**First time**

1. Build and upload the zip (paths from repo root):

   ```bash
   cd services/error-assistant
   make zip
   aws s3 cp error_log_watcher_lambda_function.zip s3://pulse-lambda-code/
   ```

2. Set error-log-watcher variables in tfvars (see `infrastructure/environment/terraform.tfvars.example`).
3. Apply Terraform:

   ```bash
   cd infrastructure/environment
   terraform apply -var-file=terraform.tfvars
   ```

**Later deploys**

```bash
cd services/error-assistant
make deploy ENV=dev   # or ENV=stg, ENV=prod
```

---

## Config

- **Terraform:** Error-log-watcher variables live in `infrastructure/environment/variables.tf` and are documented in `infrastructure/environment/terraform.tfvars.example` and `ERROR_LOG_WATCHER_VARIABLES.md`.
- **Lambda env:** Repo URL, GitHub App (ID, installation, private key), OpenAI key/model, from-email, notification email. OpenAI key is shared from the existing `openai_api_key` variable.

---

## Tests

```bash
cd services/error-assistant
npm test
```

Jest tests cover deduplication and log normalization.
