import { graphql } from '@zunou-graphql/core/gql'
import { SlackCredential } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'

interface QueryResponse {
  slackCredentials: SlackCredential[]
}

const GET_SLACK_CREDENTIALS_QUERY = graphql(/* GraphQL */ `
  query SlackCredentialsQuery($slackTeamId: String!) {
    slackCredentials(slackTeamId: $slackTeamId) {
      organizationId
      slackAccessToken
    }
  }
`)

export const getSlackCredentialsQuery = async (
  endpoint: string,
  token: string | null,
  variables: { slackTeamId?: string },
) => {
  const data = await gqlClient(endpoint, token).request<QueryResponse>(
    GET_SLACK_CREDENTIALS_QUERY,
    variables,
  )

  return data
}
