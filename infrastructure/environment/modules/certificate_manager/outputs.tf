output "certificate_arn" {
  value = aws_acm_certificate.primary.arn
}

output "domain_validation_options" {
  value = aws_acm_certificate.primary.domain_validation_options
}

output "secondary_certificate_arn" {
  description = "The ARN of the secondary certificate covering scheduler domain"
  value       = aws_acm_certificate.secondary.arn
}
