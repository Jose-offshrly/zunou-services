build:
	make -C lib/zunou-queries/ build
	make -C lib/zunou-react/ build
	make -C services/admin/ build
	make -C services/dashboard/ build
	make -C services/pulse/ build
	make -C services/slack/ build
	make -C services/uploader/ build

format:
	./node_modules/.bin/syncpack format
	./node_modules/.bin/syncpack fix-mismatches
	make -C lib/zunou-queries/ format
	make -C lib/zunou-react/ format
	make -C services/admin/ format
	make -C services/api/ format
	make -C services/dashboard/ format
	make -C services/pulse/ format
	make -C services/slack/ format
	make -C services/uploader/ format
	make -C services/pulse/ format

lint:
	make -C lib/zunou-queries/ lint
	make -C lib/zunou-react/ lint
	make -C services/admin/ lint
	make -C services/api/ lint
	make -C services/dashboard/ lint
	make -C services/pulse/ lint
	make -C services/slack/ lint
	make -C services/uploader/ lint
	make -C services/pulse/ lint

open-pr:
	@read -p "PR Title:" TITLE; \
	wrap () { curl -v -d "{\"ref\":\"main\",\"inputs\":{\"personal_token\":\"${GITHUB_TOKEN}\",\"title\":\"$$TITLE\"}}" -H "Accept: application/vnd.github.v3+json" -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json;charset=utf-8" "https://api.github.com/repos/77brainz/zunou-services/actions/workflows/global-create-pull-request.yml/dispatches"; }; wrap

release:
	wrap () { curl -v -d "{\"ref\":\"main\",\"inputs\":{\"personal_token\":\"${GITHUB_TOKEN}\"}}" -H "Accept: application/vnd.github.v3+json" -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json;charset=utf-8" "https://api.github.com/repos/77brainz/zunou-services/actions/workflows/global-create-production-release.yml/dispatches"; }; wrap

stage-release:
	wrap () { curl -v -d "{\"ref\":\"main\",\"inputs\":{\"personal_token\":\"${GITHUB_TOKEN}\"}}" -H "Accept: application/vnd.github.v3+json" -H "Authorization: token ${GITHUB_TOKEN}" -H "Content-Type: application/json;charset=utf-8" "https://api.github.com/repos/77brainz/zunou-services/actions/workflows/global-create-staging-release.yml/dispatches"; }; wrap
