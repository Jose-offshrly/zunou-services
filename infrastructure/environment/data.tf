data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_route53_zone" "primary" {
  name         = "zunou.ai"
  private_zone = false
}

data "aws_caller_identity" "current" {}

# Same bucket as Lambda zip; used for error-log-watcher deduplication (error-hashes/*)
data "aws_s3_bucket" "error_log_watcher_dedup" {
  bucket = "pulse-lambda-code"
}
