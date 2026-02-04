import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Summary } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  summary: Summary
}

const getSummaryQueryDocument = graphql(/* GraphQL */ `
  query getSummary($summaryId: String!) {
    summary(summaryId: $summaryId) {
      ...SummaryFragment
    }
  }
`)

export const useGetSummaryQuery = ({
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
        getSummaryQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['summary', variables?.summaryId],
  })
}
