output "vpc_id" {
  description = "ID del VPC"
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "CIDR del VPC"
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "IDs de las subnets públicas"
  value       = [for k in sort(keys(aws_subnet.public)) : aws_subnet.public[k].id]
}

output "public_route_table_id" {
  description = "ID de la route table pública"
  value       = aws_route_table.public.id
}

output "private_subnet_ids" {
  description = "IDs de las subnets privadas (si existen)"
  value       = try([for k in sort(keys(aws_subnet.private)) : aws_subnet.private[k].id], [])
}

output "private_route_table_ids" {
  description = "IDs de las route tables privadas (si existen)"
  value       = try([for k in sort(keys(aws_route_table.private)) : aws_route_table.private[k].id], [])
}

output "igw_id" {
  description = "ID del Internet Gateway"
  value       = aws_internet_gateway.igw.id
}
