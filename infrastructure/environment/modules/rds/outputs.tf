output "kestra_database_url" {
  value = "postgresql://${aws_db_instance.kestra.endpoint}/${aws_db_instance.kestra.db_name}"
}
