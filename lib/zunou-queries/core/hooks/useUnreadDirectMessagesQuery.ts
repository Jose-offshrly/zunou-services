import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { User } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface SimpleThreadInfo {
  id: string
  organizationId: string
  unreadCount: number
}

interface UserWithThread extends Omit<User, 'directMessageThreads'> {
  directMessageThreads?: SimpleThreadInfo[]
}

interface UnreadDirectMessagesResponse {
  unreadDirectMessages: UserWithThread[]
}

interface UnreadDirectMessagesVariables {
  organizationId: string
}

const UNREAD_DIRECT_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query UnreadDirectMessages($organizationId: String!) {
    unreadDirectMessages(organizationId: $organizationId) {
      id
      name
      email
      gravatar
      presence
      directMessageThreads {
        id
        organizationId
        unreadCount
      }
      unread_direct_messages {
        id
        directMessageThreadId
        content
        createdAt
        isRead
      }
    }
  }
`) as TypedDocumentNode<
  UnreadDirectMessagesResponse,
  UnreadDirectMessagesVariables
>

export const useUnreadDirectMessages = ({
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

      const response = await gqlClient(
        coreUrl,
        token,
      ).request<UnreadDirectMessagesResponse>(UNREAD_DIRECT_MESSAGES_QUERY, {
        organizationId,
      })

      return response.unreadDirectMessages || []
    },
    queryKey: ['unreadDirectMessages', organizationId],
  })
}
