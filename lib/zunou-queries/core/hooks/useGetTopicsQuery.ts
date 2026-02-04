import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  TopicEntityType,
  type TopicPaginator,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  topics: TopicPaginator
}

export const GET_TOPICS_QUERY = graphql(/* GraphQL */ `
  query GetTopicsQuery(
    $pulseId: ID!
    $organizationId: ID!
    $type: TopicEntityType
    $page: Int
  ) {
    topics(
      pulseId: $pulseId
      organizationId: $organizationId
      type: $type
      page: $page
    ) {
      data {
        id
        teamThread {
          id
        }
        thread {
          id
        }
        name
        createdBy
        createdAt
        updatedAt
        unreadCount
        creator {
          id
          name
        }
        teamThread {
          id
        }
        teamMessages {
          id
          content
          createdAt
          user {
            id
            name
            gravatar
          }
        }
        messages {
          id
          content
          createdAt
          user {
            id
            name
            gravatar
          }
          role
        }
      }
      paginatorInfo {
        count
        currentPage
        hasMorePages
        lastPage
        perPage
        total
      }
    }
  }
`) as TypedDocumentNode<
  QueryResponse,
  { pulseId: string; organizationId: string; page?: number }
>

export const useGetTopics = ({
  coreUrl,
  variables,
  enabled = true,
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    enabled: isAuthenticated && enabled,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_TOPICS_QUERY,
        variables,
      )

      return result
    },
    queryKey: [
      'topics',
      variables?.type === TopicEntityType.Thread ? 'PULSE_CHAT' : 'TEAM_CHAT',
      variables?.pulseId,
      variables?.organizationId,
      variables?.page || 1,
    ],
  })

  return response
}
