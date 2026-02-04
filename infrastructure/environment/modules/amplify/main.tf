//-----------------------------------------------
//
// Organizations
//
//-----------------------------------------------

resource "aws_amplify_app" "organizations" {
  access_token = var.github_amplify_access_token
  name         = "Zunou Organizations (${var.environment})"
  repository   = "https://github.com/77brainz/zunou-services"

  build_spec = <<-EOT
    version: 0.1
    appRoot: services/admin
    frontend:
      phases:
        preBuild:
          commands:
            - yarn install
            - npm install -g bun
        build:
          commands:
            - make build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  # https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html#redirects-for-single-page-web-apps-spa
  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }

  environment_variables = {
    "_CUSTOM_IMAGE"       = "public.ecr.aws/docker/library/node:20"
    VITE_AUTH0_AUDIENCE   = var.auth0_audience
    VITE_AUTH0_CLIENT_ID  = var.auth0_client_id
    VITE_AUTH0_DOMAIN     = var.auth0_domain
    VITE_CORE_GRAPHQL_URL = var.core_graphql_url
    VITE_COMPANION_URL    = "https://${var.hostnames.Uploader}/companion"
  }
}

resource "aws_amplify_branch" "organizations" {
  app_id      = aws_amplify_app.organizations.id
  branch_name = local.branches[var.environment]
  framework   = "Vite"
  stage       = "PRODUCTION"
}

resource "aws_amplify_domain_association" "organizations" {
  app_id      = aws_amplify_app.organizations.id
  domain_name = var.hostnames.Organizations

  lifecycle {
    ignore_changes = [certificate_settings]
  }

  sub_domain {
    branch_name = aws_amplify_branch.organizations.branch_name
    prefix      = ""
  }
}

//-----------------------------------------------
//
// Dashboard
//
//-----------------------------------------------

resource "aws_amplify_app" "dashboard" {
  access_token = var.github_amplify_access_token
  name         = "Zunou Dashboard (${var.environment})"
  repository   = "https://github.com/77brainz/zunou-services"

  build_spec = <<-EOT
    version: 0.1
    appRoot: services/dashboard
    frontend:
      phases:
        preBuild:
          commands:
            - yarn install
            - npm install -g bun
        build:
          commands:
            - make build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  # https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html#redirects-for-single-page-web-apps-spa
  # Don't redirect anything with '/files/' in it - they're Zunou AI output file redirect paths, that should go
  # to the router.
  custom_rule {
    source = "</^(?:.*\\/files\\/.*|[^.]+$)|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }

  environment_variables = merge(
    {
      "_CUSTOM_IMAGE"       = "public.ecr.aws/docker/library/node:20"
      VITE_APP_URL          = "https://${var.hostnames.Dashboard}/"
      VITE_AUTH0_AUDIENCE   = var.auth0_audience
      VITE_AUTH0_CLIENT_ID  = var.auth0_client_id
      VITE_AUTH0_DOMAIN     = var.auth0_domain
      VITE_CORE_GRAPHQL_URL = var.core_graphql_url
      VITE_COMPANION_URL    = "https://${var.hostnames.Uploader}/companion"
      VITE_PUSHER_AUTH_ENDPOINT = var.pusher_auth_endpoint
      VITE_PUSHER_CLUSTER   = var.pusher_cluster
      VITE_PUSHER_KEY       = var.pusher_key
      VITE_DASHBOARD_MAC_ZIP = var.dashboard_mac_zip
      VITE_DASHBOARD_MAC_DMG = var.dashboard_mac_dmg
      VITE_DASHBOARD_WINDOWS = var.dashboard_windows
      VITE_SCOUT_MAC_ZIP = var.scout_mac_zip
      VITE_SCOUT_MAC_DMG = var.scout_mac_dmg
      VITE_SCOUT_WINDOWS = var.scout_windows
      VITE_SCOUT_WEB_APP = var.scout_web_app
    },
    var.environment == "staging" ? {
      VITE_FAVICON = "staging"
    } : {}
  )
}

resource "aws_amplify_branch" "dashboard" {
  app_id      = aws_amplify_app.dashboard.id
  branch_name = local.branches[var.environment]
  framework   = "Vite"
  stage       = "PRODUCTION"
}

resource "aws_amplify_domain_association" "dashboard" {
  app_id      = aws_amplify_app.dashboard.id
  domain_name = var.hostnames.Dashboard

  lifecycle {
    ignore_changes = [certificate_settings]
  }

  sub_domain {
    branch_name = aws_amplify_branch.dashboard.branch_name
    prefix      = ""
  }
}

//-----------------------------------------------
//
// Pulse
//
//-----------------------------------------------

resource "aws_amplify_app" "pulse" {
  access_token = var.github_amplify_access_token
  name         = "Pulse (${var.environment})"
  repository   = "https://github.com/77brainz/zunou-services"

  build_spec = <<-EOT
    version: 0.1
    appRoot: services/pulse
    frontend:
      phases:
        preBuild:
          commands:
            - yarn install
            - npm install -g bun
        build:
          commands:
            - make build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  # https://docs.aws.amazon.com/amplify/latest/userguide/redirects.html#redirects-for-single-page-web-apps-spa
  # Don't redirect anything with '/files/' in it - they're Zunou AI output file redirect paths, that should go
  # to the router.
  custom_rule {
    source = "</^(?:.*\\/files\\/.*|[^.]+$)|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }

  environment_variables = {
    "_CUSTOM_IMAGE"       = "public.ecr.aws/docker/library/node:20"
    VITE_AUTH0_AUDIENCE   = var.auth0_audience
    VITE_AUTH0_CLIENT_ID  = var.auth0_client_id
    VITE_AUTH0_DOMAIN     = var.auth0_domain
    VITE_CORE_GRAPHQL_URL = var.core_graphql_url
    VITE_COMPANION_URL    = "https://${var.hostnames.Uploader}/companion"
    VITE_LAUNCH_DARKLY_CLIENT_ID = var.launch_darkly_client_id
    VITE_PUSHER_AUTH_ENDPOINT = var.pusher_auth_endpoint
    VITE_PUSHER_CLUSTER   = var.pusher_cluster
    VITE_PUSHER_KEY       = var.pusher_key
    
  }
}

resource "aws_amplify_branch" "pulse" {
  app_id      = aws_amplify_app.pulse.id
  branch_name = local.branches[var.environment]
  framework   = "Vite"
  stage       = "PRODUCTION"
}

resource "aws_amplify_domain_association" "pulse" {
  app_id      = aws_amplify_app.pulse.id
  domain_name = var.hostnames.Pulse

  lifecycle {
    ignore_changes = [certificate_settings]
  }

  sub_domain {
    branch_name = aws_amplify_branch.pulse.branch_name
    prefix      = ""
  }
}
