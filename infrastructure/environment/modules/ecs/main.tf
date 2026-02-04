resource "aws_ecs_cluster" "primary" {
  name = "primary-${var.environment}"
  tags = var.tags

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging    = var.environment == "development" ? "NONE" : "OVERRIDE"

      dynamic "log_configuration" {
        for_each = var.environment == "development" ? [] : [1]
        content {
          cloud_watch_log_group_name     = var.slack_log_group_name
        }
      }
    }
  }
}



//-----------------------------------------------------------------------------
//
// Calendar-service
//
//-----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "calendar-service" {
  cpu                      = local.calendar-service_instance_cpu
  execution_role_arn       = var.ecs_tasks_role_arn
  family                   = "calendar-service-${var.environment}"
  memory                   = local.calendar-service_instance_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = merge(
    var.tags,
    {
      Service = "CalendarService"
    }
  )
  task_role_arn            = var.ecs_tasks_role_arn

  container_definitions = <<TASK_DEFINITION
[
  {
    "cpu":         ${local.calendar-service_instance_cpu},
    "environment": [
      {"name": "AUTH0_DOMAIN",                  "value": "${var.auth0_domain}"},
      {"name": "AUTH0_CLIENT_ID",               "value": "${var.auth0_m2m_client_id}"},
      {"name": "AUTH0_CLIENT_SECRET",           "value": "${var.auth0_m2m_client_secret}"},
      {"name": "AUTH0_AUDIENCE",                "value": "${var.auth0_audience}"},
      {"name": "AWS_REGION",                    "value": "${data.aws_region.current.name}"},
      {"name": "CORE_GRAPHQL_URL",            "value": "${var.core_graphql_url}"},
      {"name": "DYNAMODB_TABLE",                "value": "meet-bot-${var.environment}"},
      {"name": "ENVIRONMENT",                   "value": "${var.environment}"},
      {"name": "PORT",                          "value": "80"},
      {"name": "SCHEDULER_URL",                 "value": "https://${var.scheduler-service_hostname}/webhook/calendar"},
      {"name": "SECRET_NAME",                   "value": "GoogleServiceAccountKey"},
      {"name": "SERVICE_ACCOUNT_EMAIL",         "value": "pulse-bot@zunou-416222.iam.gserviceaccount.com"},
      {
        "name": "USER_EMAIL",
        "value": "${lookup(local.user_email_map, var.environment, "default-user@zunou.ai")}"
      },
      {"name": "WEBHOOK_URL",                   "value": "https://${var.calendar-service_hostname}/notifications"}
    ],
    "essential":   true,
    "healthCheck": {
      "command": [
        "CMD-SHELL",
        "curl -f http://127.0.0.1:80/ || exit 1"
      ],
      "startPeriod": 60,
      "interval": 30,
      "timeout": 10,
      "retries": 5
    },
    "image":       "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/calendar-service:${local.calendar-service_version}",
    "logConfiguration": {
      "logDriver": "awslogs",
      "options":   {
        "awslogs-group":         "${var.calendar-service_log_group_name}",
        "awslogs-region":        "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "memory":      ${local.calendar-service_instance_memory},
    "name":        "calendar-service-${var.environment}",
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort":      80
      }
    ]
  }
]
TASK_DEFINITION
}

resource "aws_ecs_service" "calendar-service" {
  cluster                           = aws_ecs_cluster.primary.id
  desired_count                     = local.calendar-service_instance_count
  enable_execute_command            = true
  health_check_grace_period_seconds = 90
  launch_type                       = "FARGATE"
  name                              = "calendar-service-${var.environment}"
  tags = merge(
    var.tags,
    {
      Service = "CalendarService"
    }
  )
  task_definition                   = aws_ecs_task_definition.calendar-service.arn

  lifecycle {
    ignore_changes = []
  }

  load_balancer {
    target_group_arn = var.load_balancer_calendar-service_target_group_arn
    container_name   = "calendar-service-${var.environment}"
    container_port   = 80
  }

  network_configuration {
    assign_public_ip = true
    security_groups  = [var.ecs_default_security_group_id]
    subnets          = var.private_subnet_ids
  }
}

