resource "null_resource" "slack_app" {

  triggers = {
    always_run = "${timestamp()}"
  }

  provisioner "local-exec" {
    command = "curl -XPOST -H \"Authorization: Bearer ${var.access_token}\" -H \"Content-type: application/json\" -d '${local.template}' https://slack.com/api/apps.manifest.update"
  }
}
