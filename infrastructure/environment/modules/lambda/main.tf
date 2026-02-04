
#Meet Bot Results Lambda
resource "aws_lambda_function" "meet_bot_results" {
  function_name    = "MeetBotResults-${var.environment}"
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  role             = var.meet_bot_results_lambda_role_arn

  # Reference the S3 bucket and key where your zip is located
  s3_bucket        = "pulse-lambda-code"
  s3_key           = "meetbot_results_lambda_function.zip"

  environment {
    variables = {
      SQS_QUEUE_URL = var.meet_bot_results_queue_url,
    }
  }
}

# Infra - ecs scaler
resource "aws_lambda_function" "ecs_scaler" {
  function_name = "ecs-service-scaler-${var.environment}"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = var.ecs_scaler_lambda_role_arn

  s3_bucket     = "pulse-lambda-code"
  s3_key        = "ecs_service_scaler.zip"
}

# Scout AI Proxy Lambda Function (S3 ZIP deployment)
# Bootstrap ZIP file is created and uploaded by GitHub Actions
resource "aws_lambda_function" "scout_ai_proxy" {
  function_name = "scout-ai-proxy-${var.environment}"
  description   = "Scout AI Proxy Lambda - Handles Text Agent (SSE proxy) and Voice Agent (session creation)"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = var.scout_ai_proxy_lambda_role_arn

  # Reference the S3 bucket and key where your zip is located
  s3_bucket = "pulse-lambda-code"
  s3_key    = var.scout_ai_proxy_s3_key

  environment {
    variables = {
      OPENAI_API_KEY     = var.openai_api_key
      AUTH0_DOMAIN       = var.auth0_domain
      AUTH0_AUDIENCE     = var.auth0_audience
      ASSEMBLYAI_API_KEY = var.assemblyai_api_key
    }
  }

  timeout = 120

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "Scout"
  }
}

# Lambda Function URL for HTTP access
resource "aws_lambda_function_url" "scout_ai_proxy" {
  function_name      = aws_lambda_function.scout_ai_proxy.function_name
  authorization_type = "NONE"
  invoke_mode        = "RESPONSE_STREAM"

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["*"]
    max_age          = 86400
  }
}

# Resource-based policy to allow public invocation
resource "aws_lambda_permission" "allow_public_invoke_function" {
  statement_id  = "FunctionURLAllowInvokeAction"
  action       = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scout_ai_proxy.function_name
  principal    = "*"
}

#-----------------------------------------------------------------------------
# Error-log-watcher (error-assistant) Lambda
# Triggered by CloudWatch Logs subscription on API queue log group
#-----------------------------------------------------------------------------
resource "aws_lambda_function" "error_log_watcher" {
  function_name = "error-log-watcher-${var.environment}"
  description   = "Error assistant: watches API queue errors, deduplicates, runs AI agent, creates PR"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = var.error_log_watcher_execution_role_arn

  s3_bucket = "pulse-lambda-code"
  s3_key    = var.error_log_watcher_s3_key

  timeout     = 300
  memory_size = 1024

  environment {
    variables = {
      REPO_URL                      = var.error_log_watcher_repo_url
      GITHUB_APP_ID                 = var.error_log_watcher_github_app_id
      GITHUB_INSTALLATION_ID        = var.error_log_watcher_github_installation_id
      GITHUB_APP_PRIVATE_KEY        = var.error_log_watcher_github_app_private_key
      OPENAI_API_KEY                = var.openai_api_key
      OPENAI_MODEL                  = var.error_log_watcher_openai_model
      FROM_EMAIL                    = var.error_log_watcher_from_email
      DEFAULT_NOTIFICATION_EMAIL    = var.error_log_watcher_default_notification_email
    }
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "Scout"
  }
}

# Temporarily disabled: uncomment to re-enable error-log-watcher (stops Lambda from being triggered)
# resource "aws_lambda_permission" "allow_logs_invoke_error_log_watcher" {
#   statement_id   = "AllowExecutionFromCloudWatchLogs"
#   action         = "lambda:InvokeFunction"
#   function_name  = aws_lambda_function.error_log_watcher.function_name
#   principal      = "logs.amazonaws.com"
#   source_arn     = "${var.error_log_watcher_source_log_group_arn}:*"
#   source_account = data.aws_caller_identity.current.account_id
# }

# resource "aws_cloudwatch_log_subscription_filter" "error_log_watcher" {
#   name            = "error-log-watcher-filter-${var.environment}"
#   log_group_name  = var.error_log_watcher_source_log_group_name
#   filter_pattern  = "{ $.level_name = \"ERROR\" }"
#   destination_arn = aws_lambda_function.error_log_watcher.arn
# }