//-----------------------------------------------------------------------------
//
// kestra
//
//-----------------------------------------------------------------------------
locals {
  kestra_configuration = replace(
    templatefile("${path.module}/templates/kestra.yaml.tftpl", {
      aws_access_key_id     = var.kestra_aws_access_key_id
      aws_region            = var.aws_region
      aws_secret_access_key = var.kestra_aws_secret_access_key
      kestra_password       = local.kestra_basic_auth_password
      s3_bucket_name        = var.kestra_s3_bucket_name
      kestra_username       = local.kestra_basic_auth_username
      postgres_password     = var.kestra_database_password
      postgres_url          = var.kestra_database_url
    }),
    "\n",
    "\\n"
  )
}

resource "aws_ecs_task_definition" "kestra" {
  cpu                      = local.kestra_instance_cpu
  execution_role_arn       = var.ecs_tasks_role_arn
  family                   = "kestra-${var.environment}"
  memory                   = local.kestra_instance_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = merge(
    var.tags,
    {
      Service = "Kestra"
    }
  )
  task_role_arn            = var.ecs_tasks_role_arn

  container_definitions = <<TASK_DEFINITION
[
  {
    "command":     ["server", "standalone"],
    "cpu":         ${local.kestra_instance_cpu},
    "environment": [
      {"name": "KESTRA_CONFIGURATION",        "value": "${local.kestra_configuration}"},
      {"name": "KESTRA_EXAMPLE_VAR",          "value": "Dave 2024-12-10-0824"},
      {"name": "KESTRA_GITHUB_TOKEN",         "value": "${var.github_access_token}"},
      {"name": "KESTRA_OPENAI_API_KEY",       "value": "${var.openai_api_key}"},
      {"name": "KESTRA_POSTGRES_DB_DATABASE", "value": "${var.postgres_db_database}"},
      {"name": "KESTRA_POSTGRES_DB_HOST",     "value": "${var.postgres_db_host}"},
      {"name": "KESTRA_POSTGRES_DB_PASSWORD", "value": "${var.postgres_db_password}"},
      {"name": "KESTRA_POSTGRES_DB_PORT",     "value": "${var.postgres_db_port}"},
      {"name": "KESTRA_POSTGRES_DB_USERNAME", "value": "${var.postgres_db_username}"},
      {"name": "KESTRA_SLACK_WEBHOOK_KEY",    "value": "${var.kestra_slack_webhook_key}"}
    ],
    "essential":   true,
    "healthCheck": {
      "command": [
        "CMD-SHELL",
        "curl -f -u ${local.kestra_basic_auth_username}:${local.kestra_basic_auth_password} http://localhost/ || exit 1"
      ],
      "interval": 30,
      "timeout": 5,
      "retries": 3
    },
    "image":       "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/kestra:${local.kestra_version}",
    "logConfiguration": {
      "logDriver": "awslogs",
      "options":   {
        "awslogs-group":         "${var.kestra_log_group_name}",
        "awslogs-region":        "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "memory":      ${local.kestra_instance_memory},
    "name":        "kestra-${var.environment}",
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort":      80
      }
    ]
  }
]
TASK_DEFINITION
}

resource "aws_ecs_service" "kestra" {
  cluster                           = aws_ecs_cluster.primary.id
  desired_count                     = local.kestra_instance_count
  enable_execute_command            = true
  health_check_grace_period_seconds = 30
  launch_type                       = "FARGATE"
  name                              = "kestra-${var.environment}"
  tags = merge(
    var.tags,
    {
      Service = "Kestra"
    }
  )
  task_definition                   = aws_ecs_task_definition.kestra.arn

  lifecycle {
    ignore_changes = []
  }

  load_balancer {
    target_group_arn = var.load_balancer_kestra_target_group_arn
    container_name   = "kestra-${var.environment}"
    container_port   = 80
  }

  network_configuration {
    assign_public_ip = true
    security_groups  = [var.ecs_default_security_group_id]
    subnets          = var.private_subnet_ids
  }
}

//-----------------------------------------------------------------------------
//
// Meet-bot /
//
//-----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "meet-bot" {
  cpu                      = local.meet-bot_instance_cpu
  execution_role_arn       = var.ecs_tasks_role_arn
  family                   = "meet-bot-${var.environment}"
  memory                   = local.meet-bot_instance_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = merge(
    var.tags,
    {
      Service = "MeetBot"
    }
  )
  task_role_arn            = var.ecs_tasks_role_arn

  container_definitions = <<TASK_DEFINITION
