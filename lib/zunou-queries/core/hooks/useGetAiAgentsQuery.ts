import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { AiAgent } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GetAiAgentsQueryResponse {
  aiAgents: AiAgent[]
}

const getAiAgentsQueryDocument = graphql(/* GraphQL */ `
  query GetAiAgents($organizationId: String!, $pulseId: String!) {
    aiAgents(organizationId: $organizationId, pulseId: $pulseId) {
      ...AiAgentFragment
    }
  }
`)

export const useGetAiAgentsQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<GetAiAgentsQueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = gqlClient(
        coreUrl,
        token,
      ).request<GetAiAgentsQueryResponse>(getAiAgentsQueryDocument, variables)

      return result
    },
    queryKey: ['ai-agents', variables?.organizationId, variables?.pulseId],
  })

  return response
}
