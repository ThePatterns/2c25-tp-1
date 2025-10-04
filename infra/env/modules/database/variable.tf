variable "prefix" {
  description = "Prefijo para nombrar recursos"
  type        = string
  default     = "dev"
}

variable "vpc_id" {
  description = "ID del VPC donde se desplegará la base de datos"
  type        = string
}

variable "subnet_ids" {
  description = "Lista de IDs de subnets para el grupo de subnets"
  type        = list(string)
}

variable "ingress_cidr" {
  description = "CIDR para acceso a la base de datos"
  type        = string
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
}

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
}

variable "engine_version" {
  description = "Versión del motor de PostgreSQL"
  type        = string
  default     = "16.3"
}

variable "instance_class" {
  description = "Tipo de instancia para la base de datos"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Almacenamiento asignado en GB"
  type        = number
  default     = 2
}

variable "publicly_accessible" {
  description = "Si la base de datos es accesible públicamente"
  type        = bool
  default     = false
}