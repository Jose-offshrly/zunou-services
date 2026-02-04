module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = ">= 3.19.0"

  azs             = var.azs
  cidr            = local.vpc_cidr
  name            = local.name
  private_subnets = [for k, v in var.azs : cidrsubnet(local.vpc_cidr, 8, k + 10)]
  public_subnets  = [for k, v in var.azs : cidrsubnet(local.vpc_cidr, 8, k)]
  tags            = var.tags

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
}

# Default Security Group
resource "aws_default_security_group" "default" {
  tags   = var.tags
  vpc_id = module.vpc.vpc_id

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 80
    protocol    = "tcp"
    to_port     = 80
  }

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 443
    protocol    = "tcp"
    to_port     = 443
  }

  # Allow node traffic
  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 3000
    protocol    = "tcp"
    to_port     = 3000
  }

  # Allow PostgreSQL traffic within the VPC
  ingress {
    from_port = 5432
    protocol  = "tcp"
    self      = true
    to_port   = 5432
  }

  # Allow RabbitMQ traffic within the VPC
  ingress {
    from_port                = 5432
    to_port                  = 5432
    protocol                 = "tcp"
    security_groups          = [aws_security_group.ecs_services.id]
    description              = "Allow ECS services to access Postgres"
  }

  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 80
    protocol    = "tcp"
    to_port     = 80
  }

  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 443
    protocol    = "tcp"
    to_port     = 443
  }

  # Allow node traffic
  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 3000
    protocol    = "tcp"
    to_port     = 3000
  }

  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 5432
    protocol    = "tcp"
    to_port     = 5432
  }

  /* egress { #for vpn access from meet-bot
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 8000
    protocol    = "tcp"
    to_port     = 8000
  } */

  # Allow UDP traffic for Google Meet (ports 19302 to 19309)
  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 19302
    to_port     = 19309
    protocol    = "udp"
  }

  # Allow UDP traffic for Google Meet on port 3478
  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 3478
    to_port     = 3478
    protocol    = "udp"
  }
  # for RabbitMQ
  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 5671
    to_port     = 5671
    protocol    = "tcp"
  }

  lifecycle {
    ignore_changes = [tags] // I don't know why this keeps triggering changes...
  }
}

resource "aws_flow_log" "vpc-flow-log-reject" {
  iam_role_arn    = var.flow_logs_role_arn
  log_destination = var.vpc_rejected_log_group_arn
  tags            = var.tags
  traffic_type    = "REJECT"
  vpc_id          = module.vpc.vpc_id
}

# Default ECS Security Group
resource "aws_security_group" "ecs_services" {
  name        = "ecs-services-${var.environment}"
  description = "SG for ECS services"
  vpc_id      = module.vpc.vpc_id
  tags        = var.tags

 
  # Open egress generally for internet-bound tasks
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Allow incoming from ALB SG only 
resource "aws_security_group_rule" "ecs_from_alb" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  security_group_id        = aws_security_group.ecs_services.id
  source_security_group_id = var.load_balancer_security_group_id
  description              = "Allow HTTP from ALB"
}



#Meet-bot Security Group
resource "aws_security_group" "meet_bot" {
  name        = "meet-bot-${var.environment}"
  description = "SG for meet-bot ECS service"
  vpc_id      = module.vpc.vpc_id
  tags        = var.tags

  ingress {
    description              = "Allow scheduler-service to call meet-bot"
    from_port                = 3000
    to_port                  = 3000
    protocol                 = "tcp"
    security_groups          = [aws_security_group.scheduler_service.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port                = 5671
    to_port                  = 5671
    protocol                 = "tcp"
    security_groups          = [var.mq_security_group_id]
    description              = "Allow meet-bot to connect to RabbitMQ"
  }
}

# Scheduler-service Security Group
resource "aws_security_group" "scheduler_service" {
  name        = "scheduler-service-${var.environment}"
  description = "SG for scheduler ECS service"
  vpc_id      = module.vpc.vpc_id
  tags        = var.tags

  ingress {
    description = "Allow HTTP from internet (for access by vapor lambda)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow access from allowed IPs"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.allowed_ips
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}