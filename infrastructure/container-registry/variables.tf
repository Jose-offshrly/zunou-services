locals {
  prefix     = "cr" # The prefix used to name resources.
  aws_region = "ap-northeast-1"
  tags = {
    CostCenter = "Tech"
    Department = "Tech"
    Owner      = "Marcus Saw"
    Project    = "Zunou"
  }
}
