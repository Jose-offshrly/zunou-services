# Define variables
BUCKET_NAME := pulse-lambda-code
ZIP_FILE := error_log_watcher_lambda_function.zip

# Define function names per environment
FUNCTION_DEV := error-log-watcher-development
FUNCTION_STG := error-log-watcher-staging
FUNCTION_PROD := error-log-watcher-production

# Default environment (can be overridden)
ENV := dev
FUNCTION_NAME := $(FUNCTION_DEV)

ifeq ($(ENV),stg)
    FUNCTION_NAME := $(FUNCTION_STG)
endif

ifeq ($(ENV),prod)
    FUNCTION_NAME := $(FUNCTION_PROD)
endif

# Deploy the Lambda function (builds, uploads to S3, and updates Lambda if it exists)
# For initial setup: Run this before Terraform. It will upload to S3 and skip Lambda update gracefully.
# For subsequent deployments: Updates the existing Lambda function.
deploy-dev:
	@$(MAKE) deploy ENV=dev

deploy-stg:
	@$(MAKE) deploy ENV=stg

deploy-prod:
	@$(MAKE) deploy ENV=prod

# Show current AWS identity (useful for debugging)
show-aws-identity:
	@echo "🔍 Current AWS Identity:"
	@aws sts get-caller-identity --output json 2>/dev/null | jq -r '"   User: " + .Arn + "\n   ID: " + .UserId' || echo "   (Could not get identity - check AWS credentials)"

deploy: install zip upload update
	@echo "✅ Deployment to $(ENV) complete!"

# Step 0: Install dependencies
install:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📋 Deployment Info:"
	@echo "   ZIP File: $(ZIP_FILE)"
	@echo "   S3 Bucket: $(BUCKET_NAME)"
	@echo "   S3 Region: $$(aws s3api get-bucket-location --bucket $(BUCKET_NAME) --output text 2>/dev/null || echo 'unknown')"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "👤 AWS Identity:"
	@aws sts get-caller-identity --output json 2>/dev/null | jq -r '"   User: " + .Arn + "\n   User ID: " + .UserId' || echo "   (Could not get identity - check AWS credentials)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📦 Installing dependencies..."
	npm install --omit=dev

# Step 1: Zip the Lambda function
zip: install
	@echo "📦 Zipping Lambda function..."
	zip -r $(ZIP_FILE) index.mjs src package.json node_modules/
	@echo "🔍 Verifying zip contents..."
	@if ! unzip -l $(ZIP_FILE) | grep -q "node_modules/"; then \
	    echo "❌ node_modules not found in zip! Deployment aborted."; \
	    exit 1; \
	else \
	    echo "✅ node_modules included in zip"; \
	fi

# Step 2: Upload to S3
upload: zip
	@echo "📤 Uploading to S3..."
	aws s3 cp $(ZIP_FILE) s3://$(BUCKET_NAME)/

# Step 3: Update Lambda function code
update: upload
	@echo "⚡ Updating Lambda function code..."
	@aws lambda update-function-code \
	    --function-name $(FUNCTION_NAME) \
	    --s3-bucket $(BUCKET_NAME) \
	    --s3-key $(ZIP_FILE)
	@echo "✅ Lambda code updated successfully"

clean:
	@echo "🧹 Cleaning up..."
	rm -f $(ZIP_FILE)
