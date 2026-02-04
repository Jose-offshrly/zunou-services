import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { DirectMessageThreadPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

export interface GetPinnedDirectMessagesResponse {
  pinnedDirectMessages: DirectMessageThreadPaginator
}

interface GetPinnedDirectMessagesVariables {
  directMessageThreadId: string
  organizationId: string
  page?: number
}

export const GET_PINNED_DIRECT_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query PinnedDirectMessages(
    $directMessageThreadId: ID!
    $organizationId: ID!
    $page: Int
  ) {
    pinnedDirectMessages(
      directMessageThreadId: $directMessageThreadId
      organizationId: $organizationId
      page: $page
    ) {
      threadId
      data {
        id
        directMessageThreadId
        content
        createdAt
        updatedAt
        isEdited
        deletedAt
        isRead
        isPinned
        repliedToMessageId
        sender {
          id
          name
          email
          gravatar
        }
      }
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`) as TypedDocumentNode<
  GetPinnedDirectMessagesResponse,
  GetPinnedDirectMessagesVariables
>

export const useGetPinnedDirectMessages = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<GetPinnedDirectMessagesResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled:
      isAuthenticated &&
      !!variables?.directMessageThreadId &&
      !!variables?.organizationId,
    queryFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GetPinnedDirectMessagesResponse>(
        GET_PINNED_DIRECT_MESSAGES_QUERY,
        variables,
      )
    },
    queryKey: [
      'pinnedDirectMessages',
      variables?.directMessageThreadId,
      variables?.organizationId,
      variables?.page,
    ],
  })
}
