all: clean format test

build:
	./node_modules/.bin/tsc
	./node_modules/.bin/tsc-alias

clean:
	rm -Rf dist node_modules/.cache

dev: build serve

make docker-prepare:
	# We have to jump through a few hoops to copy in the monorepo packages and shared libraries:
	mkdir -p tmp/lib/
	cp -R ../../package.json 			tmp/lib/
	cp -R ../../yarn.lock 				tmp/lib/
	cp -R ../../lib/zunou-graphql tmp/lib/zunou-graphql
	cp -R ../../lib/zunou-queries tmp/lib/zunou-queries

docker: docker-prepare
	docker build -t zunou-slack .
	rm -Rf tmp/lib

docker-run: docker
	docker run \
		-e AUTH0_AUDIENCE=${AUTH0_AUDIENCE} \
		-e AUTH0_DOMAIN=${AUTH0_DOMAIN} \
		-e AUTH0_M2M_CLIENT_ID=${AUTH0_M2M_CLIENT_ID} \
		-e AUTH0_M2M_CLIENT_SECRET=${AUTH0_M2M_CLIENT_SECRET} \
		-e CORE_GRAPHQL_URL=${CORE_GRAPHQL_URL} \
		-e LOG_LEVEL=${LOG_LEVEL} \
		-e PULSE_DOMAIN=${PULSE_DOMAIN} \
		-e SLACK_APP_TOKEN=${SLACK_APP_TOKEN} \
		-e SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN} \
		-e SLACK_LISTEN_COMMAND=${SLACK_LISTEN_COMMAND} \
		-e SLACK_SIGNING_SECRET=${SLACK_SIGNING_SECRET} \
		-it \
		zunou-slack

.PHONY: format
format: prettier-fix lint-fix unused build

lint:
	node_modules/.bin/eslint --config=../../eslint.config.js .

.PHONY: lint-fix
lint-fix:
	node_modules/.bin/eslint --config=../../eslint.config.js . --fix

prettier:
	./node_modules/.bin/prettier --write "**/*.{j,t}s"

.PHONY: prettier-fix
prettier-fix:
	./node_modules/.bin/prettier --write "**/*.{j,t}s"

serve:
	node dist/services/slack/src/app.js

test:
	./node_modules/.bin/jest

unused:
	./node_modules/.bin/ts-unused-exports ./tsconfig.json
