# -----------------------------------------------
# ECR Publisher
# -----------------------------------------------

resource "aws_iam_user" "ecr_publisher" {
  name = "${var.prefix}-ecr-publisher"
  tags = var.tags
}

resource "aws_iam_policy" "ecr_publisher" {
  description = "A policy defining permissions needed to push images to ECR and deploy Lambda functions"
  name        = "${var.prefix}-ecr-publisher"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
        ]
        Effect   = "Allow"
        Resource = var.ecr_repository_arns
      },
      {
        Action = [
          "ecr:GetAuthorizationToken",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
      {
        Action = [
          "s3:ListBucket",
        ]
        Effect   = "Allow"
        Resource = "arn:aws:s3:::pulse-lambda-code"
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
        ]
        Effect   = "Allow"
        Resource = "arn:aws:s3:::pulse-lambda-code/*"
      },
      {
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
        ]
        Effect   = "Allow"
        Resource = [
          "arn:aws:lambda:*:*:function:scout-ai-proxy-*",
          "arn:aws:lambda:*:*:function:error-log-watcher-*"
        ]
      },
    ]
  })
}

resource "aws_iam_user_policy_attachment" "ecr_publisher" {
  user       = aws_iam_user.ecr_publisher.name
  policy_arn = aws_iam_policy.ecr_publisher.arn
}
