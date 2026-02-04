terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0.0"
    }
  }

  required_version = ">= 1.0"

  // backend "remote" {
  //   organization = "zunou"
  //   workspaces {
  //     name = "environment-staging"
  //   }
  // }
}

// Configure the AWS Provider
provider "aws" {
  region = local.aws_region
}

// Provider for us-east-1 (required for CloudFront ACM certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
