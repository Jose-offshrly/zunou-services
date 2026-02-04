resource "aws_kms_key" "primary" {
  description = "primary-key-${var.environment}"
  tags        = var.tags
}
