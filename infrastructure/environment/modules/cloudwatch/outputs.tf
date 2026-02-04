output "calendar-service_log_group_arn" {
  value = aws_cloudwatch_log_group.calendar-service.arn
}

output "calendar-service_log_group_name" {
  value = aws_cloudwatch_log_group.calendar-service.name
}

output "kestra_log_group_arn" {
  value = aws_cloudwatch_log_group.kestra.arn
}

output "kestra_log_group_name" {
  value = aws_cloudwatch_log_group.kestra.name
}

output "meet-bot_log_group_arn" {
  value = aws_cloudwatch_log_group.meet-bot.arn
}

output "meet-bot_log_group_name" {
  value = aws_cloudwatch_log_group.meet-bot.name
}

output "scheduler-service_log_group_arn" {
  value = aws_cloudwatch_log_group.scheduler-service.arn
}

output "scheduler-service_log_group_name" {
  value = aws_cloudwatch_log_group.scheduler-service.name
}

output "slack_log_group_arn" {
  value = aws_cloudwatch_log_group.slack.arn
}

output "slack_log_group_name" {
  value = aws_cloudwatch_log_group.slack.name
}

output "unstructured_log_group_arn" {
  value = aws_cloudwatch_log_group.unstructured.arn
}

output "unstructured_log_group_name" {
  value = aws_cloudwatch_log_group.unstructured.name
}

output "uploader_log_group_arn" {
  value = aws_cloudwatch_log_group.uploader.arn
}

output "uploader_log_group_name" {
  value = aws_cloudwatch_log_group.uploader.name
}

output "vpc_rejected_log_group_arn" {
  value = aws_cloudwatch_log_group.vpc_rejected.arn
}

output "scout_ai_proxy_log_group_arn" {
  value = aws_cloudwatch_log_group.scout_ai_proxy.arn
}
