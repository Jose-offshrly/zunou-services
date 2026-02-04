variable "auth0_email" {
  description = "The Zunou account email"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "origin_domain" {
  description = "The root-level domain serving applications"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
