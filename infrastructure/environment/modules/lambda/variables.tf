variable "aws_region" {
  description = "The aws region where this lambda is deployed"
  type        = string
}

variable "ecs_scaler_lambda_role_arn" {
  type = string
}

variable "environment" {
  description = "The deployment environment (e.g., dev, staging, prod)"
  type        = string
}

variable "meet-bot_hostname" {
  description = "The url path of meet-bot"
  type        = string
}

variable "lambda_execution_role_arn" {
  description = "IAM Role ARN for Lambda execution"
  type        = string
}

variable "meet_bot_results_lambda_role_arn" {
  description = "The ARN of the IAM Role that Meet bot results lambda runs under"
  type        = string
}

variable "meet_bot_results_queue_url" {
  description = "URL of the Meet Bot Results SQS Queue"
  type        = string
}

variable "min_instances" {
  description = "Minimum number of instances that can be scaled to (prevents scaling below this)"
  type        = string
  default     = "0"
}

variable "scout_ai_proxy_lambda_role_arn" {
  description = "IAM Role ARN for Scout AI Proxy Lambda execution"
  type        = string
}

variable "scout_ai_proxy_s3_key" {
  description = "S3 key for the scout-ai-proxy Lambda deployment package"
  type        = string
  default     = "scout_ai_proxy_lambda_function.zip"
}

variable "openai_api_key" {
  description = "OpenAI API key for scout-ai-proxy Lambda"
  type        = string
  sensitive   = true
  default     = ""
}

variable "auth0_domain" {
  description = "Auth0 domain for scout-ai-proxy Lambda"
  type        = string
  default     = ""
}

variable "auth0_audience" {
  description = "Auth0 audience for scout-ai-proxy Lambda"
  type        = string
  default     = ""
}

variable "assemblyai_api_key" {
  description = "AssemblyAI API key for scout-ai-proxy Lambda"
  type        = string
  sensitive   = true
  default     = ""
}

# Error-log-watcher (error-assistant) Lambda
variable "error_log_watcher_execution_role_arn" {
  description = "ARN of the IAM role for error-log-watcher Lambda"
  type        = string
  default     = ""
}

variable "error_log_watcher_s3_key" {
  description = "S3 key for the error-log-watcher Lambda deployment package"
  type        = string
  default     = "error_log_watcher_lambda_function.zip"
}

variable "error_log_watcher_source_log_group_name" {
  description = "Name of the API queue log group this environment watches"
  type        = string
  default     = ""
}

variable "error_log_watcher_source_log_group_arn" {
  description = "ARN of the API queue log group this environment watches"
  type        = string
  default     = ""
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
  description = "From email for error-log-watcher notifications (SES verified)"
  type        = string
  default     = ""
}

variable "error_log_watcher_default_notification_email" {
  description = "Default notification email for error-log-watcher"
  type        = string
  default     = ""
}