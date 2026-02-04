output "csv_data_source_queue_arn" {
  value = aws_sqs_queue.csv_data_source.arn
}

output "meet_bot_trigger_queue_arn" {
  value = aws_sqs_queue.meet_bot_trigger_queue.arn
}

output "meet_bot_trigger_queue_url" {
  value = aws_sqs_queue.meet_bot_trigger_queue.id
  description = "URL of the Meet Bot Trigger SQS Queue"
}

output "meet_bot_results_queue_url" {
  value = aws_sqs_queue.meet_bot_results_queue.id
  description = "URL of the Meet Bot Results SQS Queue"
}