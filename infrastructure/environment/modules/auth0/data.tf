data "auth0_client" "auth0_actions" {
  client_id = auth0_client.auth0_actions.id
}

data "auth0_client" "m2m" {
  client_id = auth0_client.m2m.id
}

data "auth0_client" "primary" {
  client_id = auth0_client.primary.id
}
