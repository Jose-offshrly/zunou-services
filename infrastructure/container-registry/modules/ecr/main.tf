locals {
  repositories = [
    aws_ecr_repository.admin.name,
    aws_ecr_repository.api.name,
    aws_ecr_repository.dashboard.name,
    aws_ecr_repository.kestra.name,
    aws_ecr_repository.onboarding.name,
    aws_ecr_repository.slack.name,
    "unstructured"
    # aws_ecr_repository.unstructured.name,
  ]
  ecr_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EKS Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::905418151499:root",
          "arn:aws:iam::975050367173:root",
          "arn:aws:iam::730335176420:root"
        ]
      },
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:DescribeImages",
        "ecr:DescribeRepositories",
        "ecr:GetAuthorizationToken",
        "ecr:GetDownloadUrlForLayer",
        "ecr:ListImages"
      ]
    }
  ]
}
EOF
}

resource "aws_ecr_repository_policy" "cross_account_permissions" {
  for_each   = toset(local.repositories)
  policy     = local.ecr_policy
  repository = each.key
}

resource "aws_ecr_repository" "admin" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "admin"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "api" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "api"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "dashboard" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "dashboard"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "kestra" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "kestra"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "meet-bot" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "meet-bot-api"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "onboarding" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "onboarding"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "slack" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "slack"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

// resource "aws_ecr_repository" "unstructured" {
//   image_tag_mutability = "IMMUTABLE"
//   name                 = "unstructured"
//   tags                 = var.tags
//
//   image_scanning_configuration {
//     scan_on_push = true
//   }
// }

resource "aws_ecr_repository" "uploader" {
  image_tag_mutability = "IMMUTABLE"
  name                 = "uploader"
  tags                 = var.tags

  image_scanning_configuration {
    scan_on_push = true
  }
}

