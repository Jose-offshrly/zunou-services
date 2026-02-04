output "cloudfront_distribution_id" {
  description = "The CloudFront distribution ID"
  value       = aws_cloudfront_distribution.ai_proxy.id
}

output "cloudfront_domain_name" {
  description = "The CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.ai_proxy.domain_name
}

output "custom_domain" {
  description = "The custom domain for the AI Proxy"
  value       = var.ai_proxy_hostname
}
