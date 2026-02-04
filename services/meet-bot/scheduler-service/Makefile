.PHONY: all all-stg all-prod build buildx deploy deploy-stg deploy-prod login run

# Basics
IMAGE := scheduler-service
ECR    := 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com
REPO   := $(ECR)/$(IMAGE)

all: buildx login deploy
all-stg: buildx login deploy-stg
all-prod: buildx login deploy-prod

buildx:
	docker buildx build --platform linux/amd64 -t $(IMAGE):latest .

build:
	docker build -t $(IMAGE):latest .

deploy:  ## development
	docker tag $(IMAGE):latest $(REPO):development-latest
	docker push $(REPO):development-latest
	aws ecs update-service --cluster primary-development --service scheduler-service-development --force-new-deployment

deploy-stg: ## staging
	docker tag $(IMAGE):latest $(REPO):staging-latest
	docker push $(REPO):staging-latest
	aws ecs update-service --cluster primary-staging --service scheduler-service-staging --force-new-deployment

deploy-prod: ## production
	docker tag $(IMAGE):latest $(REPO):production-latest
	docker push $(REPO):production-latest
	aws ecs update-service --cluster primary-production --service scheduler-service-production --force-new-deployment

login:
	aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin $(ECR)

run:
	docker run --rm -p 3000:3000 --env-file .env --name $(IMAGE) $(IMAGE):latest