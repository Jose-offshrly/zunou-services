build:

clean:

dev:

make docker-prepare:

docker:
	docker build -t kestra-dave .

docker-run: docker
	docker run \
		--rm \
		-it \
		--user=root \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v /tmp:/tmp \
		-e KESTRA_CONFIGURATION="$$(cat kestra.yaml)" \
		-p 8080:8080 \
		kestra-dave \
		server standalone

format:

lint:

lint-fix:

prettier:

prettier-fix:

preview:

serve:

unused:
