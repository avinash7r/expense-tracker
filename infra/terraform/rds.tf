resource "aws_db_subnet_group" "main" {
  name = "${local.name}-rds-subnet-group"
  subnet_ids = [
    aws_subnet.rds_1a.id,
    aws_subnet.rds_1b.id
  ]
}

resource "aws_db_instance" "main" {
  identifier        = "${local.name}-rds-instance"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name = "expensetrackerdb"
  username = "avi"
  password = var.db_password

  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = [ aws_security_group.sg_rds.id ]

  publicly_accessible = false
  skip_final_snapshot = true
  backup_retention_period = 0
  multi_az = false

  iam_database_authentication_enabled = true

}


