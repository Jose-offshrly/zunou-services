build:
	./node_modules/.bin/tsc

clean:
	rm -Rf dist

dev: serve

make docker-prepare:
	# We have to jump through a few hoops to copy in the monorepo packages:
	mkdir -p tmp/lib/
	cp -R ../../package.json tmp/lib/
	cp -R ../../yarn.lock    tmp/lib/

docker: docker-prepare
	docker build -t zunou-uploader .
	rm -Rf tmp/lib

docker-run: docker
	docker run \
		-e COMPANION_GOOGLE_CLOUD_CLIENT_ID=${COMPANION_GOOGLE_CLOUD_CLIENT_ID} \
		-e COMPANION_GOOGLE_CLOUD_CLIENT_SECRET=${COMPANION_GOOGLE_CLOUD_CLIENT_SECRET} \
		-e COMPANION_ONEDRIVE_CLIENT_ID=${COMPANION_ONEDRIVE_CLIENT_ID} \
		-e COMPANION_ONEDRIVE_CLIENT_SECRET=${COMPANION_ONEDRIVE_CLIENT_SECRET} \
		-e COMPANION_SESSION_SECRET=${COMPANION_SESSION_SECRET} \
		-e COMPANION_UPLOAD_URLS=${COMPANION_UPLOAD_URLS} \
		-e COMPANION_URL=${COMPANION_URL} \
		-p 3020:3020 \
		-it \
		zunou-uploader

format: prettier-fix lint-fix unused build

lint:
	node_modules/.bin/eslint --config=../../eslint.config.js .

lint-fix:
	node_modules/.bin/eslint --config=../../eslint.config.js . --fix

prettier:
	./node_modules/.bin/prettier --check .

prettier-fix:
	./node_modules/.bin/prettier --write .

preview:

serve: clean build
	node ./dist/app.js

unused:
	./node_modules/.bin/ts-unused-exports ./tsconfig.json
