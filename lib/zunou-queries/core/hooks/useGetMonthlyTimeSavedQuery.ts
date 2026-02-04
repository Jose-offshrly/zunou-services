import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { TimeSavedDataPoint } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  monthlyTimeSaved: TimeSavedDataPoint[]
}

const getMonthlyTimeSavedQueryDocument = graphql(/* GraphQL */ `
  query GetMonthlyTimeSaved($organizationId: String!, $pulseId: String!) {
    monthlyTimeSaved(organizationId: $organizationId, pulseId: $pulseId) {
      time
      month
      year
    }
  }
`)

export const useGetMonthlyTimeSavedQuery = ({
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
        getMonthlyTimeSavedQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'monthlyTimeSaved',
      variables?.organizationId,
      variables?.month,
      variables?.year,
    ],
  })

  return response
}
