output "auth0_audience" {
  value = auth0_resource_server.api.identifier
}

output "auth0_client_id" {
  value = data.auth0_client.primary.client_id
}

output "auth0_m2m_client_id" {
  value = data.auth0_client.m2m.client_id
}

output "auth0_m2m_client_secret" {
  value = data.auth0_client.m2m.client_secret
}
