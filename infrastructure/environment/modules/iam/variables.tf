variable "calendar-service_log_group_arn" {
  description = "The ARN of the log group to send Calendar service logs to"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "kestra_log_group_arn" {
  description = "The ARN of the log group to send Kestra logs to"
  type        = string
}

variable "lambda_meet_bot_results_name" {
  description = "The name of the Meet Bot Results Lambda"
  type        = string
}

variable "meet-bot_log_group_arn" {
  description = "The ARN of the log group to send Meet bot logs to"
  type        = string
}

variable "meet_bot_s3_bucket_arn" {
  description = "The S3 bucket for Meet bot"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "The ARN of the primary encryption key"
  type        = string
}

variable "root_domain" {
  description = "The root domain name"
  type        = string
}

variable "s3_data_sources_bucket_arn" {
  description = "The ARN of the S3 bucket where we upload data source CSV files"
  type        = string
}

variable "s3_kestra_bucket_arn" {
  description = "The ARN of the S3 bucket where we store Kestra data"
  type        = string
}

variable "scheduler-service_log_group_arn" {
  description = "The ARN of the log group to send Scheduler service logs to"
  type        = string
}

variable "slack_log_group_arn" {
  description = "The ARN of the log group to send Slack logs to"
  type        = string
}

variable "sqs_csv_data_source_queue_arn" {
  description = "The ARN of the SQS queue to register new data sources with"
  type        = string
}

variable "sqs_meet_bot_trigger_queue_arn" {
  description = "The ARN of the SQS queue to trigger meet bot recordings"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}

variable "unstructured_log_group_arn" {
  description = "The ARN of the log group to send Unstructured.io logs to"
  type        = string
}

variable "uploader_log_group_arn" {
  description = "The ARN of the log group to send Uploader logs to"
  type        = string
}

variable "vpc_rejected_log_group_arn" {
  description = "The ARN of the log group for recording rejected VPC requests"
  type        = string
}

variable "scout_ai_proxy_log_group_arn" {
  description = "The ARN of the log group for Scout AI Proxy Lambda"
  type        = string
}

variable "error_log_watcher_dedup_bucket_arn" {
  description = "ARN of the S3 bucket for error-log-watcher deduplication (same as Lambda zip in production)"
  type        = string
  default     = ""
}

variable "error_log_watcher_source_log_group_arn" {
  description = "ARN of the API queue log group this environment watches (staging or production queue)"
  type        = string
  default     = ""
}
