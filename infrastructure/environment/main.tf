module "amplify" {
  source = "./modules/amplify"

  auth0_audience              = module.auth0.auth0_audience
  auth0_domain                = local.auth0_domain
  auth0_client_id             = module.auth0.auth0_client_id
  core_graphql_url            = local.core_graphql_url
  github_amplify_access_token = var.github_amplify_access_token
  environment                 = var.environment
  hostnames                   = local.hostnames
  launch_darkly_client_id     = var.launch_darkly_client_id
  pusher_cluster              = var.pusher_cluster
  pusher_auth_endpoint        = var.pusher_auth_endpoint
  pusher_key                  = var.pusher_key
  dashboard_mac_zip           = var.dashboard_mac_zip
  dashboard_mac_dmg           = var.dashboard_mac_dmg
  dashboard_windows           = var.dashboard_windows
  scout_mac_zip               = var.scout_mac_zip
  scout_mac_dmg               = var.scout_mac_dmg
  scout_windows               = var.scout_windows
  scout_web_app               = var.scout_web_app
}

module "auth0" {
  source = "./modules/auth0"

  auth0_domain              = local.auth0_domain
  auth0_email               = local.auth0_email
  aws_region                = local.aws_region
  aws_ses_access_key_id     = module.ses.aws_ses_access_key_id
  aws_ses_secret_access_key = module.ses.aws_ses_secret_access_key
  environment               = var.environment
  hostnames                 = local.hostnames
  origin_domain             = local.origin_domain
  support_email             = local.support_email
  extra_auth0_origins       = local.extra_auth0_origins
}

module "certificate_manager" {
  source = "./modules/certificate_manager"

  cert_primary    = local.cert_primary
  cert_secondary  = local.cert_secondary
  environment     = var.environment
  hostnames       = local.hostnames
  origin_domain   = local.origin_domain
  tags            = local.tags
}

module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment = var.environment
  tags        = local.tags
}

module "dynamodb" {
  source                     = "./modules/dynamodb"
  environment                = var.environment
  tags                       = local.tags
}

module "ec2" {
  source = "./modules/ec2"
  default_security_group_id = module.vpc.default_security_group_id
  environment = var.environment
  tags        = local.tags
  vpc_id      = module.vpc.vpc_id
}

module "ecs" {
  source = "./modules/ecs"

  auth0_audience                               = module.auth0.auth0_audience
  auth0_domain                                 = local.auth0_domain
  auth0_m2m_client_id                          = module.auth0.auth0_m2m_client_id
  auth0_m2m_client_secret                      = module.auth0.auth0_m2m_client_secret
  aws_access_key_id                            = var.aws_access_key_id
  aws_region                                   = local.aws_region
  aws_secret_access_key                        = var.aws_secret_access_key
  assemblyai_api_key                           = var.assemblyai_api_key
  
  calendar-service_hostname                    = local.hostnames.Calendar-service
  calendar-service_log_group_name              = module.cloudwatch.calendar-service_log_group_name
  
