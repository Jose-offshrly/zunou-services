build:
	bun tsc
	node_modules/.bin/vite build

clean:
	rm -Rf dist

dev:
	bunx --bun vite

format: prettier-fix lint-fix unused build

lint:
	node_modules/.bin/eslint .

lint-fix:
	node_modules/.bin/eslint . --fix

prettier:
	./node_modules/.bin/prettier --check .

prettier-fix:
	./node_modules/.bin/prettier --write .

preview:
	vite preview

unused:
	./node_modules/.bin/ts-unused-exports ./tsconfig.json
