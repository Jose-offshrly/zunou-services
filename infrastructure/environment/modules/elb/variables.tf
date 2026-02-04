variable "calendar-service_hostname" {
  description = "The hostname of the Calendar service"
  type        = string
}

variable "certificate_arn" {
  description = "The ARN of the SSL certificate"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "kestra_hostname" {
  description = "The hostname of the Kestra service"
  type        = string
}

variable "load_balancer_security_group_id" {
  description = "The ID of the load balancer's security group"
  type        = string
}

variable "meet-bot_hostname" {
  description = "The hostname of the Meet-bot service"
  type        = string
}

variable "public_subnet_ids" {
  description = "The IDs of the public VPC subnets to run in"
  type        = list(string)
}

variable "secondary_certificate_arn" {
  description = "The ARN of the secondary certificate covering scheduler domain"
  type        = string
}

variable "scheduler-service_hostname" {
  description = "The hostname of the Scheduler service"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}

variable "unstructured_hostname" {
  description = "The hostname of the unstructured service"
  type        = string
}

variable "uploader_hostname" {
  description = "The hostname of the uploader service"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC"
  type        = string
}
