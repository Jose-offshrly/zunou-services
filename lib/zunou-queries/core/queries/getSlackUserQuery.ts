import { graphql } from '@zunou-graphql/core/gql'
import { User } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

interface QueryResponse {
  slackUser: User
}

const GET_SLACK_USER_QUERY = graphql(/* GraphQL */ `
  query GetSlackUser($organizationId: String!, $slackId: String!) {
    slackUser(organizationId: $organizationId, slackId: $slackId) {
      ...UserFragment
    }
  }
`)

export const getSlackUserQuery = async (
  endpoint: string,
  token: string | null,
  variables: { organizationId: string; slackId?: string; userId?: string },
) => {
  const data = await gqlClient(endpoint, token).request<QueryResponse>(
    GET_SLACK_USER_QUERY,
    variables,
  )

  return data
}
