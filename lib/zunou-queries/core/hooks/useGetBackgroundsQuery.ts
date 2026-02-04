import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Background, PaginatorInfo } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  backgrounds: {
    data: Background[]
    paginationInfo: PaginatorInfo
  }
}

const getBackgroundsQueryDocument = graphql(/* GraphQL */ `
  query getBackgrounds(
    $userId: String!
    $organizationId: String!
    $active: Boolean
  ) {
    backgrounds(
      userId: $userId
      organizationId: $organizationId
      active: $active
    ) {
      data {
        ...BackgroundFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetBackgroundsQuery = ({
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
        getBackgroundsQueryDocument,
        variables,
      )

      return result
    },
    queryKey: ['backgrounds', variables?.userId, variables?.organizationId],
  })
  if (response.error) {
    console.error('Error fetching meetings:', response.error)
  }

  return response
}
