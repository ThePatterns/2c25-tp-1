variable "project_name" {
  type        = string
  description = "Prefijo/Nombre del proyecto para tags"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "Bloque CIDR del VPC"
}

variable "azs" {
  type        = list(string)
  description = "Zonas de disponibilidad a usar (mismo largo que las subnets)"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  type        = list(string)
  description = "CIDRs para subnets públicas (mismo largo que azs)"
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type        = list(string)
  default     = []
  description = "CIDRs para subnets privadas (opcional, mismo largo que azs)"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags adicionales para todos los recursos"
}