import { useQuery } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { DirectMessageThread } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  directMessages: DirectMessageThread[]
}

const GET_DIRECT_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query getDirectMessages($organizationId: String!) {
    directMessages(organizationId: $organizationId) {
      id
      createdAt
      unreadCount
      otherParticipant {
        id
        name
        gravatar
        presence
      }
      directMessages {
        id
        content
        createdAt
        isRead
        sender {
          id
          name
          gravatar
          presence
        }
      }
    }
  }
`)

export const useGetDirectMessagesQuery = ({
  coreUrl,
  organizationId,
  enabled = true,
}: QueryOptions & {
  organizationId: string
  enabled?: boolean
}) => {
  const { getToken } = useAuthContext()

  return useQuery({
    enabled: !!organizationId && enabled,
    queryFn: async () => {
      const token = await getToken()

      const response = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_DIRECT_MESSAGES_QUERY,
        {
          organizationId,
        },
      )

      return response.directMessages || []
    },
    queryKey: ['directMessages', organizationId],
  })
}
