import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Thread } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  activeThread: Thread
}

const getActiveThreadQueryDocument = graphql(/* GraphQL */ `
  query GetActiveThread(
    $pulseId: String!
    $organizationId: String!
    $type: ThreadType!
  ) {
    activeThread(
      organizationId: $organizationId
      pulseId: $pulseId
      type: $type
    ) {
      ...ThreadFragment
    }
  }
`)

export const useGetActiveThreadQuery = ({
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
        getActiveThreadQueryDocument,
        variables,
      )

      return result
    },
    queryKey: [
      'activeThread',
      variables?.pulseId,
      variables?.organizationId,
      variables?.type,
    ],
  })

  return response
}
