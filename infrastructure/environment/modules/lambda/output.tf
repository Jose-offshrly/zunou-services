output "ecs_scaler_lambda_arn" {
  value = aws_lambda_function.ecs_scaler.arn
}

output "lambda_meet_bot_results_arn"{
  value = aws_lambda_function.meet_bot_results.arn
}

output "lambda_meet_bot_results_name"{
  value = aws_lambda_function.meet_bot_results.function_name
}

output "scout_ai_proxy_lambda_function_arn" {
  value = aws_lambda_function.scout_ai_proxy.arn
}

output "scout_ai_proxy_lambda_function_name" {
  value = aws_lambda_function.scout_ai_proxy.function_name
}

output "scout_ai_proxy_lambda_function_url" {
  value = aws_lambda_function_url.scout_ai_proxy.function_url
}