variable "prefix" {
  description = "The prefix used to name resources"
  type        = string
}

variable "tags" {
  description = "Standard tags to use for resources"
  type        = map(any)
}
