data "aws_route53_zone" "primary" {
  name         = "zunou.ai"
  private_zone = false
}

data "aws_lb_hosted_zone_id" "main" {}
