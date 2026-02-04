variable "default_security_group_id" {
  description = "The ID of the VPC's default security group"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "kestra_database_password" {
  description = "The password for the Kestra database instance on RDS"
  sensitive   = true
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

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
