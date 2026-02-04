locals {
  auth0_domain                = var.environment == "production" ? "zunou.us.auth0.com" : "dev-tqo515nfomhzsx17.us.auth0.com"
  auth0_email                 = "support@${local.root_domain}"
  aws_region                  = "ap-northeast-1"
  azs                         = slice(data.aws_availability_zones.available.names, 0, 3)
  core_graphql_url            = var.environment == "production" ? "https://api.${local.root_domain}/graphql" : "https://api.${var.environment}.${local.root_domain}/graphql"
  root_domain                 = "zunou.ai"
  origin_domain               = "${local.subdomain}${local.root_domain}"
  subdomain                   = var.environment == "production" ? "" : "${var.environment}."
  support_email               = "support@${local.root_domain}"

  hostnames = {
    Calendar-service = "calendar.${local.origin_domain}"
    Dashboard     = "dashboard.${local.origin_domain}"
    Kestra        = "kestra.${local.origin_domain}"
    Meet-bot      = "meet-bot.${local.origin_domain}"
    Organizations = "organizations.${local.origin_domain}"
    Pulse         = "pulse.${local.origin_domain}"
    Scheduler-service = "scheduler.${local.origin_domain}"
    Slack         = "slack.${local.origin_domain}"
    Unstructured  = "unstructured.${local.origin_domain}"
    Uploader      = "uploader.${local.origin_domain}"
    Scout         = "scout.${local.origin_domain}"
  }

  # hack because we have too many domains for one certificate
  cert_primary = [
    local.hostnames["Pulse"],
    local.hostnames["Dashboard"],
    local.hostnames["Organizations"],
    local.hostnames["Slack"],
    local.hostnames["Unstructured"],
  ]
  
  cert_secondary = [
    local.hostnames["Calendar-service"],
    local.hostnames["Kestra"],
    local.hostnames["Meet-bot"],
    local.hostnames["Scheduler-service"],
    local.hostnames["Uploader"],
  ]

  tags = {
    CostCenter  = "Tech"
    Department  = "Tech"
    Environment = var.environment
    Owner       = "Marcus Saw"
    Project     = "Pulse"
  }

  extra_auth0_origins = [
    "zunouscout://callback"
  ]

  # Error-log-watcher: API queue log group (staging queue for dev/sandbox/staging, production queue for production)
  error_log_watcher_source_log_group_name = var.environment == "production" ? "/aws/lambda/vapor-zunou-graphql-api-production-queue" : "/aws/lambda/vapor-zunou-graphql-api-staging-queue"
  error_log_watcher_source_log_group_arn  = "arn:aws:logs:${local.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:${local.error_log_watcher_source_log_group_name}"
}

variable "allowed_ips" {
  type        = list(string)
  description = "List of allowed CIDR blocks for ingress"
}

variable "aws_access_key_id" {
  description = "The AWS access key ID"
  type        = string
}

variable "aws_secret_access_key" {
  description = "The AWS secret access key"
  sensitive   = true
  type        = string
}

variable "assemblyai_api_key" {
  description = "AssemblyAI API key for speaker diarization"
  sensitive   = true
  type        = string
}

variable "dashboard_mac_dmg" {
  description = "The URL for downloading the Dashboard Electron macOS installer (DMG format)"
  type        = string
}

variable "dashboard_mac_zip" {
  description = "The URL for downloading the Dashboard Electron macOS installer (ZIP format)"
  type        = string
}

variable "dashboard_windows" {
  description = "The URL for downloading the Dashboard Electron Windows installer"
  type        = string
}

variable "elevenlabs_api_key" {
  description = "Elevenlabs api key"
  sensitive   = true
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string

  validation {
    condition     = contains(["development", "sandbox", "staging", "production"], var.environment)
    error_message = "Allowed values for environment are \"development\", \"sandbox\", \"staging\", or \"production\"."
  }
}

variable "github_amplify_access_token" {
  description = "A token used by AWS Amplify to access Github"
  type        = string
}

variable "companion_google_cloud_client_id" {
  description = "The Google client ID used by Companion for uploads"
  type        = string
}

variable "companion_google_cloud_client_secret" {
  description = "The Google client ID used by Companion for uploads"
  sensitive   = true
  type        = string
}

variable "companion_onedrive_client_id" {
  description = "The Microsoft client ID used by Companion for uploads"
  type        = string
}

variable "companion_onedrive_client_secret" {
  description = "The Microsoft client ID used by Companion for uploads"
  sensitive   = true
  type        = string
}

variable "database_url" {
  description = "The URL of the main API's database"
  sensitive   = true
  type        = string
}

variable "kestra_aws_access_key_id" {
  description = "The access key used by Kestra to store files in AWS S3"
  type        = string
}

variable "kestra_aws_secret_access_key" {
  description = "The secret key used by Kestra to store files in AWS S3"
  sensitive   = true
  type        = string
}

variable "kestra_database_password" {
  description = "The password for the Kestra database instance on RDS"
  sensitive   = true
  type        = string
}

variable "kestra_slack_webhook_key" {
  description = "The secret used to verify messages to the Slack webhook"
  sensitive   = true
  type        = string
}

variable "launch_darkly_client_id" {
  description = "Launch Darkly client id"
  type        = string
}

variable "mq_admin_username" {
  description = "The admin username for the Amazon MQ broker"
  type        = string  
}

