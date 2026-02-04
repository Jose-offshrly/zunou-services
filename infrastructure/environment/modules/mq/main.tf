resource "aws_mq_broker" "meet_bot" {
  broker_name                = "meet-bot-broker-${var.environment}"
  deployment_mode            = local.broker_deployment_mode
  engine_type                = local.engine_type
  engine_version             = local.engine_version
  host_instance_type         = (
    var.environment == "production" ? "mq.m5.large" : "mq.t3.micro"
  )
  publicly_accessible        = local.publicly_accessible
  auto_minor_version_upgrade = local.auto_minor_version_upgrade
  apply_immediately          = local.apply_immediately

  # Place the broker in a VPC - not needed when public
  #security_groups = [aws_security_group.rabbitmq.id]
  #subnet_ids      = local.broker_subnet_ids

  user { #admin user
    username = var.mq_admin_username
    password = var.mq_admin_password
  }
  

  # For instance, if you need encryption
  encryption_options {
    use_aws_owned_key = local.use_aws_owned_key
  }

  logs {
    general    = local.enable_general_logs
    audit      = local.enable_audit_logs
  }
  
  # Tag the broker
  tags = var.tags
}

# Rabbit MQ Security Group (no direct SG references here)
resource "aws_security_group" "rabbitmq" {
  name        = "rabbitmq-${var.environment}"
  description = "SG for RabbitMQ"
  vpc_id      = var.vpc_id
  tags        = var.tags

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Separate rules to allow access from ECS + meet-bot SGs
resource "aws_security_group_rule" "ecs_to_rabbitmq" {
  type                     = "ingress"
  from_port                = 5671
  to_port                  = 5671
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rabbitmq.id
  source_security_group_id = var.ecs_default_security_group_id
  description              = "Allow ECS to access RabbitMQ"
}

resource "aws_security_group_rule" "meet_bot_to_rabbitmq" {
  type                     = "ingress"
  from_port                = 5671
  to_port                  = 5671
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rabbitmq.id
  source_security_group_id = var.meet_bot_security_group_id
  description              = "Allow meet-bot to access RabbitMQ"
}