[
  {
    "cpu":         ${local.meet-bot_instance_cpu},
    "environment": [
      {"name": "AMQP_URL",                             "value": "${var.mq_meet_bot_url}"},
      {"name": "ASSEMBLYAI_API_KEY",                   "value": "${var.assemblyai_api_key}"},
      {"name": "AWS_REGION",                           "value": "${data.aws_region.current.name}"},
      {"name": "DYNAMODB_TABLE",                       "value": "${var.dynamo_meet_bot_recordings_name}"},
      {"name": "ELEVENLABS_API_KEY",                   "value": "${var.elevenlabs_api_key}"},
      {"name": "ENVIRONMENT",                          "value": "${var.environment}"},
      {"name": "MEET_BOT_S3_BUCKET",                   "value": "${var.meet_bot_s3_bucket_name}"},
      {"name": "MEET_BOT_MAX_DURATION_MINUTES",        "value": "${var.environment == "production" ? 120 : 60}"},
      {"name": "OPENAI_API_KEY",                       "value": "${var.openai_api_key}"},
      {"name": "RECORD_VIDEO",                         "value": "${var.meet_bot_record_video}"}
    ],
    "essential":   true,
    "healthCheck": {
      "command": [
        "CMD-SHELL",
        "curl -f http://127.0.0.1:3000/ || exit 1"
      ],
      "startPeriod": 60,
      "interval": 30,
      "timeout": 10,
      "retries": 5
    },
    "image":       "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/meet-bot-api:${local.meet-bot_version}",
    "logConfiguration": {
      "logDriver": "awslogs",
      "options":   {
        "awslogs-group":         "${var.meet-bot_log_group_name}",
        "awslogs-region":        "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "memory":      ${local.meet-bot_instance_memory},
    "name":        "meet-bot-${var.environment}",
    "portMappings": [
      {
        "containerPort": 3000,
        "hostPort":      3000
      }
    ]
  }
]
TASK_DEFINITION
}

resource "aws_ecs_service" "meet-bot" {
  cluster                           = aws_ecs_cluster.primary.id
  desired_count                     = local.meet-bot_instance_count
  enable_execute_command            = true
  health_check_grace_period_seconds = 90
  launch_type                       = "FARGATE"
  name                              = "meet-bot-${var.environment}"
  tags = merge(
    var.tags,
    {
      Service = "MeetBot"
    }
  )
  task_definition                   = aws_ecs_task_definition.meet-bot.arn

  lifecycle {
    ignore_changes = []
  }

  # load_balancer {
  #   target_group_arn = var.load_balancer_meet-bot_target_group_arn
  #   container_name   = "meet-bot-${var.environment}"
  #   container_port   = 3000
  # }

  network_configuration {
    assign_public_ip = false
    security_groups  = [var.meet_bot_security_group_id]
    subnets          = var.private_subnet_ids
  }
}



//-----------------------------------------------------------------------------
//
// Scheduler-service
//
//-----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "scheduler-service" {
  cpu                      = local.scheduler-service_instance_cpu
  execution_role_arn       = var.ecs_tasks_role_arn
  family                   = "scheduler-service-${var.environment}"
  memory                   = local.scheduler-service_instance_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = merge(
    var.tags,
    {
      Service = "SchedulerService"
    }
  )
  task_role_arn            = var.ecs_tasks_role_arn

  container_definitions = <<TASK_DEFINITION
[
  {
    "cpu":         ${local.scheduler-service_instance_cpu},
    "environment": [
      {"name": "AMQP_URL",                      "value": "${var.mq_meet_bot_url}"},
      {"name": "AWS_REGION",                    "value": "${data.aws_region.current.name}"},
      {"name": "DYNAMODB_TABLE",                "value": "meet-bot-${var.environment}"},
      {"name": "DYNAMODB_RECORDINGS_TABLE",     "value": "${var.dynamo_meet_bot_recordings_name}"},
      {"name": "ENVIRONMENT",                   "value": "${var.environment}"},
      {"name": "PORT",                          "value": "80"},
      {"name": "SCHEDULER_URL",                 "value": "https://${var.scheduler-service_hostname}/webhook/calendar"},
      {"name": "SCHEDULER_ROLE_ARN",            "value": "${var.eventbridge_scheduler_role_arn}"}, 
      {"name": "SECRET_NAME",                   "value": "GoogleServiceAccountKey"},
      {"name": "SERVICE_ACCOUNT_EMAIL",         "value": "pulse-bot@zunou-416222.iam.gserviceaccount.com"},
      {"name": "USER_EMAIL",                    "value": "pulse@zunou.ai"},
      {"name": "WEBHOOK_URL",                   "value": "https://${var.scheduler-service_hostname}/notifications"},
      {"name": "SCALING_API_KEY",               "value": "${var.scaling_api_key}"},
      {"name": "SCALING_ALLOWED_IPS",           "value": "${var.scaling_allowed_ips}"},
      {"name": "MAX_INSTANCES",                 "value": "${var.max_instances}"},
      {"name": "MEET_BOT_S3_BUCKET",            "value": "${var.meet_bot_s3_bucket_name}"},
      {"name": "MIN_INSTANCES",                 "value": "${local.instance_counts[var.environment].meet-bot}"},
      {"name": "ECS_SCALER_LAMBDA_NAME",        "value": "ecs-service-scaler-${var.environment}"}
    ],
    "essential":   true,
    "healthCheck": {
      "command": [
        "CMD-SHELL",
        "curl -f http://127.0.0.1:80/ || exit 1"
      ],
      "startPeriod": 60,
      "interval": 30,
      "timeout": 10,
      "retries": 5
    },
    "image":       "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/scheduler-service:${local.scheduler-service_version}",
    "logConfiguration": {
      "logDriver": "awslogs",
      "options":   {
        "awslogs-group":         "${var.scheduler-service_log_group_name}",
        "awslogs-region":        "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "memory":      ${local.scheduler-service_instance_memory},
    "name":        "scheduler-service-${var.environment}",
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort":      80
      }
    ]
  }
]
TASK_DEFINITION
}

