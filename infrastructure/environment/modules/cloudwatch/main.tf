resource "aws_cloudwatch_log_group" "calendar-service" {
  name              = "/aws/ecs/calendar-service-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "kestra" {
  name              = "/aws/ecs/kestra-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "meet-bot" {
  name              = "/aws/ecs/meet-bot-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "scheduler-service" {
  name              = "/aws/ecs/scheduler-service-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "slack" {
  name              = "/aws/ecs/slack-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "unstructured" {
  name              = "/aws/ecs/unstructured-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "uploader" {
  name              = "/aws/ecs/uploader-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "vpc_rejected" {
  name              = "/aws/vpc/rejected-${var.environment}"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "scout_ai_proxy" {
  name              = "/aws/lambda/scout-ai-proxy-${var.environment}"
  retention_in_days = 14
  tags              = var.tags
}
