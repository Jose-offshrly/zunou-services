import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  pulseMembers: {
    data: PulseMember[]
  }
}

const GET_PULSE_MEMBERS_QUERY = graphql(/* GraphQL */ `
  query GetPulseMembers($pulseId: String!, $page: Int) {
    pulseMembers(pulseId: $pulseId, page: $page) {
      data {
        ...PulseMemberFragment
      }
    }
  }
`)

export const useGetPulseMembersQuery = ({
  coreUrl,
  variables,
  enabled = true,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated && enabled,
    gcTime: 5 * 60 * 1000, // 5 min
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_PULSE_MEMBERS_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['pulseMembers', variables?.pulseId, variables?.page],
    staleTime: 90 * 1000, // 1.5 min (backend cache is 2 min)
  })

  return response
}