resource "aws_ecs_service" "scheduler-service" {
  cluster                           = aws_ecs_cluster.primary.id
  desired_count                     = local.scheduler-service_instance_count
  enable_execute_command            = true
  health_check_grace_period_seconds = 90
  launch_type                       = "FARGATE"
  name                              = "scheduler-service-${var.environment}"
  tags = merge(
    var.tags,
    {
      Service = "SchedulerService"
    }
  )
  task_definition                   = aws_ecs_task_definition.scheduler-service.arn

  lifecycle {
    ignore_changes = []
  }

  load_balancer {
    target_group_arn = var.load_balancer_scheduler-service_target_group_arn
    container_name   = "scheduler-service-${var.environment}"
    container_port   = 80
  }

  network_configuration {
    assign_public_ip = true
    security_groups  = [var.scheduler_service_security_group_id]
    subnets          = var.private_subnet_ids
  }
}




//-----------------------------------------------------------------------------
//
// Slack
//
//-----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "slack" {
  cpu                      = local.slack_instance_cpu
  execution_role_arn       = var.ecs_tasks_role_arn
  family                   = "slack-${var.environment}"
  memory                   = local.slack_instance_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = merge(
    var.tags,
    {
      Service = "Slack"
    }
  )
  task_role_arn            = var.ecs_tasks_role_arn

  container_definitions = <<TASK_DEFINITION
