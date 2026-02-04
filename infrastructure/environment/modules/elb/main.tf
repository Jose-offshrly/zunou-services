resource "aws_lb" "primary" {
  internal           = false
  load_balancer_type = "application"
  name               = "primary-${var.environment}"
  security_groups    = [var.load_balancer_security_group_id]
  subnets            = var.public_subnet_ids
  tags               = var.tags
  idle_timeout = 600
}

resource "aws_lb_listener" "https" {
  certificate_arn   = var.certificate_arn
  load_balancer_arn = aws_lb.primary.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  tags              = var.tags

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.primary.arn
  port              = 80
  protocol          = "HTTP"
  tags              = var.tags

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found"
      status_code  = "404"
    }
  }
}

# resource "aws_lb_listener" "custom_3000" {
#   load_balancer_arn = aws_lb.primary.arn
#   port              = 3000
#   protocol          = "HTTP"  
#   tags              = var.tags

#   default_action {
#     type = "fixed-response"

#     fixed_response {
#       content_type = "text/plain"
#       message_body = "Not Found"
#       status_code  = "404"
#     }
#   }
# }

#added to split the domains between two certificates
resource "aws_lb_listener_certificate" "secondary" {
  listener_arn    = aws_lb_listener.https.arn
  certificate_arn = var.secondary_certificate_arn
}

//-----------------------------------------------------------------------------
//
// Calendar-service
//
//-----------------------------------------------------------------------------

resource "aws_lb_listener_rule" "calendar-service_https" {
  listener_arn = aws_lb_listener.https.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.calendar-service.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.calendar-service_hostname]
    }
  }
}


resource "aws_lb_target_group" "calendar-service" {
  name        = "calendar-service-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  slow_start  = 30
  tags        = var.tags
  target_type = "ip"
  vpc_id      = var.vpc_id
  deregistration_delay = 30 # reduced from default of 300s

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 60
    path                = "/"
    timeout             = 5
    unhealthy_threshold = 3
    matcher             = "200,404"
  }
}

//-----------------------------------------------------------------------------
//
// Kestra
//
//-----------------------------------------------------------------------------
resource "aws_lb_listener_rule" "kestra_https" {
  listener_arn = aws_lb_listener.https.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.kestra.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.kestra_hostname]
    }
  }
}

resource "aws_lb_listener_rule" "kestra_http" {
  listener_arn = aws_lb_listener.http.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.kestra.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.kestra_hostname]
    }
  }
}

resource "aws_lb_target_group" "kestra" {
  name        = "kestra-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  slow_start  = 30
  tags        = var.tags
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 60
    path                = "/"
    timeout             = 30
    unhealthy_threshold = 3
    matcher             = "200,401"
  }
}

//-----------------------------------------------------------------------------
//
// Meet-bot
//
//-----------------------------------------------------------------------------

# resource "aws_lb_listener_rule" "meet-bot_3000" {
#   listener_arn = aws_lb_listener.custom_3000.arn
#   tags         = var.tags

#   action {
#     target_group_arn = aws_lb_target_group.meet-bot.arn
#     type             = "forward"
#   }

#   condition {
#     host_header {
#       values = [var.meet-bot_hostname]
#     }
#   }
# }

/*
resource "aws_lb_target_group" "meet-bot" {
  name        = "meet-bot-${var.environment}"
  port        = 3000
  protocol    = "HTTP"
  slow_start  = 30
  tags        = var.tags
  target_type = "ip"
  vpc_id      = var.vpc_id
  deregistration_delay = 30 # reduced from default of 300s

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 60
    path                = "/"
    timeout             = 5
    unhealthy_threshold = 3
  }
}
*/

//-----------------------------------------------------------------------------
//
// Scheduler-service
//
//-----------------------------------------------------------------------------

resource "aws_lb_listener_rule" "scheduler-service_https" {
  listener_arn = aws_lb_listener.https.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.scheduler-service.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.scheduler-service_hostname]
    }
  }
}

resource "aws_lb_target_group" "scheduler-service" {
  name        = "scheduler-service-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  slow_start  = 30
  tags        = var.tags
  target_type = "ip"
  vpc_id      = var.vpc_id
  deregistration_delay = 30 # reduced from default of 300s

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 60
    path                = "/"
    timeout             = 5
    unhealthy_threshold = 3
    matcher             = "200,404"
  }
}


//-----------------------------------------------------------------------------
//
// Unstructured
//
//-----------------------------------------------------------------------------
resource "aws_lb_listener_rule" "unstructured_https" {
  listener_arn = aws_lb_listener.https.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.unstructured.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.unstructured_hostname]
    }
  }
}

resource "aws_lb_listener_rule" "unstructured_http" {
  listener_arn = aws_lb_listener.http.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.unstructured.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.unstructured_hostname]
    }
  }
}

resource "aws_lb_target_group" "unstructured" {
  name        = "unstructured-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  slow_start  = 30
  tags        = var.tags
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 60
    path                = "/"
    timeout             = 30
    unhealthy_threshold = 3
  }
}



//-----------------------------------------------------------------------------
//
// Uploader
//
//-----------------------------------------------------------------------------
resource "aws_lb_listener_rule" "uploader_https" {
  listener_arn = aws_lb_listener.https.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.uploader.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.uploader_hostname]
    }
  }
}

resource "aws_lb_listener_rule" "uploader_http" {
  listener_arn = aws_lb_listener.http.arn
  tags         = var.tags

  action {
    target_group_arn = aws_lb_target_group.uploader.arn
    type             = "forward"
  }

  condition {
    host_header {
      values = [var.uploader_hostname]
    }
  }
}

resource "aws_lb_target_group" "uploader" {
  name        = "uploader-${var.environment}"
  port        = 80
  protocol    = "HTTP"
  slow_start  = 30
  tags        = var.tags
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 60
    path                = "/"
    timeout             = 30
    unhealthy_threshold = 3
  }
}
