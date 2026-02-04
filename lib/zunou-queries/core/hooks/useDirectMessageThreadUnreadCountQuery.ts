import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

// The paginator does not have unreadCount, so we can't get it from this mutation
// This hook will always return 0 for now, or you can refactor to use another query

const getDirectMessageThreadDocument = graphql(/* GraphQL */ `
  mutation GetDirectMessageThreadUnreadCount(
    $input: DirectMessageThreadPaginationInput!
  ) {
    getOrCreateDirectMessageThread(input: $input) {
      threadId
      # No unreadCount available here
    }
  }
`) as TypedDocumentNode<
  { getOrCreateDirectMessageThread: { threadId: string } },
  { input: { organizationId: string; receiverId: string; page?: number } }
>

export const useDirectMessageThreadUnreadCount = ({
  coreUrl,
  organizationId,
  receiverId,
  enabled = true,
}: QueryOptions & {
  organizationId: string
  receiverId: string
  enabled?: boolean
}) => {
  const { getToken } = useAuthContext()

  return useQuery({
    enabled: !!organizationId && !!receiverId && enabled,
    queryFn: async () => {
      const token = await getToken()

      // This mutation no longer returns unreadCount
      await gqlClient(coreUrl, token).request(getDirectMessageThreadDocument, {
        input: {
          organizationId,
          receiverId,
        },
      })
      // Always return 0 for now
      return 0
    },
    queryKey: ['directMessageThreadUnreadCount', organizationId, receiverId],
    refetchOnWindowFocus: false,
  })
}
