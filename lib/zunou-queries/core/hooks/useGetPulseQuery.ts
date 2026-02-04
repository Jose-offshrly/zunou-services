import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Pulse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  pulse: Pulse
}

const getPulseQueryDocument = graphql(/* GraphQL */ `
  query GetPulse($organizationId: String!, $pulseId: String!) {
    pulse(pulseId: $pulseId, organizationId: $organizationId) {
      id
      name
      icon
      category
      description
      type
      status_option
      team_thread {
        id
      }
      threads {
        id
        type
        savedMessages {
          id
          created_at
          updated_at
          data {
            content
            role
          }
          thread {
            id
            pulse {
              name
            }
          }
        }
      }
    }
  }
`)

export const useGetPulseQuery = ({
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
        getPulseQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['pulse', variables?.organizationId, variables?.pulseId],
  })
}
