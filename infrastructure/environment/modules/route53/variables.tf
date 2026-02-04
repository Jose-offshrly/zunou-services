variable "aws_ses_dkim_tokens" {
  description = "The list of DKIM tokens used to verify ownership of a domain for SES email purposes"
  type        = list(string)
}

variable "aws_ses_domain_verification_token" {
  description = "A token used to verify ownership of a domain for SES email purposes"
  type        = string
}

variable "domain_validation_options" {
  description = "Data required to set up domain validation records"
  type        = any
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "load_balancer_dns_name" {
  description = "The DNS name attached to the load balancer"
  type        = string
}

variable "load_balancer_zone_id" {
  description = "The Zone ID that the load balancer is in"
  type        = string
}

variable "origin_domain" {
  description = "The root-level domain serving applications"
  type        = string
}

variable "subdomain" {
  description = "subdomain string for this environment"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
