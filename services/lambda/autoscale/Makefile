# Define variables
BUCKET_NAME := pulse-lambda-code
ZIP_FILE := ecs_service_scaler.zip

# Define function names per environment
FUNCTION_DEV := ecs-service-scaler-development
FUNCTION_STG := ecs-service-scaler-staging
FUNCTION_PROD := ecs-service-scaler-production

# Default environment (can be overridden)
ENV := dev
FUNCTION_NAME := $(FUNCTION_DEV)

ifeq ($(ENV),stg)
    FUNCTION_NAME := $(FUNCTION_STG)
endif

ifeq ($(ENV),prod)
    FUNCTION_NAME := $(FUNCTION_PROD)
endif

# Deploy the Lambda function
deploy-dev:
	@$(MAKE) deploy ENV=dev

deploy-stg:
	@$(MAKE) deploy ENV=stg

deploy-prod:
	@$(MAKE) deploy ENV=prod

deploy: zip upload update
	@echo "✅ Deployment to $(ENV) complete!"

# Step 1: Zip the Lambda function
zip:
	@echo "📦 Zipping Lambda function..."
	zip -r $(ZIP_FILE) index.js node_modules/

# Step 2: Upload to S3
upload: zip
	@echo "📤 Uploading to S3..."
	aws s3 cp $(ZIP_FILE) s3://$(BUCKET_NAME)/

# Step 3: Update Lambda function
update: upload
	@echo "🚀 Updating Lambda function $(FUNCTION_NAME)..."
	aws lambda update-function-code \
	    --function-name $(FUNCTION_NAME) \
	    --s3-bucket $(BUCKET_NAME) \
	    --s3-key $(ZIP_FILE)

# Clean up the ZIP file
clean:
	@echo "🧹 Cleaning up..."
	rm -f $(ZIP_FILE)