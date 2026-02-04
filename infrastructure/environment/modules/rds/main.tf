resource "aws_db_subnet_group" "zunou" {
  name       = "zunou-${var.environment}"
  subnet_ids = var.private_subnet_ids
  tags       = var.tags
}

resource "aws_db_instance" "kestra" {
  allocated_storage       = 10
  backup_retention_period = 7
  db_name                 = "kestra"
  db_subnet_group_name    = aws_db_subnet_group.zunou.name
  engine                  = "postgres"
  identifier              = "kestra-${var.environment}"
  instance_class          = "db.t4g.micro"
  kms_key_id              = var.primary_kms_key_arn
  password                = var.kestra_database_password
  skip_final_snapshot     = true
  storage_encrypted       = true
  tags                    = var.tags
  username                = "kestra"
  vpc_security_group_ids  = [var.default_security_group_id]
}