  companion_google_cloud_client_id             = var.companion_google_cloud_client_id
  companion_google_cloud_client_secret         = var.companion_google_cloud_client_secret
  companion_onedrive_client_id                 = var.companion_onedrive_client_id
  companion_onedrive_client_secret             = var.companion_onedrive_client_secret
  core_graphql_url                             = local.core_graphql_url
  database_url                                 = var.database_url
  default_security_group_id                    = module.vpc.default_security_group_id
  dynamo_meet_bot_recordings_name              = module.dynamodb.dynamo_meet_bot_recordings_table_name
  ecs_default_security_group_id                = module.vpc.ecs_default_security_group_id
  ecs_scaler_lambda_arn                        = module.lambda.ecs_scaler_lambda_arn
  ecs_scaler_lambda_role_arn                   = module.iam.ecs_scaler_lambda_role_arn
  ecs_tasks_role_arn                           = module.iam.ecs_tasks_role_arn
  elevenlabs_api_key                           = var.elevenlabs_api_key
  environment                                  = var.environment
  eventbridge_scheduler_role_arn               = module.iam.eventbridge_scheduler_role_arn
  github_access_token                          = var.github_amplify_access_token
  kestra_aws_access_key_id                     = var.kestra_aws_access_key_id
  kestra_aws_secret_access_key                 = var.kestra_aws_secret_access_key
  kestra_database_password                     = var.kestra_database_password
  kestra_database_url                          = module.rds.kestra_database_url
  kestra_hostname                              = local.hostnames.Kestra
  kestra_log_group_name                        = module.cloudwatch.kestra_log_group_name
  kestra_s3_bucket_name                        = module.s3.s3_kestra_bucket_name
  kestra_slack_webhook_key                     = var.kestra_slack_webhook_key
  load_balancer_calendar-service_target_group_arn        = module.elb.load_balancer_calendar-service_target_group_arn
  load_balancer_kestra_target_group_arn        = module.elb.load_balancer_kestra_target_group_arn
  #load_balancer_meet-bot_target_group_arn      = module.elb.load_balancer_meet-bot_target_group_arn
  load_balancer_scheduler-service_target_group_arn        = module.elb.load_balancer_scheduler-service_target_group_arn
  load_balancer_unstructured_target_group_arn  = module.elb.load_balancer_unstructured_target_group_arn
  load_balancer_uploader_target_group_arn      = module.elb.load_balancer_uploader_target_group_arn
  meet-bot_hostname                            = local.hostnames.Meet-bot
  meet-bot_log_group_name                      = module.cloudwatch.meet-bot_log_group_name
  meet_bot_s3_bucket_name                      = module.s3.s3_meet-bot_bucket_name
  meet_bot_security_group_id                   = module.vpc.meet_bot_security_group_id
  mq_meet_bot_url                              = var.mq_meet_bot_url
  mq_security_group_id                         = module.mq.rabbitmq_security_group_id
  openai_api_key                               = var.openai_api_key
  openai_assistant_id                          = var.openai_assistant_id
  openai_embedding_model                       = var.openai_embedding_model
  openai_summary_model                         = var.openai_summary_model
  pinecone_api_key                             = var.pinecone_api_key
  pinecone_index_name                          = var.pinecone_index_name
  postgres_db_database                         = var.postgres_db_database
  postgres_db_host                             = var.postgres_db_host
  postgres_db_password                         = var.postgres_db_password
  postgres_db_port                             = var.postgres_db_port
  postgres_db_username                         = var.postgres_db_username
  primary_kms_key_arn                          = module.kms.primary_kms_key_arn
  private_subnet_ids                           = module.vpc.private_subnet_ids
  public_subnet_ids                            = module.vpc.public_subnet_ids
  pulse_hostname                               = local.hostnames.Pulse
  s3_data_sources_bucket_name                  = module.s3.s3_data_sources_bucket_name
  scheduler-service_hostname                   = local.hostnames.Scheduler-service
  scheduler-service_log_group_name             = module.cloudwatch.scheduler-service_log_group_name
  scheduler_service_security_group_id          = module.vpc.scheduler_service_security_group_id
  slack_app_token                              = var.slack_app_token
  slack_bot_token                              = var.slack_bot_token
  slack_log_group_name                         = module.cloudwatch.slack_log_group_name
  slack_signing_secret                         = var.slack_signing_secret
  tags                                         = local.tags
  unstructured_api_key                         = var.unstructured_api_key
  unstructured_api_url                         = var.unstructured_api_url
  unstructured_hostname                        = local.hostnames.Unstructured
  unstructured_log_group_name                  = module.cloudwatch.unstructured_log_group_name
  uploader_hostname                            = local.hostnames.Uploader
  uploader_log_group_name                      = module.cloudwatch.uploader_log_group_name
  vpc_id                                       = module.vpc.vpc_id 
  zunou_ai_endpoint                            = var.zunou_ai_endpoint
  zunou_ai_token                               = var.zunou_ai_token
  scaling_api_key                              = var.scaling_api_key
  scaling_allowed_ips                          = var.scaling_allowed_ips
  max_instances                                = var.max_instances
  min_instances                                = var.min_instances
  meet_bot_record_video                        = var.meet_bot_record_video
}

