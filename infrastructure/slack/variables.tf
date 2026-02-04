locals {
  app_ids = {
    dave        = "A06GX1QRXL7"
    development = "A06JK33BBPT"
    marcus      = "A06HBERT2HZ"
    production  = "A06GRHXH9PS"
    staging     = "A06GRG1H916"
  }

  bot_names = {
    dave        = "zunou-dave"
    development = "zunou-development"
    marcus      = "zunou-marcus"
    production  = "zunou"
    staging     = "zunou-staging"
  }

  redirect_urls = {
    dave        = "https://localhost:5173/settings/slack/auth"
    development = "https://localhost:5173/settings/slack/auth"
    marcus      = "https://localhost:5173/settings/slack/auth"
    production  = "https://dashboard.zunou.ai/settings/slack/auth"
    staging     = "https://dashboard.staging.zunou.ai/settings/slack/auth"
  }

  slash_commands = {
    dave        = "/zunou-dave"
    development = "/zunou-development"
    marcus      = "/zunou-marcus"
    production  = "/zunou"
    staging     = "/zunou-staging"
  }

  template = templatefile(
    "templates/app_manifest.json.tftpl",
    {
      app_id        = local.app_ids[var.environment]
      app_name      = "Zunou Bot (${var.environment})"
      bot_name      = local.bot_names[var.environment]
      description   = "Zunou Bot"
      redirect_urls = local.redirect_urls[var.environment]
      slash_commands = [
        {
          command     = local.slash_commands[var.environment]
          description = "Run zunou commands"
          usage_hint  = "help"
          // url         = "https://perrett.ngrok.io"
        },
      ]
    }
  )
}

// Generate this at https://api.slack.com/reference/manifests#config-tokens
variable "access_token" {
  type      = string
  sensitive = true
}

variable "environment" {
  description = "The application environment"
  type        = string
}
