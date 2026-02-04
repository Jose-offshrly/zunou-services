output "load_balancer_calendar-service_target_group_arn" {
  value = aws_lb_target_group.calendar-service.arn
}

output "load_balancer_kestra_target_group_arn" {
  value = aws_lb_target_group.kestra.arn
}

# output "load_balancer_meet-bot_target_group_arn" {
#   value = aws_lb_target_group.meet-bot.arn
# }

output "load_balancer_dns_name" {
  value = aws_lb.primary.dns_name
}

output "load_balancer_scheduler-service_target_group_arn" {
  value = aws_lb_target_group.scheduler-service.arn
}

output "load_balancer_unstructured_target_group_arn" {
  value = aws_lb_target_group.unstructured.arn
}

output "load_balancer_uploader_target_group_arn" {
  value = aws_lb_target_group.uploader.arn
}

output "load_balancer_zone_id" {
  value = aws_lb.primary.zone_id
}
