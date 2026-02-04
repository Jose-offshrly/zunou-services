locals {

  instance_counts = {
    development = {
      calendar-service  = 0
      kestra            = 0
      meet-bot          = 0 
      scheduler-service = 0
      slack             = 0
      unstructured      = 0
      uploader          = 0
    }
    staging = {
      calendar-service  = 0
      kestra            = 0
      meet-bot          = 2
      scheduler-service = 1
      slack             = 0
      unstructured      = 1
      uploader          = 1
    }
    production = {
      calendar-service  = 0
      kestra            = 0
      meet-bot          = 6
      scheduler-service = 1
      slack             = 0
      unstructured      = 1
      uploader          = 1
    }
  }

  #for the lambda service scaledown automation
  services_to_scale = {
    for svc in [
      "calendar-service",
      "meet-bot", 
      "scheduler-service", 
      "kestra",
      "slack",
      "unstructured",
      "uploader"
    ] : svc => local.instance_counts[var.environment][svc]
  }
  
  # disable autoscaling for prod
  services_to_scale_if_enabled = var.environment == "production" ? {} : local.services_to_scale


  calendar-service_production_version = "0.0.0"
  calendar-service_staging_version = "0.0.0-staging.0"
  calendar-service_version = "${var.environment}-latest"
  calendar-service_instance_count  = local.instance_counts[var.environment].calendar-service
  calendar-service_instance_cpu    = 2048
  calendar-service_instance_memory = 4096


  kestra_basic_auth_password = "kestra2024!"
  kestra_basic_auth_username = "admin@zunou.ai"
  kestra_instance_count = local.instance_counts[var.environment].kestra

  kestra_instance_cpu        = 2048
  kestra_instance_memory     = 4096
  kestra_production_version = "36.1.0-staging.1"
  kestra_staging_version = "41.0.0-staging.23"
  kestra_version = local.kestra_staging_version

  scheduler-service_production_version = "0.0.0"
  scheduler-service_staging_version = "0.0.0-staging.0"
  scheduler-service_version = "${var.environment}-latest"
  scheduler-service_instance_count = local.instance_counts[var.environment].scheduler-service
  scheduler-service_instance_cpu    = 2048
  scheduler-service_instance_memory = 4096

  slack_production_version = "34.0.0"
  slack_staging_version = "70.0.0-staging.1"

  slack_version = local.slack_staging_version
  slack_instance_count  = local.instance_counts[var.environment].slack
  slack_instance_cpu    = 512
  slack_instance_memory = 1024
  slack_listen_command  = var.environment == "production" ? "/zunou" : "/zunou-${var.environment}"


  meet-bot_version = "${var.environment}-latest"
  meet-bot_instance_count = local.instance_counts[var.environment].meet-bot
  meet-bot_instance_cpu    = 2048
  meet-bot_instance_memory = 4096
  meet-bot_s3_bucket = "meet-bot-${var.environment}"

  unstructured_production_version = "33.0.0"
  unstructured_staging_version = "70.0.0-staging.1"

  unstructured_version = local.unstructured_staging_version
  unstructured_instance_count  = local.instance_counts[var.environment].unstructured
  unstructured_instance_cpu    = 2048
  unstructured_instance_memory = 4096

  uploader_staging_version = "34.0.0-staging.3"
  uploader_version = local.uploader_staging_version
  uploader_instance_count  = local.instance_counts[var.environment].uploader
  uploader_instance_cpu    = 1024
  uploader_instance_memory = 2048

  user_email_map = {
    "production"  = "pulse@zunou.ai"
    "staging"     = "pulse-stg@zunou.ai"
    "development" = "pulse-dev@zunou.ai"
  }
}

variable "auth0_audience" {
  description = "The audience of the Auth0 application"
  type        = string
}

variable "auth0_domain" {
  description = "The domain used to sign into Auth0"
  type        = string
}

variable "auth0_m2m_client_id" {
  description = "The client ID of the M2M Auth0 application"
  type        = string
}

variable "auth0_m2m_client_secret" {
  description = "The client secret of the M2M Auth0 application"
  sensitive   = true
  type        = string
}

