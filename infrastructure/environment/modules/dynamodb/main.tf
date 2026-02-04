resource "aws_dynamodb_table" "zunou" {
  name           = "zunou-pulse-dubbing-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "job_id" 
  range_key      = null

  attribute {
    name = "job_id"
    type = "S"  # Define the type here (S = String, N = Number, B = Binary)
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "meet-bot" {
  name         = "meet-bot-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "meeting_id"

  attribute {
    name = "meeting_id"
    type = "S"
  }

  attribute {
    name = "organization_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "org_user_index"
    hash_key        = "organization_id"
    range_key       = "user_id"
    projection_type = "ALL"
  }

  tags = var.tags
}


resource "aws_dynamodb_table" "meet_bot_recordings" {
  name         = "meet-bot-recordings-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "meeting_id"

  attribute {
    name = "meeting_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  # Global Secondary Index (GSI) for querying by status (e.g., active recordings)
  global_secondary_index {
    name               = "status_index"
    hash_key           = "status"
    projection_type    = "ALL"
  }

  tags = var.tags
}