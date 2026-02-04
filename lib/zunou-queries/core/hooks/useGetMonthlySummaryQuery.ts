import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { MonthlySummary } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  monthlySummary: MonthlySummary[]
}

const getMonthlySummaryQueryDocument = graphql(/* GraphQL */ `
  query GetmonthlySummary(
    $organizationId: String!
    $month: Int!
    $year: Int!
    $pulseId: String!
  ) {
    monthlySummary(
      organizationId: $organizationId
      month: $month
      year: $year
      pulseId: $pulseId
    ) {
      title
      value
      unit
      comparisonValue
      comparison
    }
  }
`)

export const useGetMonthlySummaryQuery = ({
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
        getMonthlySummaryQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'monthlySummary',
      variables?.organizationId,
      variables?.month,
      variables?.year,
      variables?.pulseId,
    ],
  })

  return response
}
