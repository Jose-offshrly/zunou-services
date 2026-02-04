import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Pulse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  pulses: Pulse[]
}

const getPulsesQueryDocument = graphql(/* GraphQL */ `
  query GetPulses($organizationId: String!) {
    pulses(organizationId: $organizationId) {
      ...PulseFragment
    }
  }
`)

export const useGetPulsesQuery = ({
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

      const result = gqlClient(coreUrl, token).request<QueryResponse>(
        getPulsesQueryDocument,
        variables,
      )

      return result
    },
    queryKey: ['pulses', variables?.organizationId],
  })

  return response
}