variable "mq_admin_password" {
  description = "The admin password for the Amazon MQ broker"
  sensitive   = true
  type        = string
}

variable "mq_consumer_username" {
  description = "The consumer username for the Amazon MQ broker"
  type        = string
}
variable "mq_consumer_password" {
  description = "The consumer password for the Amazon MQ broker"
  sensitive   = true
  type        = string
}

variable "mq_meet_bot_url" {
  description = "The URL of the Amazon MQ broker for the Meet Bot"
  type        = string
}

variable "openai_api_key" {
  description = "The API key to use for OpenAI calls"
  sensitive   = true
  type        = string
}

variable "openai_assistant_id" {
  description = "The ID of the assistant that handles OpenAI calls"
  type        = string
}

variable "openai_embedding_model" {
  description = "The model to use for OpenAI embeddings"
  type        = string
}

variable "openai_summary_model" {
  description = "The model to use for OpenAI summaries"
  type        = string
}

variable "pinecone_api_key" {
  description = "The API key to use for Pinecone calls"
  sensitive   = true
  type        = string
}

variable "pinecone_index_name" {
  description = "The name of the Pinecone index to use"
  type        = string
}

variable "postgres_db_database" {
  description = "Postgres database name"
  type        = string
}

variable "postgres_db_host" {
  description = "Postgres database host"
  type        = string
}

variable "postgres_db_password" {
  description = "Postgres database password"
  sensitive   = true
  type        = string
}

variable "postgres_db_port" {
  description = "Postgres database port"
  type        = string
}

variable "postgres_db_username" {
  description = "Postgres database username"
  sensitive   = true
  type        = string
}

variable "pusher_auth_endpoint" {
  description = "Pusher auth endpoint"
  type        = string
}

variable "pusher_cluster" {
  description = "Pusher cluster"
  type        = string
}

variable "pusher_key" {
  description = "Pusher key"
  sensitive   = true
  type        = string
}

variable "scout_mac_dmg" {
  description = "The URL for downloading the Scout Electron macOS installer (DMG format)"
  type        = string
}

variable "scout_mac_zip" {
  description = "The URL for downloading the Scout Electron macOS installer (ZIP format)"
  type        = string
}

variable "scout_web_app" {
  description = "The URL for accessing the Scout Web App"
  type        = string
}

variable "scout_windows" {
  description = "The URL for downloading the Scout Electron Windows installer"
  type        = string
}

variable "slack_app_token" {
  description = "The Slack app token"
  sensitive   = true
  type        = string
}

variable "slack_bot_token" {
  description = "The Slack bot token"
  sensitive   = true
  type        = string
}

variable "slack_signing_secret" {
  description = "The Slack signing secret"
  sensitive   = true
  type        = string
}

variable "unstructured_api_key" {
  description = "The API key to use for Unstructured calls"
  sensitive   = true
  type        = string
}

variable "unstructured_api_url" {
  description = "The URL of the Unstructured API"
  type        = string
}

variable "zunou_ai_endpoint" {
  description = "The base URL of the Zunou AI API"
  type        = string
}

variable "zunou_ai_token" {
  description = "The static token needed to access the Zunou AI API"
  sensitive   = true
  type        = string
}

variable "scaling_api_key" {
  description = "API key for the scaling endpoints"
  sensitive   = true
  type        = string
}

variable "scaling_allowed_ips" {
  description = "Comma-separated list of IP addresses/CIDR blocks allowed to access scaling endpoints"
  type        = string
  default     = "127.0.0.1,::1"
}

variable "max_instances" {
  description = "Maximum number of instances that can be scaled to"
  type        = string
  default     = "10"
}

variable "min_instances" {
  description = "Minimum number of instances that can be scaled to (prevents scaling below this)"
  type        = string
  default     = "0"
}

variable "meet_bot_record_video" {
  description = "Enable video recording for meetbot (true for staging/dev, false for production)"
  type        = bool
  default     = false
}

# Error-log-watcher (error-assistant) Lambda
variable "error_log_watcher_s3_key" {
  description = "S3 key for the error-log-watcher Lambda deployment package"
  type        = string
  default     = "error_log_watcher_lambda_function.zip"
}

variable "error_log_watcher_repo_url" {
  description = "GitHub repo URL for error-log-watcher to clone and fix errors"
  type        = string
  default     = ""
  sensitive   = true
}

variable "error_log_watcher_github_app_id" {
  description = "GitHub App ID for error-log-watcher"
  type        = string
  default     = ""
  sensitive   = true
}

variable "error_log_watcher_github_installation_id" {
  description = "GitHub App Installation ID for error-log-watcher"
  type        = string
  default     = ""
  sensitive   = true
}

variable "error_log_watcher_github_app_private_key" {
  description = "GitHub App private key (PEM) for error-log-watcher"
  type        = string
  default     = ""
  sensitive   = true
}

variable "error_log_watcher_openai_model" {
  description = "OpenAI model for error-log-watcher agent"
  type        = string
  default     = "gpt-4o-mini"
}

variable "error_log_watcher_from_email" {
  description = "From email for error-log-watcher notifications (must be verified in SES)"
  type        = string
  default     = "support@zunou.ai"
}

variable "error_log_watcher_default_notification_email" {
  description = "Default notification email for error-log-watcher"
  type        = string
  default     = ""
}
