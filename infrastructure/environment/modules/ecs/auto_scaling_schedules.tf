resource "aws_scheduler_schedule" "scale_down_services" {
  for_each   = local.services_to_scale_if_enabled
  name       = "scale-down-${each.key}-${var.environment}"
  group_name = "default"

  # 22:00 JST = 13:00 UTC (Mon–Sat)
  schedule_expression = "cron(0 13 ? * MON-SAT *)"
  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = var.ecs_scaler_lambda_arn
    role_arn = var.ecs_scaler_lambda_role_arn
    input = jsonencode({
      cluster       = aws_ecs_cluster.primary.name
      service       = "${each.key}-${var.environment}",
      desired_count = 0
    })
  }
}

resource "aws_scheduler_schedule" "scale_up_services" {
  for_each   = local.services_to_scale_if_enabled
  name       = "scale-up-${each.key}-${var.environment}"
  group_name = "default"

  # 04:00 JST = 19:00 UTC (Sunday to Friday for Mon–Sat JST)
  schedule_expression = "cron(0 19 ? * SUN-FRI *)"
  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = var.ecs_scaler_lambda_arn
    role_arn = var.ecs_scaler_lambda_role_arn
    input = jsonencode({
      cluster       = aws_ecs_cluster.primary.name
      service       = "${each.key}-${var.environment}",
      desired_count = each.value
    })
  }
}