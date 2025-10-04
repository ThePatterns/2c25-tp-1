output "rds_endpoint" {
  value       = aws_db_instance.pg.address
  description = "Endpoint para conectar a la base de datos"
}

output "rds_master_secret_arn" {
  value       = aws_db_instance.pg.master_user_secret[0].secret_arn
  description = "ARN del secreto de AWS Secrets Manager que contiene la contraseña del usuario maestro"
}

output "db_security_group_id" {
  value       = aws_security_group.pg.id
  description = "ID del grupo de seguridad de la base de datos"
}