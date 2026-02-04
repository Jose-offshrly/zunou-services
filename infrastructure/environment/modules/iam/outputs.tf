output "allow_s3_to_call_lambda_results_id" {
  description = "The ID of the permission that allows S3 to invoke the Meet Bot Results Lambda"
  value       = aws_lambda_permission.allow_s3_to_call_lambda_results.id
}

output "ecs_scaler_lambda_role_arn" {
  value = aws_iam_role.ecs_scaler_lambda.arn
}

output "ecs_tasks_role_arn" {
  value = aws_iam_role.ecs_tasks.arn
}

output "eventbridge_scheduler_role_arn" {
  description = "ARN of the EventBridge Scheduler IAM role"
  value       = aws_iam_role.eventbridge_scheduler.arn
}

output "flow_logs_role_arn" {
  value = aws_iam_role.flow_logs.arn
}

output "lambda_execution_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}

output "meet_bot_results_lambda_role_arn" {
  value = aws_iam_role.meetbot_lambda.arn
}

output "scout_ai_proxy_lambda_role_arn" {
  value = aws_iam_role.scout_ai_proxy_lambda.arn
}

output "error_log_watcher_execution_role_arn" {
  description = "ARN of the error-log-watcher Lambda execution role"
  value       = aws_iam_role.error_log_watcher_exec.arn
}
