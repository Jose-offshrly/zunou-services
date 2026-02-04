import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { LiveInsightRecommendation } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  GetInsightRecommendations: LiveInsightRecommendation[]
}

const getInsightRecommendationsQueryDocument = graphql(/* GraphQL */ `
  query GetInsightRecommendations($id: ID!, $organizationId: ID!) {
    GetInsightRecommendations(id: $id, organizationId: $organizationId) {
      id
      title
      summary
      created_at
      updated_at
      is_executed
      execution_result
      execution_result_data
      executedBy {
        id
        name
        email
        gravatar
      }
      actions {
        id
        type
        method
        data
        status
      }
      relatedTasks {
        id
        title
        similarity_score
        status
      }
      relatedNotes {
        id
        title
        similarity_score
      }
    }
  }
`)

export const useGetInsightRecommendations = ({
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
        getInsightRecommendationsQueryDocument,
        variables,
      )

      return result
    },
    queryKey: ['liveInsightsRecommendation', variables?.id],
  })

  return response
}
