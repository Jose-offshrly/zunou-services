import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { LiveInsightOutbox } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  liveInsight: LiveInsightOutbox
}

const getLiveInsightQueryDocument = graphql(/* GraphQL */ `
  query GetLiveInsight($id: ID!, $organizationId: ID!) {
    liveInsight(id: $id, organizationId: $organizationId) {
      id
      item_hash
      meeting_id
      meeting {
        id
        meetingId
      }
      pulse_id
      type
      topic
      description
      explanation
      user_id
      delivery_status
      delivered_at
      read_at
      closed_at
      closed_reason
      created_at
      updated_at
      pulse {
        id
        name
      }
      feedback {
        id
        outbox_id
        rating
        comment
      }
      pulse {
        id
        name
      }
      topicThread {
        id
        name
        thread {
          id
        }
      }
    }
  }
`)

export const useGetLiveInsightQuery = ({
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
        getLiveInsightQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['liveInsight', variables?.id],
  })

  return response
}
