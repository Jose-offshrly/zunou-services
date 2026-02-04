//-----------------------------------------------------------------------------
//
// Data Sources
//
//-----------------------------------------------------------------------------
resource "aws_s3_bucket" "data_sources" {
  bucket        = "data-sources-${var.environment}"
  force_destroy = true
  tags          = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_s3_bucket_cors_configuration" "data_sources" {
  bucket = aws_s3_bucket.data_sources.id

  cors_rule {
    allowed_origins = local.bucket_cors_allowed_origins
    allowed_headers = [
      "Authorization",
      "x-amz-date",
      "x-amz-content-sha256",
      "content-type"
    ]
    allowed_methods = ["GET", "PUT", "POST"]
    expose_headers  = ["ETag"]
  }
}

resource "aws_s3_bucket_versioning" "data_sources" {
  bucket = aws_s3_bucket.data_sources.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data_sources" {
  bucket = aws_s3_bucket.data_sources.bucket

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.primary_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "data_sources" {
  bucket = aws_s3_bucket.data_sources.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_metric" "data_sources" {
  bucket = aws_s3_bucket.data_sources.bucket
  name   = "EntireBucket"
}


//-----------------------------------------------------------------------------
//
// Kestra
//
//-----------------------------------------------------------------------------
resource "aws_s3_bucket" "kestra" {
  bucket        = "zunou-kestra-${var.environment}"
  force_destroy = true
  tags          = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kestra" {
  bucket = aws_s3_bucket.kestra.bucket

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.primary_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "kestra" {
  bucket = aws_s3_bucket.kestra.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_metric" "kestra" {
  bucket = aws_s3_bucket.kestra.bucket
  name   = "EntireBucket"
}

//-----------------------------------------------------------------------------
//
// Meet-bot
//
//-----------------------------------------------------------------------------
resource "aws_s3_bucket" "meet-bot" {
  bucket        = "meet-bot-${var.environment}"
  force_destroy = true
  tags          = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_s3_bucket_cors_configuration" "meet-bot" {
  bucket = aws_s3_bucket.meet-bot.id

  cors_rule {
    allowed_origins = local.bucket_cors_allowed_origins
    allowed_headers = [
      "Authorization",
      "x-amz-date",
      "x-amz-content-sha256",
      "content-type"
    ]
    allowed_methods = ["GET", "PUT", "POST"]
    expose_headers  = ["ETag"]
  }
}

resource "aws_s3_bucket_versioning" "meet-bot" {
  bucket = aws_s3_bucket.meet-bot.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "meet-bot" {
  bucket = aws_s3_bucket.meet-bot.bucket

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.primary_kms_key_arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "meet-bot" {
  bucket = aws_s3_bucket.meet-bot.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_metric" "meet-bot" {
  bucket = aws_s3_bucket.meet-bot.bucket
  name   = "EntireBucket"
}

# S3 Bucket Notification for triggering Lambda functions - to pass back results to Pulse
resource "aws_s3_bucket_notification" "meet_bot_notification" {
  bucket = aws_s3_bucket.meet-bot.id

  # New notification for meeting results transcriptions
  lambda_function {
    events              = ["s3:ObjectCreated:*"]
    lambda_function_arn = var.lambda_meet_bot_results_arn
    filter_prefix       = "meetings/"
    filter_suffix       = "_transcriptions.log"
  }

  depends_on = [
      var.allow_s3_to_call_lambda_results_id,
  ]
}