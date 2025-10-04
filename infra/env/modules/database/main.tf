resource "aws_db_subnet_group" "this" {
  name       = "pg-subnets-${var.prefix}"
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "pg" {
  name        = "pg-sg-${var.prefix}"
  description = "Allow Postgres"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.ingress_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "pg" {
  identifier                 = "pg-app-${var.prefix}"
  engine                     = "postgres"
  engine_version             = var.engine_version
  instance_class             = var.instance_class
  allocated_storage          = var.allocated_storage
  db_name                    = var.db_name
  username                   = var.db_username

  manage_master_user_password = true

  db_subnet_group_name       = aws_db_subnet_group.this.name
  vpc_security_group_ids     = [aws_security_group.pg.id]
  storage_encrypted          = true
  publicly_accessible        = var.publicly_accessible
}