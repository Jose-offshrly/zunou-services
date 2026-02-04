resource "aws_iam_role" "ecs_tasks" {
  name = "ecs-tasks-${var.environment}"
  tags = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "ecs_tasks" {
  name = "ecs-tasks-${var.environment}"
  tags = var.tags

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:PutLogEvents",
        ],
        Effect = "Allow",
        Resource = [
          var.calendar-service_log_group_arn,
          "${var.calendar-service_log_group_arn}:*:*",
          var.kestra_log_group_arn,
          "${var.kestra_log_group_arn}:*:*",
          var.scheduler-service_log_group_arn,
          "${var.scheduler-service_log_group_arn}:*:*",
          var.slack_log_group_arn,
          "${var.slack_log_group_arn}:*:*",
          var.unstructured_log_group_arn,
          "${var.unstructured_log_group_arn}:*:*",
          var.meet-bot_log_group_arn,
          "${var.meet-bot_log_group_arn}:*:*",
          var.uploader_log_group_arn,
          "${var.uploader_log_group_arn}:*:*",
          var.vpc_rejected_log_group_arn,
          "${var.vpc_rejected_log_group_arn}:*:*",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/data-analyst-python${var.environment == "develoment" ? "" : "-${var.environment}"}:*:*",
        ],
      },
      {
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:ListImages",
        ],
        Effect   = "Allow",
        Resource = "arn:aws:ecr:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*/*",
      },
      {
        Action = [
          "ecr:GetAuthorizationToken",
        ],
        Effect   = "Allow",
        Resource = "*",
      },

      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        Effect   = "Allow",
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/meet-bot-${var.environment}",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/meet-bot-${var.environment}/index/*",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/meet-bot-recordings-${var.environment}",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/meet-bot-recordings-${var.environment}/index/*"
          ]
      },

      {
        Effect = "Allow",
        Action = "iam:PassRole",
        Resource = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/eventbridge-scheduler-${var.environment}",
        Condition = {
          StringEquals = {
            "iam:PassedToService": "scheduler.amazonaws.com"
          }
        }
      },
      
      {
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey",
        ],
        Effect   = "Allow",
        Resource = var.primary_kms_key_arn,
      },
      {
        Action = [
          "secretsmanager:GetSecretValue",
        ],
        Effect = "Allow",
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret/*",
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:GoogleServiceAccountKey-*",
          "arn:aws:kms:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:key/*", // for ecs to upload to S3
          // Laravel Vapor:
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:zunou-graphql-api-${var.environment == "development" ? "staging" : var.environment}/*",
        ]
      },
      {
        Action = [
          "s3:DeleteObject",
          "s3:DeleteObjectVersion",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject",
        ]
        Effect = "Allow"
        Resource = [
          "${var.s3_data_sources_bucket_arn}/*",
          "${var.meet_bot_s3_bucket_arn}/*"
        ]
      },
      {
        Action = [
          "s3:ListBucket",
        ]
        Effect = "Allow"
        Resource = [
          "${var.s3_data_sources_bucket_arn}",
          "${var.meet_bot_s3_bucket_arn}"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "scheduler:CreateSchedule",
          "scheduler:UpdateSchedule",
          "scheduler:DeleteSchedule",
          "scheduler:GetSchedule"
        ],
        Resource = [
          "arn:aws:scheduler:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:schedule/default/*",      "arn:aws:scheduler:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:schedule/meet-bot-${var.environment}/*"
          ]
      },
      {
        Action = [
          "rds-db:connect"
        ],
        Effect = "Allow",
        Resource = [
          "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:*/*"
        ]
      },
      {
      "Action": [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel"
      ],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:GetQueueUrl",
        "sqs:GetQueueAttributes",
        "sqs:DeleteMessage"
      ],
      "Resource": [
        "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:meet-bot-trigger-${var.environment}"      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeClusters",
        "ecs:UpdateService"
      ],
      "Resource": "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/primary-${var.environment}/meet-bot-${var.environment}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:ecs-service-scaler-${var.environment}"
    }
    ],
  })
}

resource "aws_iam_policy_attachment" "ecs_tasks" {
  name       = "ecs-tasks-${var.environment}"
  policy_arn = aws_iam_policy.ecs_tasks.arn
  roles      = [aws_iam_role.ecs_tasks.name]
}


#-----------------------------------------------------------------------------
//
// EventBridge Scheduler Role
//
//-----------------------------------------------------------------------------