module "elb" {
  source = "./modules/elb"

  calendar-service_hostname = local.hostnames.Calendar-service
  certificate_arn                 = module.certificate_manager.certificate_arn
  environment                     = var.environment
  kestra_hostname                 = local.hostnames.Kestra
  load_balancer_security_group_id = module.ec2.load_balancer_security_group_id
  meet-bot_hostname               = local.hostnames.Meet-bot
  public_subnet_ids               = module.vpc.public_subnet_ids
  secondary_certificate_arn = module.certificate_manager.secondary_certificate_arn
  scheduler-service_hostname = local.hostnames.Scheduler-service
  tags                            = local.tags
  unstructured_hostname           = local.hostnames.Unstructured
  uploader_hostname               = local.hostnames.Uploader
  vpc_id                          = module.vpc.vpc_id
}

module "kms" {
  source = "./modules/kms"

  environment = var.environment
  tags        = local.tags
}

module "iam" {
  source = "./modules/iam"

  environment                   = var.environment
  calendar-service_log_group_arn          = module.cloudwatch.calendar-service_log_group_arn
  kestra_log_group_arn          = module.cloudwatch.kestra_log_group_arn
  lambda_meet_bot_results_name  = module.lambda.lambda_meet_bot_results_name
  meet-bot_log_group_arn        = module.cloudwatch.meet-bot_log_group_arn
  meet_bot_s3_bucket_arn        = module.s3.s3_meet-bot_bucket_arn
  primary_kms_key_arn           = module.kms.primary_kms_key_arn
  root_domain                   = local.root_domain
  s3_data_sources_bucket_arn    = module.s3.s3_data_sources_bucket_arn
  s3_kestra_bucket_arn          = module.s3.s3_kestra_bucket_arn
  scheduler-service_log_group_arn          = module.cloudwatch.scheduler-service_log_group_arn
  slack_log_group_arn           = module.cloudwatch.slack_log_group_arn
  sqs_csv_data_source_queue_arn = module.sqs.csv_data_source_queue_arn
  sqs_meet_bot_trigger_queue_arn = module.sqs.meet_bot_trigger_queue_arn
  tags                          = local.tags
  unstructured_log_group_arn    = module.cloudwatch.unstructured_log_group_arn
  uploader_log_group_arn        = module.cloudwatch.uploader_log_group_arn
  vpc_rejected_log_group_arn    = module.cloudwatch.vpc_rejected_log_group_arn
  scout_ai_proxy_log_group_arn           = module.cloudwatch.scout_ai_proxy_log_group_arn
  error_log_watcher_dedup_bucket_arn     = data.aws_s3_bucket.error_log_watcher_dedup.arn
  error_log_watcher_source_log_group_arn = local.error_log_watcher_source_log_group_arn
}

module "lambda" {
  source                            = "./modules/lambda"

  aws_region                        = local.aws_region
  ecs_scaler_lambda_role_arn        = module.iam.ecs_scaler_lambda_role_arn
  environment                       = var.environment
  lambda_execution_role_arn         = module.iam.lambda_execution_role_arn
  meet-bot_hostname                 = local.hostnames.Meet-bot
  meet_bot_results_lambda_role_arn  = module.iam.meet_bot_results_lambda_role_arn
  meet_bot_results_queue_url        = module.sqs.meet_bot_results_queue_url

  # Scout AI Proxy Lambda
  scout_ai_proxy_lambda_role_arn    = module.iam.scout_ai_proxy_lambda_role_arn
  scout_ai_proxy_s3_key             = "scout_ai_proxy_lambda_function.zip"
  openai_api_key                    = var.openai_api_key
  auth0_domain                      = local.auth0_domain
  auth0_audience                    = module.auth0.auth0_audience
  assemblyai_api_key                = var.assemblyai_api_key

