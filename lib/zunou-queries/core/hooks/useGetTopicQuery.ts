import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Topic } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ID } from 'graphql-ws'

interface QueryResponse {
  topic: Topic
}

const getTopicQueryDocument = graphql(/* GraphQL */ `
  query GetTopic($topicId: ID!) {
    topic(topicId: $topicId) {
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
  }
`) as TypedDocumentNode<QueryResponse, { topicId: ID }>

export const useGetTopic = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getTopicQueryDocument,
        variables,
      )

      return result
    },
    queryKey: ['topic', variables?.topicId],
  })

  return response
}
