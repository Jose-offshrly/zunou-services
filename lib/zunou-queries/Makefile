build:
	bun tsc

format: prettier-fix lint-fix build

lint:
	node_modules/.bin/eslint --config=../../eslint.config.js .

lint-fix:
	node_modules/.bin/eslint --config=../../eslint.config.js . --fix

prettier:
	npx prettier --check .

prettier-fix:
	npx prettier --write .

unused:
	./node_modules/.bin/ts-unused-exports ./tsconfig.json
