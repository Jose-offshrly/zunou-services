#!/bin/bash
set -e

echo "Initializing AWS resources in LocalStack..."

# S3 buckets
awslocal s3api create-bucket --bucket meet-bot-local
awslocal s3api create-bucket --bucket pulse-lambda-code

# DynamoDB table (with both GSIs for local development)
awslocal dynamodb create-table \
    --table-name meet-bot-local \
    --attribute-definitions AttributeName=meeting_id,AttributeType=S \
        AttributeName=organization_id,AttributeType=S \
        AttributeName=user_id,AttributeType=S \
        AttributeName=status,AttributeType=S \
        AttributeName=last_heartbeat,AttributeType=S \
    --key-schema AttributeName=meeting_id,KeyType=HASH \
    --global-secondary-indexes 'IndexName=org_user_index,KeySchema=[{AttributeName=organization_id,KeyType=HASH},{AttributeName=user_id,KeyType=RANGE}],Projection={ProjectionType=ALL}' 'IndexName=status_index,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=last_heartbeat,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
    --billing-mode PAY_PER_REQUEST

# SQS Queues
awslocal sqs create-queue --queue-name meet-bot-trigger-local # deprecated?
awslocal sqs create-queue --queue-name meet-bot-results-local

# Lambdas
awslocal lambda create-function \
    --function-name MeetBotTrigger-local \
    --runtime nodejs22.x \
    --zip-file fileb:///lambda/meetbot_trigger_lambda_function.zip \
    --handler index.handler \
    --role arn:aws:iam::000000000000:role/lambda-role

awslocal lambda create-function \
    --function-name MeetBotResults-local \
    --runtime nodejs22.x \
    --zip-file fileb:///lambda/meetbot_results_lambda_function.zip \
    --handler index.handler \
    --role arn:aws:iam::000000000000:role/lambda-role

echo "AWS resource initialization completed."
