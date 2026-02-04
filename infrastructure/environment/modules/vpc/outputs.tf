output "default_security_group_id" {
  value = aws_default_security_group.default.id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnets
}

output "public_subnet_ids" {
  value = module.vpc.public_subnets
}

output "ecs_default_security_group_id" {
  value = aws_security_group.ecs_services.id
  description = "ECS Default Security Group ID"
}

output "meet_bot_security_group_id" {
  value = aws_security_group.meet_bot.id
  description = "Meet Bot Security Group ID"
}

output "scheduler_service_security_group_id" {
  value = aws_security_group.scheduler_service.id
  description = "ECS Security Group ID"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}
