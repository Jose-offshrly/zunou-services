import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { AiAgent } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GetAiAgentQueryResponse {
  aiAgent: AiAgent
}

const getAiAgentQueryDocument = graphql(/* GraphQL */ `
  query GetAiAgent(
    $aiAgentId: String!
    $organizationId: String!
    $pulseId: String!
  ) {
    aiAgent(
      aiAgentId: $aiAgentId
      organizationId: $organizationId
      pulseId: $pulseId
    ) {
      ...AiAgentFragment
    }
  }
`)

export const useGetAiAgentQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<GetAiAgentQueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = gqlClient(coreUrl, token).request<GetAiAgentQueryResponse>(
        getAiAgentQueryDocument,
        variables,
      )

      return result
    },
    queryKey: ['ai-agent', variables?.aiAgentId],
  })

  return response
}
