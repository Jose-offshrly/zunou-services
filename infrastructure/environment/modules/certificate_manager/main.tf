# resource "aws_acm_certificate" "primary" {
#   domain_name               = var.origin_domain
#   subject_alternative_names = values(var.hostnames)
#   tags                      = var.tags
#   validation_method         = "DNS"

#   lifecycle {
#     create_before_destroy = true
#   }
# }


resource "aws_acm_certificate" "primary" {
  domain_name               = var.cert_primary[0]
  subject_alternative_names = slice(var.cert_primary, 1, length(var.cert_primary))
  tags                      = var.tags
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "secondary" {
  domain_name               = var.cert_secondary[0]
  subject_alternative_names = slice(var.cert_secondary, 1, length(var.cert_secondary))
  tags                      = var.tags
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}