import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Pulse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  unreadTeamMessages: Pulse[]
}

const getUnreadTeamMessagesQueryDocument = graphql(/* GraphQL */ `
  query GetUnreadTeamMessages($organizationId: String!) {
    unreadTeamMessages(organizationId: $organizationId) {
      id
      name
      unread_team_messages {
        id
        content
        createdAt
        user {
          id
          name
          picture
          gravatar
        }
      }
    }
  }
`)

export const useGetUnreadTeamMessagesQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getUnreadTeamMessagesQueryDocument,
        variables,
      )

      return result
    },
    queryKey: ['unreadTeamMessages', variables?.organizationId],
  })

  return response
}