[
  {
    "cpu":         ${local.slack_instance_cpu},
    "environment": [
      {"name": "AUTH0_AUDIENCE",              "value": "${var.auth0_audience}"},
      {"name": "AUTH0_DOMAIN",                "value": "${var.auth0_domain}"},
      {"name": "AUTH0_M2M_CLIENT_ID",         "value": "${var.auth0_m2m_client_id}"},
      {"name": "AUTH0_M2M_CLIENT_SECRET",     "value": "${var.auth0_m2m_client_secret}"},
      {"name": "CORE_GRAPHQL_URL",            "value": "${var.core_graphql_url}"},
      {"name": "KESTRA_LOG_ENDPOINT",         "value": "https://${var.kestra_hostname}/api/v1/executions/webhook/zunou.${var.environment}/store-slack-messages-${var.environment}/${var.kestra_slack_webhook_key}"},
      {"name": "KESTRA_BASIC_AUTH_PASSWORD",  "value": "${local.kestra_basic_auth_password}"},
      {"name": "KESTRA_BASIC_AUTH_USERNAME",  "value": "${local.kestra_basic_auth_username}"},
      {"name": "PULSE_DOMAIN",                "value": "${var.pulse_hostname}"},
      {"name": "SLACK_APP_TOKEN",             "value": "${var.slack_app_token}"},
      {"name": "SLACK_BOT_TOKEN",             "value": "${var.slack_bot_token}"},
      {"name": "SLACK_LISTEN_COMMAND",        "value": "${local.slack_listen_command}"},
      {"name": "SLACK_SIGNING_SECRET",        "value": "${var.slack_signing_secret}"}
    ],
    "essential":              true,
    "image":                  "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/slack:${local.slack_version}",
    "memory":                 ${local.slack_instance_memory},
    "name":                   "slack-${var.environment}",
    "readonlyRootFilesystem": false,

    "logConfiguration": {
      "logDriver": "awslogs",
      "options":   {
        "awslogs-group":         "${var.slack_log_group_name}",
        "awslogs-region":        "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }
]
TASK_DEFINITION
}

resource "aws_ecs_service" "slack" {
  cluster         = aws_ecs_cluster.primary.id
  desired_count   = local.slack_instance_count
  launch_type     = "FARGATE"
  name            = "slack-${var.environment}"
  tags = merge(
    var.tags,
    {
      Service = "Slack"
    }
  )
  task_definition = aws_ecs_task_definition.slack.arn

  lifecycle {
    ignore_changes = []
  }

  network_configuration {
    subnets = var.private_subnet_ids
  }
}
//-----------------------------------------------------------------------------
//
// Unstructured.io
//
//-----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "unstructured" {
  cpu                      = local.unstructured_instance_cpu
  execution_role_arn       = var.ecs_tasks_role_arn
  family                   = "unstructured-${var.environment}"
  memory                   = local.unstructured_instance_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = merge(
    var.tags,
    {
      Service = "Unstructured"
    }
  )
  task_role_arn            = var.ecs_tasks_role_arn

  container_definitions = <<TASK_DEFINITION
[
  {
    "cpu":         ${local.unstructured_instance_cpu},
    "environment": [
      {"name": "UNSTRUCTURED_API_KEY",         "value": "${var.unstructured_api_key}"},
      {"name": "UNSTRUCTURED_API_URL",         "value": "${var.unstructured_api_url}"},
      {"name": "OPENAI_API_KEY",               "value": "${var.openai_api_key}"},
      {"name": "PINECONE_API_KEY",             "value": "${var.pinecone_api_key}"},
      {"name": "OPENAI_EMBEDDING_MODEL",       "value": "${var.openai_embedding_model}"},
      {"name": "OPENAI_SUMMARY_MODEL",         "value": "${var.openai_summary_model}"},
      {"name": "AWS_ACCESS_KEY_ID",            "value": "${var.aws_access_key_id}"},
      {"name": "AWS_SECRET_ACCESS_KEY",        "value": "${var.aws_secret_access_key}"},
      {"name": "POSTGRES_DB_HOST",             "value": "${var.postgres_db_host}"},
      {"name": "POSTGRES_DB_PORT",             "value": "${var.postgres_db_port}"},
      {"name": "POSTGRES_DB_DATABASE",         "value": "${var.postgres_db_database}"},
      {"name": "POSTGRES_DB_USERNAME",         "value": "${var.postgres_db_username}"},
      {"name": "POSTGRES_DB_PASSWORD",         "value": "${var.postgres_db_password}"},
      {"name": "ELEVENLABS_API_KEY",           "value": "${var.elevenlabs_api_key}"},
      {"name": "ENVIRONMENT",           "value": "${var.environment}"}
    ],
    "essential":   true,
    "healthCheck": {
      "command": [
        "CMD-SHELL",
        "curl -f http://127.0.0.1/ || exit 1"
      ],
      "startPeriod": 60,
      "interval": 30,
      "timeout": 10,
      "retries": 5
    },
    "image":       "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/unstructured:${local.unstructured_version}",
    "logConfiguration": {
      "logDriver": "awslogs",
      "options":   {
        "awslogs-group":         "${var.unstructured_log_group_name}",
        "awslogs-region":        "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "memory":      ${local.unstructured_instance_memory},
    "name":        "unstructured-${var.environment}",
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort":      80
      }
    ]
  }
]
TASK_DEFINITION
}

resource "aws_ecs_service" "unstructured" {
  cluster                           = aws_ecs_cluster.primary.id
  desired_count                     = local.unstructured_instance_count
  enable_execute_command            = true
  health_check_grace_period_seconds = 30
  launch_type                       = "FARGATE"
  name                              = "unstructured-${var.environment}"
  tags = merge(
    var.tags,
    {
      Service = "Unstructured"
    }
  )
  task_definition                   = aws_ecs_task_definition.unstructured.arn

  lifecycle {
    ignore_changes = []
  }

  load_balancer {
    target_group_arn = var.load_balancer_unstructured_target_group_arn
    container_name   = "unstructured-${var.environment}"
    container_port   = 80
  }

  network_configuration {
    assign_public_ip = true
    security_groups  = [var.ecs_default_security_group_id]
    subnets          = var.private_subnet_ids
  }
}


//-----------------------------------------------------------------------------
//
// Uploader
//
//-----------------------------------------------------------------------------
resource "aws_ecs_task_definition" "uploader" {
  cpu                      = local.uploader_instance_cpu
  execution_role_arn       = var.ecs_tasks_role_arn
  family                   = "uploader-${var.environment}"
  memory                   = local.uploader_instance_memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  tags = merge(
    var.tags,
    {
      Service = "UploaderCompanion"
    }
  )
  task_role_arn            = var.ecs_tasks_role_arn

  container_definitions = <<TASK_DEFINITION
[
  {
    "cpu":         ${local.uploader_instance_cpu},
    "environment": [
      {"name": "COMPANION_GOOGLE_CLOUD_CLIENT_ID",     "value": "${var.companion_google_cloud_client_id}"},
      {"name": "COMPANION_GOOGLE_CLOUD_CLIENT_SECRET", "value": "${var.companion_google_cloud_client_secret}"},
      {"name": "COMPANION_ONEDRIVE_KEY",     "value": "${var.companion_onedrive_client_id}"},
      {"name": "COMPANION_ONEDRIVE_SECRET", "value": "${var.companion_onedrive_client_secret}"},
      {"name": "COMPANION_SESSION_SECRET",             "value": "${random_password.companion_session_secret.result}"},
      {"name": "COMPANION_UPLOAD_URLS",                "value": "https://${var.s3_data_sources_bucket_name}.s3.${data.aws_region.current.name}.amazonaws.com/"},
      {"name": "COMPANION_URL",                        "value": "https://${var.uploader_hostname}/companion"},
      {"name": "NODE_ENV",                             "value": "production"}
    ],
    "essential":   true,
    "healthCheck": {
      "command": [
        "CMD-SHELL",
        "curl -f http://localhost/ || exit 1"
      ],
      "interval": 30,
      "timeout": 5,
      "retries": 3
    },
    "image":       "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/uploader:${local.uploader_version}",
    "logConfiguration": {
      "logDriver": "awslogs",
      "options":   {
        "awslogs-group":         "${var.uploader_log_group_name}",
        "awslogs-region":        "${data.aws_region.current.name}",
        "awslogs-stream-prefix": "ecs"
      }
    },
    "memory":      ${local.uploader_instance_memory},
    "name":        "uploader-${var.environment}",
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort":      80
      }
    ]
  }
]
TASK_DEFINITION
}

resource "aws_ecs_service" "uploader" {
  cluster                           = aws_ecs_cluster.primary.id
  desired_count                     = local.uploader_instance_count
  enable_execute_command            = true
  health_check_grace_period_seconds = 30
  launch_type                       = "FARGATE"
  name                              = "uploader-${var.environment}"
  tags = merge(
    var.tags,
    {
      Service = "UploaderCompanion"
    }
  )
  task_definition                   = aws_ecs_task_definition.uploader.arn

  lifecycle {
    ignore_changes = []
  }

  load_balancer {
    target_group_arn = var.load_balancer_uploader_target_group_arn
    container_name   = "uploader-${var.environment}"
    container_port   = 80
  }

  network_configuration {
    assign_public_ip = true
    security_groups  = [var.default_security_group_id]
    subnets          = var.private_subnet_ids
  }
}

resource "random_password" "companion_session_secret" {
  length  = 32
  special = false
}
