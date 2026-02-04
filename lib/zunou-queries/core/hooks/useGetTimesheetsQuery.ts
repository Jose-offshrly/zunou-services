import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Timesheet } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

export interface GetTimesheetsResponse {
  timesheets: Timesheet[]
}

const getTimesheetsQueryDocument = graphql(/* GraphQL */ `
  query GetTimesheets($userId: String, $dateRange: DateRangeInput) {
    timesheets(userId: $userId, dateRange: $dateRange) {
      id
      checked_in_at
      checked_out_at
      user {
        name
      }
      total
    }
  }
`)

export const useGetTimesheetsQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<GetTimesheetsResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()
      const result = await gqlClient(
        coreUrl,
        token,
      ).request<GetTimesheetsResponse>(getTimesheetsQueryDocument, variables)
      return result
    },
    queryKey: ['timesheets', variables?.userId, variables?.dateRange],
  })
}
