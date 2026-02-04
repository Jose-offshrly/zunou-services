locals {
  bucket_cors_allowed_origins = [
    "https://*.staging.zunou.ai",
    "https://*.zunou.ai",
    "http://localhost:5173",
  ]
}

variable "allow_s3_to_call_lambda_results_id" {
  description = "The ID of the permission that allows S3 to invoke the Meet Bot Results Lambda"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "lambda_meet_bot_results_arn" {
  description = "The ARN of the Meetbot resultslambda function"
  type        = string
}

variable "primary_kms_key_arn" {
  description = "The ARN of the primary encryption key"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
