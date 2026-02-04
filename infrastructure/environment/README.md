## Terraform for environments

### Authorize Amplify

Follow the [instructions](https://docs.aws.amazon.com/amplify/latest/userguide/setting-up-GitHub-access.html#migrating-to-github-app-auth) to Authorize Amplify to access the Github repository. Generate a token as described, and set it in Terraform cloud as AWS_AMPLIFY_GITHUB_TOKEN.

---

## Scout AI Proxy Lambda

### Overview

- **Terraform**: Manages infrastructure (IAM roles, CloudWatch logs, Lambda function definition)
- **GitHub Actions**: Handles code deployment (build, upload to S3, update Lambda)

### Initial Setup

#### 1. Deploy Code via GitHub Actions

Push changes to trigger GitHub Actions which will build and upload the Lambda code to S3:

- **Development**: Push to `main` branch with `services/ai-proxy/**` changes
- **Staging**: Push to `staging` branch with `services/ai-proxy/**` changes

The workflow will:
- Install dependencies
- Create zip file
- Upload to S3 bucket `pulse-lambda-code`
- Skip Lambda update gracefully if function doesn't exist yet (first deployment)

#### 2. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

This creates:
- IAM role and policy
- CloudWatch log group
- Lambda function (references the S3 file)
- Lambda Function URL

#### 4. Get Function URL

```bash
terraform output scout_ai_proxy_lambda_function_url
```

### Code Updates

After initial setup, code updates are automatic via GitHub Actions:

- **Development**: Push `services/ai-proxy/**` changes to `main` branch
- **Staging**: Push `services/ai-proxy/**` changes to `staging` branch

The workflow automatically builds, uploads to S3, and updates Lambda.

**No Terraform needed** for code updates - only for infrastructure changes.

### Troubleshooting

**S3 file not found**
- Ensure GitHub Actions workflow has run successfully
- Check the workflow run to verify S3 upload completed
- The S3 file must exist before running Terraform

**Access Denied**
- Check AWS credentials have `s3:PutObject` permission on `pulse-lambda-code` bucket
- Check AWS credentials have `lambda:UpdateFunctionCode` permission
-

