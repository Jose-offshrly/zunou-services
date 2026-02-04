locals {
  branches = {
    development = "main"
    production = "production"
    staging = "staging"
  }
}

variable "auth0_audience" {
  description = "The audience of the Auth0 application"
  type        = string
}

variable "auth0_domain" {
  description = "The domain used to sign into Auth0"
  type        = string
}

variable "auth0_client_id" {
  description = "The client ID of the Auth0 application"
  type        = string
}

variable "core_graphql_url" {
  description = "The URL of the Zonou GraphQL server"
  type        = string
}

variable "environment" {
  description = "The application environment"
  type        = string
}

variable "github_amplify_access_token" {
  description = "A token used by AWS Amplify to access Github"
  type        = string
}

variable "hostnames" {
  description = "The hostnames that are served"
  type        = map(any)
}

variable "launch_darkly_client_id" {
  description = "Launch Darkly client ID"
  type        = string
}

variable "pusher_auth_endpoint" {
  description = "Pusher auth endpoint"
  type        = string
}

variable "pusher_cluster" {
  description = "Pusher cluster"
  type        = string
}

variable "pusher_key" {
  description = "Pusher key"
  sensitive   = true
  type        = string
}

variable "dashboard_mac_zip" {
  description = "The URL for downloading the Dashboard Electron macOS installer (ZIP format)"
  type        = string
}

variable "dashboard_mac_dmg" {
  description = "The URL for downloading the Dashboard Electron macOS installer (DMG format)"
  type        = string
}

variable "dashboard_windows" {
  description = "The URL for downloading the Dashboard Electron Windows installer"
  type        = string
}

variable "scout_mac_zip" {
  description = "The URL for downloading the Scout Electron macOS installer (ZIP format)"
  type        = string
}

variable "scout_mac_dmg" {
  description = "The URL for downloading the Scout Electron macOS installer (DMG format)"
  type        = string
}

variable "scout_windows" {
  description = "The URL for downloading the Scout Electron Windows installer"
  type        = string
}

variable "scout_web_app" {
  description = "The URL for accessing the Scout Web App"
  type        = string
}