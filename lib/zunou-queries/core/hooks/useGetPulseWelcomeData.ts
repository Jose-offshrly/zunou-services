import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { PulseWelcomeData } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  pulseWelcomeData: PulseWelcomeData
}

const getPulseWelcomeDataQueryDocument = graphql(/* GraphQL */ `
  query GetPulseWelcomeData($pulseId: String!, $userId: String!) {
    pulseWelcomeData(pulseId: $pulseId, userId: $userId) {
      ...PulseWelcomeDataFragment
    }
  }
`)

export const useGetPulseWelcomeData = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()
      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getPulseWelcomeDataQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['pulseWelcomeData', variables?.pulseId, variables?.userId],
  })
}
