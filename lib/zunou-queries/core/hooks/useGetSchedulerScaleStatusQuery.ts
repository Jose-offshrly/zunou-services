import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { SchedulerScaleStatus } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  schedulerScaleStatus: SchedulerScaleStatus
}

const getSchedulerScaleStatusQuery = graphql(/* GraphQL */ `
  query schedulerScaleStatus {
    schedulerScaleStatus {
      running
      active
      pending
      maxInstances
    }
  }
`)

export const useGetSchedulerScaleStatusQuery = ({
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
        getSchedulerScaleStatusQuery,
        variables,
      )

      return result
    },
    queryKey: ['schedulerStatus'],
  })

  return response
}