#TODO : do we need these?
resource "aws_iam_role" "eventbridge_scheduler" {
  name = "eventbridge-scheduler-${var.environment}"
  tags = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "eventbridge_scheduler" {
  name = "eventbridge-scheduler-${var.environment}"
  tags = var.tags

  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "lambda:InvokeFunction", # ✅ Correct action
        Resource = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:MeetBotTrigger-${var.environment}" 
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_scheduler" {
  role       = aws_iam_role.eventbridge_scheduler.name
  policy_arn = aws_iam_policy.eventbridge_scheduler.arn
}


#-----------------------------------------------------------------------------
//
// Lambda Role
//
//-----------------------------------------------------------------------------

#IAM Role for MeetBot Lambda
resource "aws_iam_role" "meetbot_lambda" {
  name = "lambda_meetbot_role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "meetbot_lambda_logging" {
  name        = "meetbot_logging_policy-v2-${var.environment}"
  description = "IAM policy for MeetBot Lambda logging"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "logs:CreateLogGroup",
        Effect = "Allow",
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Effect = "Allow",
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/MeetBotTrigger-${var.environment}:*",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/MeetBotResults-${var.environment}:*"
          ]
      }
    ]
  })
}

resource "aws_iam_policy" "meetbot_sqs" {
  name        = "meetbot_sqs_policy-${var.environment}"
  description = "IAM policy for MeetBot SQS"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        "Effect": "Allow",
        "Action": [
          "sqs:SendMessage",
          "sqs:GetQueueUrl",
          "sqs:GetQueueAttributes"
        ],
        "Resource": [
          "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:meet-bot-trigger-${var.environment}",
          "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:meet-bot-results-${var.environment}"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "meetbot_s3" {
  name        = "meetbot_s3_policy-${var.environment}"
  description = "IAM policy for MeetBot Lambda to get content from S3"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      { 
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
        ]
        Effect = "Allow"
        Resource = [
          "${var.s3_data_sources_bucket_arn}/*",
          "${var.meet_bot_s3_bucket_arn}/*"
        ]
      },
    ]
  })
}


resource "aws_iam_policy" "meetbot_scheduler" {
  name        = "meetbot_scheduler_policy-${var.environment}"
  description = "IAM policy for MeetBot Lambda to manage EventBridge Scheduler"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "scheduler:DeleteSchedule",  # ✅ Allow schedule deletion
          "scheduler:GetSchedule"      # ✅ Allow fetching schedule info (optional)
        ],
        Resource = "arn:aws:scheduler:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:schedule/meet-bot-${var.environment}/*"
      }
    ]
  })
}

resource "aws_iam_policy" "meetbot_kms_policy" {
  name        = "meetbot_kms_policy-${var.environment}"
  description = "Policy to allow Lambda to decrypt using the primary KMS key"
  policy      = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt"],
        Resource = "${var.primary_kms_key_arn}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "meetbot_kms_attach" {
  role       = aws_iam_role.meetbot_lambda.name
  policy_arn = aws_iam_policy.meetbot_kms_policy.arn
}

resource "aws_iam_role_policy_attachment" "meetbot_scheduler_attach" {
  role       = aws_iam_role.meetbot_lambda.name
  policy_arn = aws_iam_policy.meetbot_scheduler.arn
}

resource "aws_iam_role_policy_attachment" "meetbot_logging_attach" {
  role       = aws_iam_role.meetbot_lambda.name
  policy_arn = aws_iam_policy.meetbot_lambda_logging.arn
}

resource "aws_iam_role_policy_attachment" "meetbot_s3_attach" {
  role       = aws_iam_role.meetbot_lambda.name
  policy_arn = aws_iam_policy.meetbot_s3.arn
}

resource "aws_iam_role_policy_attachment" "meetbot_sqs_attach" {
  role       = aws_iam_role.meetbot_lambda.name
  policy_arn = aws_iam_policy.meetbot_sqs.arn
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.meetbot_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for Lambda Logging
resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging_policy-${var.environment}"
  description = "Allow Lambda to write logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach Policy to Lambda Execution Role
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

# IAM Role for Scout AI Proxy Lambda
resource "aws_iam_role" "scout_ai_proxy_lambda" {
  name = "scout-lambda-exec-role-${var.environment}"
  tags = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Scout AI Proxy Lambda Logging
resource "aws_iam_policy" "scout_ai_proxy_lambda_logging" {
  name        = "scout-lambda-logging-policy-${var.environment}"
  description = "IAM policy for Scout AI Proxy Lambda logging"
  tags        = var.tags

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          var.scout_ai_proxy_log_group_arn,
          "${var.scout_ai_proxy_log_group_arn}:*"
        ]
      }
    ]
  })
}

