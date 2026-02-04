locals {
  auth0_algorithm      = "RS256"
  auth0_api_identifier = "https://api.zunou.ai/"
  auth0_grant_types    = ["authorization_code", "implicit", "refresh_token"]
  auth0_origins = concat(
    [for domain in values(var.hostnames) : "https://${domain}"],
    local.dev_domains,
    var.extra_auth0_origins,
  )
  auth0_token_lifetime = 86400 // 1 day - the maximum allowed for 'token_lifetime_for_web'.
  dev_domains          = var.environment == "production" ? [] : [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://localhost",
    "https://localhost/zunou-demo/public/"
  ]
  favicon_url          = "https://zunou.files.wordpress.com/2024/01/cropped-zunou-icon.png?w=64"
  logo_url             = "https://zunou.files.wordpress.com/2024/01/zunou-logo-color.png?w=409&h=56"
  primary_color        = "#FC0772"
  secondary_color      = "#151515"
  support_url          = "https://zunou.ai/contact/"
}

variable "auth0_domain" {
  description = "The domain used to sign into Auth0"
  type        = string
}

variable "auth0_email" {
  description = "The Zunou account email"
  type        = string
}

variable "aws_region" {
  description = "The AWS region that we are running in"
  type        = string
}

variable "aws_ses_access_key_id" {
  description = "The access key used to send emails via AWS SES"
  type        = string
}

variable "aws_ses_secret_access_key" {
  description = "The secret used to send emails via AWS SES"
  sensitive   = true
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "hostnames" {
  description = "The hostnames that are served"
  type        = map(any)
}

variable "origin_domain" {
  description = "The root-level domain serving applications"
  type        = string
}

variable "support_email" {
  description = "The Zunou.ai support email"
  type        = string
}

variable "extra_auth0_origins" {
  description = "Additional allowed origins for Auth0"
  type        = list(string)
  default     = []
}
