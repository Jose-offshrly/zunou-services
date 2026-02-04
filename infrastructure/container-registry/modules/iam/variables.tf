variable "ecr_repository_arns" {
  description = "The ARNs of our container repositories"
  type        = list(string)
}

variable "prefix" {
  description = "The prefix used to name resources"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
