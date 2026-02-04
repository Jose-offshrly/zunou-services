import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  pulseMember: PulseMember
}

const getPulseMemberQueryDocument = graphql(/* GraphQL */ `
  query GetPulseMember($pulseId: String!, $userId: String!) {
    pulseMember(pulseId: $pulseId, userId: $userId) {
      ...PulseMemberFragment
    }
  }
`)

export const useGetPulseMemberQuery = ({
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
        getPulseMemberQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['pulseMember', variables?.pulseId, variables?.userId],
  })

  return response
}