# Attach Policy to Scout AI Proxy Lambda Role
resource "aws_iam_role_policy_attachment" "scout_ai_proxy_lambda_logs" {
  role       = aws_iam_role.scout_ai_proxy_lambda.name
  policy_arn = aws_iam_policy.scout_ai_proxy_lambda_logging.arn
}

# IAM Role for S3 to call Lambda function
resource "aws_lambda_permission" "allow_s3_to_call_lambda_results" {
  statement_id  = "AllowS3InvokeResults"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_meet_bot_results_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.meet_bot_s3_bucket_arn
}


# ECS scaler lambda role
resource "aws_iam_role" "ecs_scaler_lambda" {
  name = "ecs-scaler-lambda-${var.environment}"
  tags = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "scheduler.amazonaws.com"
          ]
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "ecs_scaler_lambda" {
  name = "ecs-scaler-lambda-policy-${var.environment}"
  tags = var.tags

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices"
        ],
        Resource = "*" 
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_scaler_lambda_attach" {
  role       = aws_iam_role.ecs_scaler_lambda.name
  policy_arn = aws_iam_policy.ecs_scaler_lambda.arn
}

resource "aws_iam_policy" "ecs_scaler_scheduler_invoke_lambda" {
  name        = "ecs-scaler-scheduler-invoke-lambda-${var.environment}"
  description = "Allow EventBridge Scheduler to invoke the ecs-scaler Lambda"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "lambda:InvokeFunction"
        ],
        Resource = "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:ecs-service-scaler-${var.environment}"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_scaler_scheduler_lambda_attach" {
  role       = aws_iam_role.ecs_scaler_lambda.name
  policy_arn = aws_iam_policy.ecs_scaler_scheduler_invoke_lambda.arn
}


//-----------------------------------------------------------------------------
//
// API / Laravel Vapor user
//
//-----------------------------------------------------------------------------
resource "aws_iam_user" "api" {
  name = "api-${var.environment}"
  tags = var.tags
}

resource "aws_iam_policy" "api" {
  description = "A policy defining permissions needed to push images to ECR"
  name        = "api-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:GetObjectAcl",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:PutObject",
          "s3:PutObjectAcl",
        ]
        Effect   = "Allow"
        Resource = [
          "${var.s3_data_sources_bucket_arn}",
          "${var.s3_data_sources_bucket_arn}/*",
          "arn:aws:s3:::live-uploads-${var.environment}/*",
          "arn:aws:s3:::marcus-test-bucket",
          "arn:aws:s3:::marcus-test-bucket/*",
          "arn:aws:s3:::pulse-test-upload",
          "arn:aws:s3:::pulse-test-upload/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
        ]
        Effect   = "Allow"
        Resource = "${var.primary_kms_key_arn}"
      },
      {
        Action = [
          "ses:SendRawEmail",
        ]
        Effect   = "Allow"
        Resource = "arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identity/${var.root_domain}"
      },
      {
        Action = [
          "sqs:SendMessage",
        ],
        Effect   = "Allow",
        Resource = [
          var.sqs_csv_data_source_queue_arn, 
          var.sqs_meet_bot_trigger_queue_arn
          ]
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:CreateSecret"
        ],
        "Resource" : "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:zunou-ai.gcp.sa-customer.*.${var.environment}-*"
      },
      {
        "Effect" : "Allow",
        "Action" : "secretsmanager:GetSecretValue",
        "Resource" : "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:zunou-ai.*.${var.environment}-*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        "Resource": "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/zunou-pulse-dubbing-${var.environment}"
      },
      {
        "Effect": "Allow",
        "Action": [
          "sqs:ReceiveMessage",
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:DeleteMessage"
        ],
        "Resource": "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:meet-bot-results-${var.environment}"
      },
      {
        "Effect": "Allow",
        "Action": [
          "ecs:DescribeServices",
          "ecs:DescribeClusters",
          "ecs:UpdateService"
        ],
        "Resource": "arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:service/primary-${var.environment}/meet-bot-${var.environment}"
      },
      {
        "Effect": "Allow",
        "Action": [
          "lambda:InvokeFunction"
        ],
        "Resource": "arn:aws:lambda:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:function:ecs-service-scaler-${var.environment}"
      },
      {
        "Effect": "Allow",
        "Action": [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ],
        "Resource": "arn:aws:bedrock:*::foundation-model/*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "api" {
  user       = aws_iam_user.api.name
  policy_arn = aws_iam_policy.api.arn
}

