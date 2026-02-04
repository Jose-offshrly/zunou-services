resource "auth0_tenant" "zunou" {
  allowed_logout_urls     = ["https://dashboard.zunou.ai/", "https://organizations.zunou.ai/", "https://pulse.zunou.ai/"]
  default_redirection_uri = "https://dashboard.zunou.ai/"
  enabled_locales         = ["en"]
  friendly_name           = "Zunou"
  picture_url             = local.logo_url
  support_email           = var.support_email
  support_url             = local.support_url

  # change_password {
  #   enabled = true
  # }

  # guardian_mfa_page {
  #   enabled = true
  # }

  flags {
    enable_client_connections = false
  }

  session_cookie {
    mode = "persistent"
  }
}

resource "auth0_prompt" "zunou" {
  universal_login_experience = "new"
}

resource "auth0_client" "primary" {
  allowed_logout_urls = local.auth0_origins
  allowed_origins     = local.auth0_origins
  app_type            = "spa"
  callbacks           = local.auth0_origins
  description         = "Sign into the Zunou application"
  grant_types         = local.auth0_grant_types
  initiate_login_uri  = "https://${var.hostnames.Dashboard}/"
  logo_uri            = local.logo_url
  name                = var.environment == "production" ? "Zunou" : "Zunou (${var.environment})"
  oidc_conformant     = true
  web_origins         = local.auth0_origins

  jwt_configuration {
    alg = local.auth0_algorithm
  }

  lifecycle {
    ignore_changes = [cross_origin_auth]
  }

  refresh_token {
    infinite_idle_token_lifetime = false
    infinite_token_lifetime      = false
    leeway                       = 0
    token_lifetime               = 2592000
    rotation_type                = "rotating"
    expiration_type              = "expiring"
  }
}

resource "auth0_client" "m2m" {
  app_type    = "non_interactive"
  description = "Zunou Machine-to-Machine"
  logo_uri    = local.logo_url
  name        = "Zunou M2M (${var.environment})"

  jwt_configuration {
    alg = local.auth0_algorithm
  }

  lifecycle {
    ignore_changes = [cross_origin_auth]
  }
}

resource "auth0_client" "auth0_actions" {
  app_type    = "non_interactive"
  description = "Zunou Auth0 Actions"
  logo_uri    = local.logo_url
  name        = "Zunou Auth0 Actions (${var.environment})"

  jwt_configuration {
    alg = local.auth0_algorithm
  }

  lifecycle {
    ignore_changes = [cross_origin_auth]
  }
}

resource "auth0_branding" "zunou" {
  favicon_url = local.favicon_url
  logo_url    = local.logo_url

  colors {
    primary         = local.primary_color
    page_background = local.secondary_color
  }
}

# Grant the M2M client access to Auth0 Management API with needed scopes
resource "auth0_client_grant" "m2m_management_api" {
  client_id = auth0_client.m2m.id
  audience  = "https://${var.auth0_domain}/api/v2/"

  scopes = [
    "read:users",
    "update:users",
    "read:user_idp_tokens",
    "create:role_members",
    "read:role_members",
    "delete:role_members",
    "read:roles",
  ]
}

resource "auth0_resource_server" "api" {
  allow_offline_access                            = true // Needed to enable refresh tokens.
  enforce_policies                                = true // Enable RBAC
  identifier                                      = "https://api.${var.origin_domain}/"
  name                                            = "Zunou API (${var.environment})"
  signing_alg                                     = local.auth0_algorithm
  skip_consent_for_verifiable_first_party_clients = true
  token_dialect                                   = "access_token_authz" // Add permissions to the token.
  token_lifetime                                  = local.auth0_token_lifetime
  token_lifetime_for_web                          = local.auth0_token_lifetime
}

