module "ecr" {
  source = "./modules/ecr"

  prefix = local.prefix
  tags   = local.tags
}

module "iam" {
  source = "./modules/iam"

  ecr_repository_arns = module.ecr.repository_arns
  prefix              = local.prefix
  tags                = local.tags
}