  # Error-log-watcher (error-assistant) Lambda
  error_log_watcher_execution_role_arn  = module.iam.error_log_watcher_execution_role_arn
  error_log_watcher_s3_key             = var.error_log_watcher_s3_key
  error_log_watcher_source_log_group_name = local.error_log_watcher_source_log_group_name
  error_log_watcher_source_log_group_arn  = local.error_log_watcher_source_log_group_arn
  error_log_watcher_repo_url             = var.error_log_watcher_repo_url
  error_log_watcher_github_app_id       = var.error_log_watcher_github_app_id
  error_log_watcher_github_installation_id = var.error_log_watcher_github_installation_id
  error_log_watcher_github_app_private_key = var.error_log_watcher_github_app_private_key
  error_log_watcher_openai_model        = var.error_log_watcher_openai_model
  error_log_watcher_from_email          = var.error_log_watcher_from_email
  error_log_watcher_default_notification_email = var.error_log_watcher_default_notification_email
}


module "mq" {
  source = "./modules/mq"

  environment                       = var.environment
  default_security_group_id         = module.vpc.default_security_group_id
  ecs_default_security_group_id     = module.vpc.ecs_default_security_group_id
  meet_bot_security_group_id        = module.vpc.meet_bot_security_group_id
  mq_admin_username                 = var.mq_admin_username 
  mq_admin_password                 = var.mq_admin_password 
  mq_consumer_username              = var.mq_consumer_username
  mq_consumer_password              = var.mq_consumer_password
  private_subnet_ids                = module.vpc.private_subnet_ids
  vpc_id                            = module.vpc.vpc_id 
  tags                              = local.tags
}

module "rds" {
  source = "./modules/rds"

  default_security_group_id = module.vpc.default_security_group_id
  environment               = var.environment
  kestra_database_password  = var.kestra_database_password
  primary_kms_key_arn       = module.kms.primary_kms_key_arn
  private_subnet_ids        = module.vpc.private_subnet_ids
  tags                      = local.tags
}

module "route53" {
  source = "./modules/route53"

  aws_ses_dkim_tokens               = module.ses.aws_ses_dkim_tokens
  aws_ses_domain_verification_token = module.ses.aws_ses_domain_verification_token
  domain_validation_options         = module.certificate_manager.domain_validation_options
  environment                       = var.environment
  load_balancer_dns_name            = module.elb.load_balancer_dns_name
  load_balancer_zone_id             = module.elb.load_balancer_zone_id
  origin_domain                     = local.origin_domain
  subdomain                         = local.subdomain
  tags                              = local.tags
}

module "s3" {
  source = "./modules/s3"

  environment                         = var.environment
  tags                                = local.tags
  primary_kms_key_arn                 = module.kms.primary_kms_key_arn
  lambda_meet_bot_results_arn         = module.lambda.lambda_meet_bot_results_arn
  allow_s3_to_call_lambda_results_id  = module.iam.allow_s3_to_call_lambda_results_id
}

module "ses" {
  source = "./modules/ses"

  auth0_email   = local.auth0_email
  environment   = var.environment
  origin_domain = local.origin_domain
  tags          = local.tags
}

module "sqs" {
  source = "./modules/sqs"

  environment = var.environment
  tags        = local.tags
}

module "vpc" {
  source = "./modules/vpc"

  azs                        = local.azs
  environment                = var.environment
  flow_logs_role_arn         = module.iam.flow_logs_role_arn
  load_balancer_security_group_id              = module.ec2.load_balancer_security_group_id
  mq_security_group_id       = module.mq.rabbitmq_security_group_id
  allowed_ips             = var.allowed_ips
  tags                       = local.tags
  vpc_rejected_log_group_arn = module.cloudwatch.vpc_rejected_log_group_arn
}

#-----------------------------------------------------------------------------
# AI Proxy Custom Domain
# Creates: ACM cert (us-east-1), CloudFront distribution, Route53 ALIAS
# This is isolated and does NOT touch any existing Vapor/CloudFront resources
#-----------------------------------------------------------------------------
module "ai_proxy_domain" {
  source = "./modules/ai-proxy-domain"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  ai_proxy_hostname   = "ai-proxy.${local.origin_domain}"
  environment         = var.environment
  lambda_function_url = module.lambda.scout_ai_proxy_lambda_function_url
  route53_zone_id     = data.aws_route53_zone.primary.zone_id
  tags                = local.tags
}
