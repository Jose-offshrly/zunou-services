variable "default_security_group_id" {
  description = "The defualt security group"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}
