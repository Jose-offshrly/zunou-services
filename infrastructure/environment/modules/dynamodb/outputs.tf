output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.zunou.name
}

output "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB table"
  value       = aws_dynamodb_table.zunou.arn
}

output "dynamo_meet_bot_recordings_table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.meet_bot_recordings.name
}