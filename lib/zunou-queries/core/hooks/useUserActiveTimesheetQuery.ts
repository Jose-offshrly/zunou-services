import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Timesheet } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  userActiveTimesheet: Timesheet | null
}

const GET_USER_ACTIVE_TIMESHEET = graphql(/* GraphQL */ `
  query UserActiveTimesheet($userId: ID!) {
    userActiveTimesheet(userId: $userId) {
      id
      checked_in_at
      checked_out_at
      userId
      total
    }
  }
`)

export const useUserActiveTimesheetQuery = ({
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
        GET_USER_ACTIVE_TIMESHEET,
        variables,
      )
      return result
    },
    queryKey: ['userActiveTimesheet', variables?.userId],
  })

  return response
}
