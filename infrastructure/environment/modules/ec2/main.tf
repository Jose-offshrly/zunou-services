resource "aws_security_group" "load_balancer" {
  description = "Allow all inbound traffic on HTTPS"
  name        = "load-balancer-${var.environment}"
  tags        = var.tags
  vpc_id      = var.vpc_id

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

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 3000
    protocol    = "tcp"
    to_port     = 3000
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

  egress {
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 3000
    protocol    = "tcp"
    to_port     = 3000
  }

  egress {
  cidr_blocks = ["0.0.0.0/0"]
  from_port   = 5671
  to_port     = 5671
  protocol    = "tcp"
}
}

# resource "aws_security_group_rule" "ecs_allow_lb_3000" {
#   type                     = "ingress"
#   from_port                = 3000
#   to_port                  = 3000
#   protocol                 = "tcp"
#   security_group_id        = var.default_security_group_id
#   source_security_group_id = aws_security_group.load_balancer.id
# }