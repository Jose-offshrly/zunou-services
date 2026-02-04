## Slack Infrastructure

Slack doesn't provide proper Terraform support for setting up apps. This approach is based on [this blog post](https://qiita.com/study_wars/items/e76e271defa53383beab).

Note that **THE TOKEN EXPIRES EVERY TWELVE HOURS**. We can't run this like a normal Terraform workspace - we'll have to disable it when not in use.

### Updating an app

We haven't set up Terraform Cloud for this - you can run it locally, since state is irrelevant.

1. Go to [Managing configuration tokens ](https://api.slack.com/reference/manifests#config-tokens), and create a new token.
2. Add your new token to `terraform.tfvars.json`, and **MAKE SURE TO SET THE RIGHT ENVIRONMENT THERE TOO**.
3. Run `terraform apply`, and type `yes`.

### Creating a new app

Change the `apps.manifest.update` command in `main.tf` to `apps.manifest.create`.

Your new app will be listed at https://api.slack.com/apps
