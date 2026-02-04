all: buildx login deploy
all-stg: buildx login deploy-stg
all-prod: buildx login deploy-prod

buildx:
	docker buildx build --platform linux/amd64 -t calendar-service .

build:
	docker build -t calendar-service .

deploy:
	docker tag calendar-service:latest 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com/calendar-service:latest
	docker push 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com/calendar-service:latest
	aws ecs update-service --cluster primary-development --service calendar-service-development --force-new-deployment

deploy-stg:
	docker tag calendar-service:latest 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com/calendar-service:latest
	docker push 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com/calendar-service:latest
	aws ecs update-service --cluster primary-staging --service calendar-service-staging --force-new-deployment

deploy-prod:
	docker tag calendar-service:latest 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com/calendar-service:latest
	docker push 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com/calendar-service:latest
	aws ecs update-service --cluster primary-production --service calendar-service-production --force-new-deployment

clean:

dev: 

login:
	aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin 322607082550.dkr.ecr.ap-northeast-1.amazonaws.com
	
run:
	docker run --rm -p 3000:3000 --env-file .env --name calendar-service calendar-service:latest