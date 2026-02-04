import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { SavedMessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  savedMessages: SavedMessagePaginator
}

const getSavedMessagesQueryDocument = graphql(/* GraphQL */ `
  query GetSavedMessages(
    $userId: ID!
    $organizationId: String
    $pulseId: String
  ) {
    savedMessages(
      userId: $userId
      organizationId: $organizationId
      pulseId: $pulseId
    ) {
      data {
        ...SavedMessageFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetSavedMessagesQuery = ({
  coreUrl,
  enabled,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const isEnabled = isAuthenticated && enabled

  const response = useQuery({
    ...options,
    enabled: isEnabled,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getSavedMessagesQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'savedMessages',
      variables?.userId,
      variables?.organizationId,
      variables?.pulseId,
    ],
  })

  return response
}