resource "auth0_resource_server_scopes" "api" {
  resource_server_identifier = auth0_resource_server.api.identifier

  scopes {
    name        = "admin:agents"
    description = "Admin agents"
  }

  scopes {
    name        = "create:agents"
    description = "Create agents"
  }

  scopes {
    name        = "delete:agents"
    description = "Delete agents"
  }

  scopes {
    name        = "read:agents"
    description = "Read agents"
  }

  scopes {
    name        = "read:activities"
    description = "Read Activities"
  }

  scopes {
    name        = "update:agents"
    description = "Update agents"
  }

  scopes {
    name        = "create:ai-agents"
    description = "Create AI agents"
  }

  scopes {
    name        = "read:ai-agents"
    description = "Read AI agents"
  }

  scopes {
    name        = "update:ai-agents"
    description = "Update AI agents"
  }

  scopes {
    name        = "delete:ai-agents"
    description = "Delete AI agents"
  }

  scopes {
    name        = "admin:data-sources"
    description = "Admin data sources"
  }

  scopes {
    name        = "create:data-sources"
    description = "Create data sources"
  }

  scopes {
    name        = "delete:data-sources"
    description = "Delete data sources"
  }

  scopes {
    name        = "read:data-sources"
    description = "Read data sources"
  }

  scopes {
    name        = "update:data-sources"
    description = "Update data sources"
  }

  scopes {
    name        = "create:liveUploads"
    description = "Create live uploads"
  }

  scopes {
    name        = "delete:liveUploads"
    description = "Delete live uploads"
  }

  scopes {
    name        = "read:liveUploads"
    description = "Read live uploads"
  }

  scopes {
    name        = "update:liveUploads"
    description = "Update live uploads"
  }

  scopes {
    name        = "create:misalignmentAlerts"
    description = "Create misalignment alerts"
  }

  scopes {
    name        = "delete:misalignmentAlerts"
    description = "Delete misalignment alerts"
  }

  scopes {
    name        = "read:misalignmentAlerts"
    description = "Read misalignment alerts"
  }

  scopes {
    name        = "update:misalignmentAlerts"
    description = "Update misalignment alerts"
  }

  scopes {
    name        = "create:monthlyQuestions"
    description = "Create monthly questions"
  }

  scopes {
    name        = "delete:monthlyQuestions"
    description = "Delete monthly questions"
  }

  scopes {
    name        = "read:monthlyQuestions"
    description = "Read monthly questions"
  }

  scopes {
    name        = "update:monthlyQuestions"
    description = "Update monthly questions"
  }


  scopes {
    name        = "create:monthlySummary"
    description = "Create monthly summaries"
  }

  scopes {
    name        = "delete:monthlySummary"
    description = "Delete monthly summaries"
  }

  scopes {
    name        = "read:monthlySummary"
    description = "Read monthly summaries"
  }

  scopes {
    name        = "update:monthlySummary"
    description = "Update monthly summaries"
  }

  scopes {
    name        = "create:monthlyTimeSaved"
    description = "Create monthly time saved"
  }

  scopes {
    name        = "delete:monthlyTimeSaved"
    description = "Delete monthly time saved"
  }

  scopes {
    name        = "read:monthlyTimeSaved"
    description = "Read monthly time saved"
  }

  scopes {
    name        = "update:monthlyTimeSaved"
    description = "Update monthly time saved"
  }

  scopes {
    name        = "create:monthlyTrendingTopics"
    description = "Create monthly trending topics"
  }

  scopes {
    name        = "delete:monthlyTrendingTopics"
    description = "Delete monthly trending topics"
  }

  scopes {
    name        = "read:monthlyTrendingTopics"
    description = "Read monthly trending topics"
  }

  scopes {
    name        = "update:monthlyTrendingTopics"
    description = "Update monthly trending topics"
  }

  scopes {
    name        = "admin:organizations"
    description = "Admin organizations"
  }

  scopes {
    name        = "create:organizations"
    description = "Create organizations"
  }

  scopes {
    name        = "delete:organizations"
    description = "Delete organizations"
  }

  scopes {
    name        = "manage:organizations"
    description = "Manage organizations"
  }

  scopes {
    name        = "read:organizations"
    description = "Read organizations"
  }

  scopes {
    name        = "update:organizations"
    description = "Update organizations"
  }

  scopes {
    name        = "admin:pulses"
    description = "Admin pulses"
  }

  scopes {
    name        = "create:pulses"
    description = "Create pulses"
  }

  scopes {
    name        = "delete:pulses"
    description = "Delete pulses"
  }

  scopes {
    name        = "manage:pulses"
    description = "Manage pulses"
  }

  scopes {
    name        = "read:pulses"
    description = "Read pulses"
  }

  scopes {
    name        = "update:pulses"
    description = "Update pulses"
  }

  scopes {
    name        = "read:slack-credentials"
    description = "Read Slack credentials"
  }

  scopes {
    name        = "admin:threads"
    description = "Admin threads"
  }

  scopes {
    name        = "create:threads"
    description = "Create threads"
  }

  scopes {
    name        = "delete:threads"
    description = "Delete threads"
  }

  scopes {
    name        = "read:threads"
    description = "Read threads"
  }

  scopes {
    name        = "update:threads"
    description = "Update threads"
  }

  scopes {
    name        = "admin:users"
    description = "Admin users"
  }

  scopes {
    name        = "create:users"
    description = "Create users"
  }

  scopes {
    name        = "delete:users"
    description = "Delete users"
  }

  scopes {
    name        = "read:users"
    description = "Read users"
  }

  scopes {
    name        = "update:users"
    description = "Update users"
  }

  scopes {
    name        = "create:zunou-ai-jobs"
    description = "Create Zunou AI Jobs"
  }

  scopes {
    name        = "read:strategies"
    description = "Read strategies"
  }

  scopes {
    name        = "create:strategies"
    description = "Create strategies"
  }

  scopes {
    name        = "update:strategies"
    description = "Update strategies"
  }

  scopes {
    name        = "delete:strategies"
    description = "Delete strategies"
  }

  scopes {
    name        = "admin:timesheets"
    description = "Admin timesheets"
  }

  scopes {
    name        = "read:timesheets"
    description = "Read timesheets"
  }

  scopes {
    name        = "create:timesheets"
    description = "Create timesheets"
  }

  scopes {
    name        = "update:timesheets"
    description = "Update timesheets"
  }

  scopes {
    name        = "read:transcripts"
    description = "Read Transcripts"
  }

  scopes {
    name        = "read:notifications"
    description = "Read notifications"
  }

  scopes {
    name        = "update:notifications"
    description = "Update notifications"
  }

  scopes {
    name        = "create:notification-preferences"
    description = "Create notification preferences"
  }

  scopes {
    name        = "read:notification-preferences"
    description = "Read notification preferences"
  }

  scopes {
    name        = "update:notification-preferences"
    description = "Update notification preferences"
  }

  scopes {
    name        = "delete:notification-preferences"
    description = "Delete notification preferences"
  }

  scopes {
    name        = "read:saved-messages"
    description = "Read Saved Messages"
  }

  scopes {
    name        = "create:saved-messages"
    description = "Create Saved Messages"
  }

  scopes {
    name        = "delete:saved-messages"
    description = "Delete Saved Messages"
  }

  scopes {
    name        = "create:attachments"
    description = "Create Attachments"
  }

  scopes {
    name        = "update:attachments"
    description = "Update Attachments"
  }

  scopes {
    name        = "read:attachments"
    description = "Read Attachments"
  }

  scopes {
    name        = "read:integrations"
    description = "Read Integrations"
  }

  scopes {
    name        = "create:integrations"
    description = "Create Integrations"
  }

  scopes {
    name        = "delete:integrations"
    description = "Delete Integrations"
  }

  scopes {
    name        = "read:meetings"
    description = "Read Meetings"
  }

  scopes {
    name        = "create:meetings"
    description = "Create Meetings"
  }
  
  scopes {
    name        = "update:meetings"
    description = "Update Meetings"
  }

  scopes {
    name        = "create:messages"
    description = "Create Messages"
  }

  scopes {
    name        = "update:messages"
    description = "Update Messages"
  }

  scopes {
    name        = "read:summaries"
    description = "Read summaries"
  }

  scopes {
    name        = "update:summaries"
    description = "Update summaries"
  }

  scopes {
    name        = "read:feeds"
    description = "Read feeds"
  }

  scopes {
    name        = "create:hiatuses"
    description = "Create Hiatuses"
  }

  scopes {
    name        = "read:hiatuses"
    description = "Read Hiatuses"
  }
  
  scopes {
    name        = "update:hiatuses"
    description = "Update Hiatuses"
  }

  scopes {
    name        = "update:pulse-member"
    description = "Update PulseMember"
  }

  scopes {
    name        = "delete:pulse-member"
    description = "Delete PulseMember"
  }
  
  scopes {
    name        = "read:settings"
    description = "Read settings"
  }

  scopes {
    name        = "create:settings"
    description = "Create Settings"
  }

  scopes {
    name        = "update:settings"
    description = "Update Settings"
  }

  scopes {
    name        = "create:team-threads"
    description = "Create Team Threads"
  }

  scopes {
    name        = "create:team-messages"
    description = "Create Team Messages"
  }

  scopes {
    name        = "read:team-messages"
    description = "Read Team Messages"
  }

  scopes {
    name        = "update:team-messages"
    description = "Update Team Messages"
  }

  scopes {
    name        = "delete:team-messages"
    description = "Delete Team Messages"
  }

  scopes {
    name        = "create:reply-team-threads"
    description = "Create Reply Team Threads"
  }

  scopes {
    name        = "read:reply-team-threads"
    description = "Read Reply Team Threads"
  }

  scopes {
    name        = "update:reply-team-threads"
    description = "Update Reply Team Threads"
  }

  scopes {
    name        = "delete:reply-team-threads"
    description = "Delete Reply Team Threads"
  }

  scopes {
    name        = "create:collaborations"
    description = "Create Collaborations"
  }

  scopes {
    name        = "read:collaborations"
    description = "Read Collaborations"
  }
  
  scopes {
    name        = "update:collaborations"
    description = "Update Collaborations"
  }

  scopes {
    name        = "delete:collaborations"
    description = "Delete Collaborations"
  }

  scopes {
    name        = "create:widgets"
    description = "Create Widgets"
  }

  scopes {
    name        = "read:widgets"
    description = "Read Widgets"
  }
  
  scopes {
    name        = "update:widgets"
    description = "Update Widgets"
  }

  scopes {
    name        = "delete:widgets"
    description = "Delete Widgets"
  }

  scopes {
    name        = "create:contacts"
    description = "Create Contacts"
  }

  scopes {
    name        = "read:contacts"
    description = "Read Contacts"
  }

  scopes {
    name        = "update:contacts"
    description = "Update Contacts"
  }

  scopes {
    name        = "delete:contacts"
    description = "Delete Contacts"
  }

  scopes {
    name        = "create:meeting-sessions"
    description = "Create Meeting Sessions"
  }

  scopes {
    name        = "read:meeting-sessions"
    description = "Read Meeting Sessions"
  }
  
  scopes {
    name        = "update:meeting-sessions"
    description = "Update Meeting Sessions"
  }

  scopes {
    name        = "delete:meeting-sessions"
    description = "Delete Meeting Sessions"
  }

  scopes {
    name        = "read:direct-messages"
    description = "Read Direct Messages"
  }

  scopes {
    name        = "create:direct-messages"
    description = "Create Direct Messages"
  }

  scopes {
    name        = "update:direct-messages"
    description = "Update Direct Messages"
  }

  scopes {
    name        = "delete:direct-messages"
    description = "Delete Direct Messages"
  }

  scopes {
    name        = "create:tasks"
    description = "Create Tasks"
  }

  scopes {
    name        = "read:tasks"
    description = "Read Tasks"
  }

  scopes {
    name        = "update:tasks"
    description = "Update Tasks"
  }

  scopes {
    name        = "delete:tasks"
    description = "Delete Tasks"
  }

  scopes {
    name        = "create:task-phases"
    description = "Create Task Phases"
  }

  scopes {
    name        = "read:task-phases"
    description = "Read Task Phases"
  }

  scopes {
    name        = "update:task-phases"
    description = "Update Task Phases"
  }

  scopes {
    name        = "delete:task-phases"
    description = "Delete Task Phases"
  }

  scopes {
    name        = "create:task-statuses"
    description = "Create Task Statuses"
  }

  scopes {
    name        = "read:task-statuses"
    description = "Read Task Statuses"
  }

  scopes {
    name        = "update:task-statuses"
    description = "Update Task Statuses"
  }

  scopes {
    name        = "delete:task-statuses"
    description = "Delete Task Statuses"
  }

  scopes {
    name        = "create:backgrounds"
    description = "Create backgrounds"
  }

  scopes {
    name        = "read:backgrounds"
    description = "Read backgrounds"
  }

  scopes {
    name        = "update:backgrounds"
    description = "Update backgrounds"
  }

  scopes {
    name        = "delete:backgrounds"
    description = "Delete backgrounds"
  }

  scopes {
    name        = "create:organization-groups"
    description = "Create Organization Groups"
  }

  scopes {
    name        = "read:organization-groups"
    description = "Read Organization Groups"
  }

  scopes {
    name        = "update:organization-groups"
    description = "Update Organization Groups"
  }

  scopes {
    name        = "delete:organization-groups"
    description = "Delete Organization Groups"
  }

  scopes {
    name        = "read:notes"
    description = "Read notes"
  }

  scopes {
    name        = "create:notes"
    description = "Create notes"
  }

  scopes {
    name        = "update:notes"
    description = "Update notes"
  }

  scopes {
    name        = "delete:notes"
    description = "Delete notes"
  }

  scopes {
    name        = "create:labels"
    description = "Create labels"
  }

  scopes {
    name        = "read:labels"
    description = "Read labels"
  }

  scopes {
    name        = "update:labels"
    description = "Update labels"
  }

  scopes {
    name        = "delete:labels"
    description = "Delete labels"
  }

  scopes {
    name        = "create:agendas"
    description = "Create agendas"
  }

  scopes {
    name        = "read:agendas"
    description = "Read agendas"
  }

  scopes {
    name        = "update:agendas"
    description = "Update agendas"
  }

  scopes {
    name        = "delete:agendas"
    description = "Delete agendas"
  }

  scopes {
    name        = "create:checklists"
    description = "Create checklists"
  }

  scopes {
    name        = "read:checklists"
    description = "Read checklists"
  }

  scopes {
    name        = "update:checklists"
    description = "Update checklists"
  }

  scopes {
    name        = "delete:checklists"
    description = "Delete checklists"
  }

  scopes {
    name        = "create:events"
    description = "Create events"
  }

  scopes {
    name        = "read:events"
    description = "Read events"
  }

  scopes {
    name        = "update:events"
    description = "Update events"
  }

  scopes {
    name        = "delete:events"
    description = "Delete events"
  }

  scopes {
    name        = "create:event-instances"
    description = "Create event instances"
  }

  scopes {
    name        = "read:event-instances"
    description = "Read event instances"
  }

  scopes {
    name        = "update:event-instances"
    description = "Update event instances"
  }

  scopes {
    name        = "delete:event-instances"
    description = "Delete event instances"
  }

  scopes {
    name        = "create:actionables"
    description = "Create actionables"
  }

  scopes {
    name        = "read:actionables"
    description = "Read actionables"
  }

  scopes {
    name        = "update:actionables"
    description = "Update actionables"
  }

  scopes {
    name        = "delete:actionables"
    description = "Delete actionables"
  }

  scopes {
    name        = "admin:actionables"
    description = "Admin actionables"
  }

  scopes {
    name        = "read:insights"
    description = "Read live insights"
  }

  scopes {
    name        = "update:insights"
    description = "Update live insights (seen/closed)"
  }

  scopes {
    name        = "create:topics"
    description = "Create Topics"
  }
  
  scopes {
    name        = "read:topics"
    description = "Read Topics"
  }

  scopes {
    name        = "update:topics"
    description = "Update Topics"
  }
  
  scopes {
    name        = "delete:topics"
    description = "Delete Topics"
  }

  scopes {
    name        = "create:audio-recordings"
    description = "Create Audio Recordings"
  }
 
  scopes {
    name        = "read:audio-recordings"
    description = "Read Audio Recordings"
  }
 
  scopes {
    name        = "update:audio-recordings"
    description = "Update Audio Recordings"
  }
 
  scopes {
    name        = "delete:audio-recordings"
    description = "Delete Audio Recordings"
  }
}

