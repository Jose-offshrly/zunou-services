output "s3_meet-bot_bucket_arn" {
  value = aws_s3_bucket.meet-bot.arn
}

output "s3_meet-bot_bucket_name" {
  value = aws_s3_bucket.meet-bot.id
}

output "s3_data_sources_bucket_arn" {
  value = aws_s3_bucket.data_sources.arn
}

output "s3_data_sources_bucket_name" {
  value = aws_s3_bucket.data_sources.id
}

output "s3_kestra_bucket_arn" {
  value = aws_s3_bucket.kestra.arn
}

output "s3_kestra_bucket_name" {
  value = aws_s3_bucket.kestra.id
}
