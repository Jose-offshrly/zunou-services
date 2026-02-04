variable "ai_proxy_hostname" {
  description = "The custom hostname for the AI Proxy (e.g., ai-proxy.zunou.ai)"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "lambda_function_url" {
  description = "The Lambda Function URL for the AI Proxy"
  type        = string
}

variable "route53_zone_id" {
  description = "The Route53 hosted zone ID for the domain"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