resource "auth0_client_grant" "m2m" {
  client_id = auth0_client.m2m.id
  audience  = auth0_resource_server.api.identifier
  scopes    = ["admin:users", "create:zunou-ai-jobs", "read:organizations", "read:slack-credentials", "read:users", "update:users"]
}

resource "auth0_client_grant" "auth0_actions" {
  client_id = auth0_client.auth0_actions.id
  audience  = "https://${var.auth0_domain}/api/v2/"
  scopes    = ["create:role_members", "read:role_members", "read:users", "update:users", "read:roles"]
}

resource "auth0_email_provider" "aws_ses_email_provider" {
  name                 = "ses"
  enabled              = true
  default_from_address = var.auth0_email

  credentials {
    access_key_id     = var.aws_ses_access_key_id
    secret_access_key = var.aws_ses_secret_access_key
    region            = var.aws_region
  }
}
resource "auth0_role" "guest" {
  name        = "Guest ${var.environment}"
  description = "Guests of Zunou, with the lowest set of permissions."
}

resource "auth0_role_permissions" "guest" {
  depends_on = [auth0_role.guest]
  role_id    = auth0_role.guest.id

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:users"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:activities"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:data-sources"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:threads"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:pulses"
  }


  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:users"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notifications"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notifications"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:attachments"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:meetings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:summaries"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:contacts"
  }
    
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:tasks"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:transcripts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "read:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "create:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "update:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "delete:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "read:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "delete:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:audio-recordings"
  }
}

