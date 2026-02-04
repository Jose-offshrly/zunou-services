terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 6.0.0"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

# ACM Certificate in us-east-1 (required for CloudFront)
resource "aws_acm_certificate" "ai_proxy" {
  provider          = aws.us_east_1
  domain_name       = var.ai_proxy_hostname
  validation_method = "DNS"
  tags              = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation record for the certificate
resource "aws_route53_record" "ai_proxy_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ai_proxy.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}

# Wait for certificate validation
resource "aws_acm_certificate_validation" "ai_proxy" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.ai_proxy.arn
  validation_record_fqdns = [for record in aws_route53_record.ai_proxy_cert_validation : record.fqdn]
}

# CloudFront distribution for AI Proxy
resource "aws_cloudfront_distribution" "ai_proxy" {
  enabled         = true
  comment         = "AI Proxy Lambda - ${var.environment}"
  is_ipv6_enabled = true
  aliases         = [var.ai_proxy_hostname]

  origin {
    # Lambda Function URL domain (strip https:// and trailing /)
    domain_name = replace(replace(var.lambda_function_url, "https://", ""), "/", "")
    origin_id   = "ai-proxy-lambda"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ai-proxy-lambda"
    viewer_protocol_policy = "redirect-to-https"

    # Disable caching for API requests
    cache_policy_id = aws_cloudfront_cache_policy.ai_proxy.id
    # Use AWS managed policy that forwards all headers EXCEPT Host
    # This is required for Lambda Function URLs which validate the Host header
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # Managed-AllViewerExceptHostHeader

    compress = false
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.ai_proxy.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = var.tags

  depends_on = [aws_acm_certificate_validation.ai_proxy]
}

# Cache policy - disable caching for API
resource "aws_cloudfront_cache_policy" "ai_proxy" {
  name        = "ai-proxy-no-cache-${var.environment}"
  comment     = "No caching for AI Proxy API"
  default_ttl = 0
  max_ttl     = 0
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# Route53 ALIAS record pointing to CloudFront
resource "aws_route53_record" "ai_proxy" {
  name    = var.ai_proxy_hostname
  type    = "A"
  zone_id = var.route53_zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.ai_proxy.domain_name
    zone_id                = aws_cloudfront_distribution.ai_proxy.hosted_zone_id
  }
}
