resource "aws_sqs_queue" "csv_data_source" {
  name = "register-csv-data-source-${var.environment}"
  tags = var.tags
}

#Meetbot trigger queue
resource "aws_sqs_queue" "meet_bot_trigger_queue" {
  name                      = "meet-bot-trigger-${var.environment}"
  visibility_timeout_seconds = 30  # Adjust based on expected processing time
  message_retention_seconds  = 300  # 5 minutes
  redrive_policy             = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.trigger-dlq.arn
    maxReceiveCount     = 5
  })
  tags = var.tags
}

resource "aws_sqs_queue" "trigger-dlq" {
  name = "meet-bot-trigger-dlq-${var.environment}"
  tags = var.tags
}

#Meetbot results queue
resource "aws_sqs_queue" "meet_bot_results_dlq" {
  name                      = "meet-bot-results-dlq-${var.environment}"
  message_retention_seconds = 300
  tags                      = var.tags
}

resource "aws_sqs_queue" "meet_bot_results_queue" {
  name                      = "meet-bot-results-${var.environment}"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 300
  redrive_policy             = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.meet_bot_results_dlq.arn
    maxReceiveCount     = 5
  })
  tags = var.tags
}