resource "auth0_role" "user" {
  name        = "User ${var.environment}"
  description = "Users of Zunou, with the lowest set of permissions."
}

resource "auth0_role_permissions" "user" {
  depends_on = [auth0_role.user]
  role_id    = auth0_role.user.id

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:users"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "create:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "read:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "update:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "delete:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:pulses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:ai-agents"
  }


  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:activities"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:data-sources"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:pulses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:users"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:timesheets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:timesheets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:timesheets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:timesheets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:transcripts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notifications"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notifications"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:attachments"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:attachments"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:attachments"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:integrations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:integrations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:integrations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:meetings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:meetings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:meetings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:summaries"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:summaries"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:feeds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:hiatuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:hiatuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:hiatuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:pulse-member"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:pulse-member"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:settings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:settings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:settings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "read:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "create:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "update:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "delete:direct-messages"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:insights"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:insights"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:audio-recordings"
  }
}

resource "auth0_role" "manager" {
  name        = "Manager ${var.environment}"
  description = "Managers of Zunou organizations, able to invite and remove users."
}

resource "auth0_role_permissions" "manager" {
  depends_on = [auth0_role.manager]
  role_id    = auth0_role.manager.id

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:ai-agents"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:attachments"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:attachments"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:attachments"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:activities"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "create:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "read:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "update:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "delete:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:data-sources"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:data-sources"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:data-sources"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:data-sources"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:hiatuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:hiatuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:hiatuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:insights"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:insights"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:integrations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:integrations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:integrations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:meetings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:meetings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:meetings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:misalignmentAlerts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:misalignmentAlerts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:monthlyQuestions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:monthlySummary"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:monthlyTimeSaved"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:monthlyTrendingTopics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:messages"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notifications"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notifications"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "manage:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:pulses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:pulses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:pulses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:pulses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:saved-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:strategies"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:strategies"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:strategies"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:strategies"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:summaries"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:summaries"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:timesheets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:transcripts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:timesheets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:users"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:users"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:users"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:users"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:pulse-member"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:pulse-member"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:settings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:settings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:settings"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:team-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:reply-team-threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:collaborations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:widgets"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "read:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "create:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "update:direct-messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "delete:direct-messages"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:tasks"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:organization-groups"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:event-instances"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:audio-recordings"
  }
}

