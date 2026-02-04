output "broker_arn" {
  description = "ARN of the Amazon MQ Broker"
  value       = aws_mq_broker.meet_bot.arn
}

output "broker_id" {
  description = "ID of the Amazon MQ Broker"
  value       = aws_mq_broker.meet_bot.id
}

output "broker_endpoint" {
  description = "Endpoint of the Amazon MQ Broker"
  value       = aws_mq_broker.meet_bot.instances.0.endpoints
}

output "rabbitmq_security_group_id" {
  description = "RabbitMQ Security Group ID"
  value       = aws_security_group.rabbitmq.id
}