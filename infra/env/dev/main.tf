module "vpc" {
  source = "../modules/vpc"

  project_name        = "${var.project_name}-${var.environment}"
  vpc_cidr            = var.vpc_cidr
  azs                 = var.azs
  public_subnet_cidrs = var.public_subnet_cidrs

  tags = {
    Environment = var.environment
  }
}

module "database" {
  source = "../modules/database"

  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.public_subnet_ids
  ingress_cidr        = var.ingress_cidr
  db_name             = "${var.project_name}${var.environment}"
  db_username         = var.db_username
  allocated_storage   = 20
  publicly_accessible = true
}