resource "auth0_role" "admin" {
  name        = "Admin ${var.environment}"
  description = "Admins of Zunou, with the highest set of permissions."
}

resource "auth0_role_permissions" "admin" {
  depends_on = [auth0_role.admin]
  role_id    = auth0_role.admin.id

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:ai-agents"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:activities"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:data-sources"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:pulses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "create:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "read:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "update:backgrounds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                      = "delete:backgrounds"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:organizations"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:threads"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:users"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notification-preferences"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notification-preferences"
  }
  
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:feeds"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:notes"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:labels"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:agendas"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:checklists"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:events"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:messages"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:contacts"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:meeting-sessions"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "admin:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:actionables"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:topics"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-phases"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:task-statuses"
  }

  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "create:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "read:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "update:audio-recordings"
  }
 
  permissions {
    resource_server_identifier = auth0_resource_server.api.identifier
    name                       = "delete:audio-recordings"
  }
}

resource "auth0_action" "enrich_access_token" {
  name    = "Enrich Access Token ${var.environment}"
  runtime = "node18"
  deploy  = true
  code    = <<-EOT
exports.onExecutePostLogin = async (event, api) => {
  api.accessToken.setCustomClaim('email', event.user.email)
  api.accessToken.setCustomClaim('name', event.user.name)
  api.idToken.setCustomClaim('email', event.user.email)
  api.idToken.setCustomClaim('name', event.user.name)
};
  EOT

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
}

resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.enrich_access_token.id
    display_name = auth0_action.enrich_access_token.name
  }
}
