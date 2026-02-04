build:
	NODE_OPTIONS="--max-old-space-size=4096" bun tsc
	NODE_OPTIONS="--max-old-space-size=4096" node_modules/.bin/vite build

clean:
	rm -Rf dist

dev:
	bunx --bun vite

format: prettier-fix lint-fix unused build

lint:
	bunx eslint .

lint-fix:
	bunx eslint . --fix

prettier:
	npx prettier --check .

prettier-fix:
	npx prettier --write .

preview:
	vite preview

unused:
	bunx ts-unused-exports ./tsconfig.json
