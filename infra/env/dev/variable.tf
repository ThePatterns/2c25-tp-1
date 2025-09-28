variable "project_name" {
  type    = string
  default = "Arvault"
}

variable "region" {
  description = "Región de AWS para el entorno dev"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Nombre del ambiente (por ejemplo: dev, qa, prod)"
  type        = string
  default     = "dev"
}

variable "db_username" {
  description = "Usuario maestro de la base de datos"
  type        = string
  default     = "Arvault"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "azs" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = []
}

variable "ingress_cidr" {
  type    = string
  default = "0.0.0.0/0"
}