//-----------------------------------------------------------------------------
//
// Flow Log Writer
//
//-----------------------------------------------------------------------------
resource "aws_iam_role" "flow_logs" {
  name = "flow-logs-${var.environment}"
  tags = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "flow_logs" {
  name = "flow-logs-${var.environment}"
  tags = var.tags

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents",
          "logs:PutLogEvents",
        ],
        Effect = "Allow",
        Resource = [
          "${var.vpc_rejected_log_group_arn}:*:*",
        ],
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
        ],
        Effect   = "Allow",
        Resource = var.primary_kms_key_arn,
      },
    ],
  })
}

resource "aws_iam_policy_attachment" "flow_logs" {
  name       = "flow-logs-${var.environment}"
  policy_arn = aws_iam_policy.flow_logs.arn
  roles      = [aws_iam_role.flow_logs.name]
}

//-----------------------------------------------------------------------------
//
// Kestra User
//
//-----------------------------------------------------------------------------
resource "aws_iam_user" "kestra" {
  name = "kestra-${var.environment}"
  tags = var.tags
}

resource "aws_iam_policy" "kestra" {
  description = "A policy defining permissions needed to run Kestra"
  name        = "kestra-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
          Action   = "s3:ListAllMyBuckets",
          Effect   = "Allow",
          Resource = "*"
      },
      {
        Action = [
          "s3:*",
        ]
        Effect   = "Allow"
        Resource = [
          "${var.s3_kestra_bucket_arn}",
          "${var.s3_kestra_bucket_arn}/*",
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
        ]
        Effect   = "Allow"
        Resource = "${var.primary_kms_key_arn}"
      },
    ]
  })
}

resource "aws_iam_user_policy_attachment" "kestra" {
  user       = aws_iam_user.kestra.name
  policy_arn = aws_iam_policy.kestra.arn
}

#-----------------------------------------------------------------------------
# Error-log-watcher Lambda (error-assistant)
#-----------------------------------------------------------------------------
resource "aws_iam_role" "error_log_watcher_exec" {
  name = "scout-error-log-watcher-exec-${var.environment}"
  tags = var.tags

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "error_log_watcher_basic_execution" {
  role       = aws_iam_role.error_log_watcher_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy" "error_log_watcher_logs" {
  name        = "error-log-watcher-logs-${var.environment}"
  description = "FilterLogEvents on API queue log group for error-log-watcher Lambda"
  tags        = var.tags

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:FilterLogEvents",
          "logs:GetLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          var.error_log_watcher_source_log_group_arn,
          "${var.error_log_watcher_source_log_group_arn}:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "error_log_watcher_logs" {
  role       = aws_iam_role.error_log_watcher_exec.name
  policy_arn = aws_iam_policy.error_log_watcher_logs.arn
}

resource "aws_iam_policy" "error_log_watcher_s3_dedup" {
  name        = "error-log-watcher-s3-dedup-${var.environment}"
  description = "S3 deduplication (error-hashes/*) for error-log-watcher Lambda"
  tags        = var.tags

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "${var.error_log_watcher_dedup_bucket_arn}/error-hashes/*"
      },
      {
        Effect = "Allow"
        Action = ["s3:ListBucket"]
        Resource = var.error_log_watcher_dedup_bucket_arn
        Condition = {
          StringLike = {
            "s3:prefix" = "error-hashes/*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "error_log_watcher_s3_dedup" {
  role       = aws_iam_role.error_log_watcher_exec.name
  policy_arn = aws_iam_policy.error_log_watcher_s3_dedup.arn
}

resource "aws_iam_policy" "error_log_watcher_ses" {
  name        = "error-log-watcher-ses-${var.environment}"
  description = "SES SendEmail for error-log-watcher Lambda notifications"
  tags        = var.tags

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identity/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "error_log_watcher_ses" {
  role       = aws_iam_role.error_log_watcher_exec.name
  policy_arn = aws_iam_policy.error_log_watcher_ses.arn
}
