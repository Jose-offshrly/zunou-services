locals {
  name     = "vpc-${var.environment}"
  vpc_cidr = "10.20.0.0/16"
}

variable "allowed_ips" {
  type        = list(string)
  description = "List of allowed CIDR blocks for ingress"
}

variable "azs" {
  description = "The AWS availability zones to run in"
  type        = list(string)
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "flow_logs_role_arn" {
  description = "The ARN of the role used to store flow logs"
  type        = string
}

variable "load_balancer_security_group_id" {  
  description = "The ID of the security group for the load balancer"
  type        = string
}

variable "mq_security_group_id" {
  description = "The ID of the security group for the Amazon MQ broker"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}

variable "vpc_rejected_log_group_arn" {
  description = "The ARN of the log group for recording rejected VPC requests"
  type        = string
}
