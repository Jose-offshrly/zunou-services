resource "aws_route53_record" "domain_validation" {
  for_each = {
    for dvo in var.domain_validation_options : dvo.domain_name => {
      name = dvo.resource_record_name
      // We have a conflict with the DNS created by Laravel vapor, which has no trailing dot.
      // All attempts to fix it or ignore it have failed though...
      # record = trimsuffix(dvo.resource_record_value, ".")
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.primary.zone_id
}

// AWS SES
resource "aws_route53_record" "aws_ses_subdomain_verification" {
  allow_overwrite = true
  name            = "_amazonses.${var.subdomain}"
  records         = [var.aws_ses_domain_verification_token]
  ttl             = 60
  type            = "TXT"
  zone_id         = data.aws_route53_zone.primary.zone_id
}

resource "aws_route53_record" "aws_ses_dkim" {
  count           = 3
  name            = "${var.aws_ses_dkim_tokens[count.index]}._domainkey.${var.subdomain}"
  allow_overwrite = true
  records         = ["${var.aws_ses_dkim_tokens[count.index]}.dkim.amazonses.com"]
  ttl             = 60
  type            = "CNAME"
  zone_id         = data.aws_route53_zone.primary.zone_id
}

resource "aws_route53_record" "kestra" {
  name    = "kestra.${var.subdomain}"
  type    = "A"
  zone_id = data.aws_route53_zone.primary.zone_id

  alias {
    evaluate_target_health = true
    name                   = var.load_balancer_dns_name
    zone_id                = var.load_balancer_zone_id
  }
}

resource "aws_route53_record" "unstructured" {
  name    = "unstructured.${var.subdomain}"
  type    = "A"
  zone_id = data.aws_route53_zone.primary.zone_id

  alias {
    evaluate_target_health = true
    name                   = var.load_balancer_dns_name
    zone_id                = var.load_balancer_zone_id
  }
}

resource "aws_route53_record" "uploader" {
  name    = "uploader.${var.subdomain}"
  type    = "A"
  zone_id = data.aws_route53_zone.primary.zone_id

  alias {
    evaluate_target_health = true
    name                   = var.load_balancer_dns_name
    zone_id                = var.load_balancer_zone_id
  }
}