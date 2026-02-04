variable "cert_primary" {
  description = "The first list of certs"
  type        = list(string)
}

variable "cert_secondary" {
  description = "The second list of certs"
  type        = list(string)
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

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
