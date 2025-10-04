output "rds_endpoint" {
  value       = module.database.rds_endpoint
  description = "Endpoint para conectar a la base de datos de dev"
}

output "rds_master_secret_arn" {
  value       = module.database.rds_master_secret_arn
  description = "ARN del secreto del usuario maestro en Secrets Manager"
}

output "db_security_group_id" {
  value       = module.database.db_security_group_id
  description = "ID del security group de la base de datos"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "subnet_ids_used" {
  value = module.vpc.public_subnet_ids
}

output "db_endpoint" {
  value       = try(module.database.db_endpoint, null)
  description = "Endpoint de la base (si el módulo lo expone)"
}