import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface Label {
  id: string
  name: string
  color?: string
}

interface QueryResponse {
  labels: Label[]
}

const getLabelsQueryDocument = graphql(/* GraphQL */ `
  query GetLabels($pulseId: ID!, $viewAll: Boolean) {
    labels(pulseId: $pulseId, viewAll: $viewAll) {
      id
      name
      color
    }
  }
`)

export const useGetNotesLabelsQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated && options.enabled,
    queryFn: async () => {
      const token = await getToken()
      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getLabelsQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['labels', variables?.pulseId, variables?.viewAll],
  })
}