variable "aws_region" {
  description = "The AWS region that we are running in"
  type        = string
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

variable "calendar-service_hostname" {
  description = "The hostname of the Calendar service"
  type        = string
}

variable "calendar-service_log_group_name" {
  description = "The name of the log group to send Calendar service logs to"
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

variable "core_graphql_url" {
  description = "The URL of the Zonou GraphQL server"
  type        = string
}

variable "database_url" {
  description = "The URL of the main API's database"
  sensitive   = true
  type        = string
}

variable "default_security_group_id" {
  description = "The ID of the VPC's default security group"
  type        = string
}

variable "dynamo_meet_bot_recordings_name" {
  description = "The name of the DynamoDB table for Meet Bot recordings"
  type        = string
}

variable "ecs_default_security_group_id" {
  type        = string
  description = "ECS default security group ID."
}

variable "ecs_scaler_lambda_arn" {
  type = string
  description = "ARN of the lambda function that scales down at weekend."
}

variable "ecs_scaler_lambda_role_arn" {
  type = string
  description = "ARN of the lambda function role that scales down at weekend."
}

variable "ecs_tasks_role_arn" {
  description = "The ARN of the role used to run ECS tasks"
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
}

variable "eventbridge_scheduler_role_arn" {
  description = "The ARN of the role used to run the EventBridge scheduler"
  type        = string
}

variable "github_access_token" {
  description = "The GitHub access token needed to check out source code for Kestra scripts"
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

variable "kestra_database_url" {
  description = "The URL of the Kestra database instance on RDS"
  sensitive   = true
  type        = string
}

variable "kestra_hostname" {
  description = "The hostname of the Kestra service"
  type        = string
}

variable "kestra_log_group_name" {
  description = "The name of the log group to send Kestra logs to"
  type        = string
}

variable "kestra_s3_bucket_name" {
  description = "The name of the S3 bucket where Kestra stores its data"
  type        = string
}

variable "kestra_slack_webhook_key" {
  description = "The secret used to verify messages to the Slack webhook"
  sensitive   = true
  type        = string
}

variable "load_balancer_calendar-service_target_group_arn" {
  description = "The ARN of the Calendar service load balancer target group"
  type        = string
}

variable "load_balancer_kestra_target_group_arn" {
  description = "The ARN of the kestra load balancer target group"
  type        = string
}



# variable "load_balancer_meet-bot_target_group_arn" {
#   description = "The ARN of the meet bot load balancer target group"
#   type        = string
# }

variable "load_balancer_scheduler-service_target_group_arn" {
  description = "The ARN of the Scheduler service load balancer target group"
  type        = string
}

variable "load_balancer_unstructured_target_group_arn" {
  description = "The ARN of the unstructured.io load balancer target group"
  type        = string
}

variable "load_balancer_uploader_target_group_arn" {
  description = "The ARN of the uploader load balancer target group"
  type        = string
}

variable "meet-bot_hostname" {
  description = "The hostname of the Meet-bot service"
  type        = string
}

variable "meet-bot_log_group_name" {
  description = "The name of the log group to send Meet bot logs to"
  type        = string
}

variable "meet_bot_s3_bucket_name" {
  description = "The S3 bucket for the Meet-bot service"
  type        = string
}

variable "meet_bot_security_group_id" {
  type        = string
  description = "Security group ID for the Meet Bot ECS service."
}

variable "mq_meet_bot_url" {
  description = "The URL of the Amazon MQ broker for Meet Bot"
  type        = string
}

variable "mq_security_group_id" {
  description = "The ID of the security group for the Amazon MQ broker"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "The ARN of the primary encryption key"
  type        = string
}

variable "private_subnet_ids" {
  description = "The IDs of the private VPC subnets to run in"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "The IDs of the public VPC subnets to run in"
  type        = list(string)
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
  description = "The name of the OpenAI embedding model to use"
  type        = string
}

variable "openai_summary_model" {
  description = "The name of the OpenAI summary model to use"
  type        = string
}

variable "pinecone_api_key" {
  description = "The Pinecone API key"
  type        = string
}

variable "pinecone_index_name" {
  description = "The Pinecone Index name (this should be replaced by code)"
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

variable "pulse_hostname" {
  description = "The hostname of the Pulse service"
  type        = string
}

variable "s3_data_sources_bucket_name" {
  description = "The name of the S3 bucket where we upload data source CSV files"
  type        = string
}

variable "scheduler-service_hostname" {
  description = "The hostname of the Scheduler service"
  type        = string
}

variable "scheduler-service_log_group_name" {
  description = "The name of the log group to send Scheduler service logs to"
  type        = string
}

variable "scheduler_service_security_group_id" {
  type        = string
  description = "Security group ID for the Scheduler ECS service."
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

variable "slack_log_group_name" {
  description = "The name of the log group to send Slack logs to"
  type        = string
}

variable "slack_signing_secret" {
  description = "The Slack signing secret"
  sensitive   = true
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}

variable "unstructured_hostname" {
  description = "The hostname of the unstructured.io server"
  type        = string
}

variable "unstructured_log_group_name" {
  description = "The name of the log group to send unstructured.io logs to"
  type        = string
}


variable "unstructured_api_key" {
  description = "The unstructured.io API Key"
  type        = string
}

variable "unstructured_api_url" {
  description = "The url of the unstructured.io API"
  type        = string
}

variable "uploader_hostname" {
  description = "The hostname of the upload server"
  type        = string
}

variable "uploader_log_group_name" {
  description = "The name of the log group to send Uploader logs to"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC to run in"
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
  description = "Enable video recording for meetbot"
  type        = bool
  default     = false
}