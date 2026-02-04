BUNX ?= bunx

dev:
	php artisan lighthouse:clear-cache
	php artisan cache:clear
	php artisan config:clear
	php artisan serve

deploy-production:
	./vendor/bin/vapor team:switch --id 55649
	./vendor/bin/vapor deploy production

deploy-staging:
	./vendor/bin/vapor team:switch --id 55649
	./vendor/bin/vapor deploy staging

env-pull-production:
	./vendor/bin/vapor env:pull production

env-pull-staging:
	./vendor/bin/vapor env:pull staging

env-push-production:
	./vendor/bin/vapor env:push production

env-push-staging:
	./vendor/bin/vapor env:push staging

format: prettier-fix lint-fix

lint:
	$(BUNX) eslint --config=../../eslint.config.js .
	./vendor/bin/phplint .

lint-fix:
	$(BUNX) eslint --config=../../eslint.config.js . --fix
	PHP_CS_FIXER_IGNORE_ENV=true ./vendor/bin/php-cs-fixer fix

prettier:
	$(BUNX) prettier --check "**/*.php"
	$(BUNX) prettier --check .

prettier-fix:
	$(BUNX) prettier --write "**/*.php"
	$(BUNX) prettier --write .

migrate:
	php artisan migrate

rollback:
	php artisan migrate:rollback --step=1

schedule:
	php artisan schedule:run

seed:
	php artisan db:seed

work:
	php artisan queue:work --queue=default,high,mail --timeout=3600

jumpbox:
	ssh -i ~/.ssh/zunou-vapor-jumpbox.pem ec2-user@54.64.15.105