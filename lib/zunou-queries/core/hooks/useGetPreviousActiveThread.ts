import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Thread } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  previousActiveThread: Thread
}

const getPreviousActiveThreadQueryDocument = graphql(/* GraphQL */ `
  query GetPreviousActiveThread($pulseId: ID!, $organizationId: ID!) {
    previousActiveThread(pulseId: $pulseId, organizationId: $organizationId) {
      ...ThreadFragment
    }
  }
`)

export const useGetPreviousActiveThreadQuery = ({
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
        getPreviousActiveThreadQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['previousThread', variables?.pulseId, variables?.organizationId],
  })

  return response
}
