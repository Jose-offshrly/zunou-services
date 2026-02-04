output "repository_arns" {
  value = [
    aws_ecr_repository.admin.arn,
    aws_ecr_repository.api.arn,
    aws_ecr_repository.dashboard.arn,
    aws_ecr_repository.kestra.arn,
    aws_ecr_repository.onboarding.arn,
    aws_ecr_repository.slack.arn,
    aws_ecr_repository.uploader.arn,
    # aws_ecr_repository.unstructured.arn,
    "arn:aws:ecr:ap-northeast-1:322607082550:repository/unstructured",
  ]
  description = "The ARNs of our container repositories"
}
