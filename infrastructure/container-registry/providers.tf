terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0.0"
    }
  }

  required_version = ">= 1.0"

  # backend "remote" {
  #   organization = "zunou"
  #
  #   workspaces {
  #     name = "ai-container-registry"
  #   }
  # }
}

# Configure the AWS Provider
provider "aws" {
  region = local.aws_region
}
