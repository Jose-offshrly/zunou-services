locals {
  apply_immediately          = true
  auto_minor_version_upgrade = true

# For Single-Instance, pick the first subnet.
  broker_deployment_mode = "SINGLE_INSTANCE"
  broker_subnet_ids = [var.private_subnet_ids[0]]

# For Multi-AZ, allow multiple subnets (assuming you pass in at least two).
  /*
  broker_deployment_mode = var.environment == "production" ? "ACTIVE_STANDBY_MULTI_AZ" : "SINGLE_INSTANCE"

  broker_subnet_ids = (
    var.environment == "production"
      ? var.private_subnet_ids
      : [var.private_subnet_ids[0]]
  )
  */
  
  enable_audit_logs          = false
  enable_general_logs        = true
  engine_type                = "RabbitMQ"
  engine_version             = "3.13"
  publicly_accessible        = true
  use_aws_owned_key          = true
}

# Variables for Amazon MQ Broker Module

variable "default_security_group_id" {
  type        = string
  description = "Default security group ID for the VPC."
}

variable "ecs_default_security_group_id" {
  type        = string
  description = "ECS default security group ID."
}

variable "environment" {
  type        = string
  description = "Environment name (e.g., dev, staging, prod)."
}

variable "meet_bot_security_group_id" {
  type        = string
  description = "Security group ID for the Meet Bot ECS service."
}


variable "mq_admin_username" {
  type        = string
  description = "Username for the Amazon MQ broker."
}

variable "mq_admin_password" {
  type        = string
  description = "Password for the Amazon MQ broker."
  sensitive   = true
} 

variable "mq_consumer_username" {
  type        = string
  description = "Username for the Amazon MQ consumer."
}

variable "mq_consumer_password" {
  type        = string
  description = "Password for the Amazon MQ consumer."
  sensitive   = true
}

variable "private_subnet_ids" {
  type        = list(string)
  description = "List of private subnet IDs for the broker."
}

variable "security_groups" {
  type        = list(string)
  description = "List of security group IDs to associate with the broker. (If in a VPC)"
  default     = []
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs for the broker. (If in a VPC)"
  default     = []
}

variable "use_aws_owned_key" {
  type        = bool
  description = "Use the AWS owned CMK or a customer managed CMK."
  default     = true
}

variable "enable_general_logs" {
  type        = bool
  description = "Enable general broker logs."
  default     = true
}

variable "enable_audit_logs" {
  type        = bool
  description = "Enable audit logs."
  default     = false
}

variable "maintenance_day_of_week" {
  type        = string
  description = "The maintenance day of the week (e.g., MONDAY, TUESDAY...)."
  default     = "MONDAY"
}

variable "maintenance_time_of_day" {
  type        = string
  description = "The time of day for maintenance window (e.g., '02:00')."
  default     = "02:00"
}

variable "maintenance_time_zone" {
  type        = string
  description = "The time zone for maintenance window (e.g., 'UTC')."
  default     = "UTC"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID where the broker is deployed."
}

variable "tags" {
  type        = map(string)
  description = "Key-value map of tags."
  default     = {}
}