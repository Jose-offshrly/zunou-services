import { graphql } from '@zunou-graphql/core/gql'
import { Agent } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

interface QueryResponse {
  agents: {
    data: Agent[]
  }
}

const GET_AGENTS_QUERY = graphql(/* GraphQL */ `
  query AgentsQuery(
    $name: String
    $organizationId: String!
    $pulseId: String!
  ) {
    agents(name: $name, organizationId: $organizationId, pulseId: $pulseId) {
      data {
        ...AgentFragment
      }
    }
  }
`)

export const getAgentsQuery = async (
  endpoint: string,
  token: string | null,
  variables: { name?: string; slackTeamId?: string },
) => {
  const data = await gqlClient(endpoint, token).request<QueryResponse>(
    GET_AGENTS_QUERY,
    variables,
  )

  return data
}
