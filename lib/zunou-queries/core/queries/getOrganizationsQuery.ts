import { graphql } from '@zunou-graphql/core/gql'
import { Organization } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

interface QueryResponse {
  organizations: {
    data: Organization[]
  }
}

const GET_ORGANIZATIONS_QUERY = graphql(/* GraphQL */ `
  query OrganizationsQuery($name: String, $slackTeamId: String) {
    organizations(name: $name, slackTeamId: $slackTeamId) {
      data {
        ...OrganizationFragment
      }
    }
  }
`)

export const getOrganizationsQuery = async (
  endpoint: string,
  token: string | null,
  variables: { name?: string; slackTeamId?: string },
) => {
  const data = await gqlClient(endpoint, token).request<QueryResponse>(
    GET_ORGANIZATIONS_QUERY,
    variables,
  )

  return data
}
