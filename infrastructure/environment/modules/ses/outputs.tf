output "aws_ses_access_key_id" {
  value       = aws_iam_access_key.auth0.id
  description = "The access key used to send emails via AWS SES"
}

output "aws_ses_secret_access_key" {
  value       = aws_iam_access_key.auth0.secret
  description = "The secret used to send emails via AWS SES"
}

output "aws_ses_dkim_tokens" {
  value       = aws_ses_domain_dkim.zunou.dkim_tokens
  description = "The list of DKIM tokens used to verify ownership of a domain for SES email purposes"
}

output "aws_ses_domain_verification_token" {
  value       = aws_ses_domain_identity.zunou.verification_token
  description = "The verification token needed to verify a domain on AWS"
}
