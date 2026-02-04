import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TaskStatusType } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GetTaskStatusesResponse {
  taskStatuses: TaskStatusType[]
}

interface TaskStatusesQueryVariables {
  pulseId?: string
  defaults?: boolean
}

const getTaskStatusesQueryDocument = graphql(/* GraphQL */ `
  query GetTaskStatuses($pulseId: ID, $defaults: Boolean) {
    taskStatuses(pulseId: $pulseId, defaults: $defaults) {
      id
      pulse_id
      label
      color
      position
      createdAt
      updatedAt
    }
  }
`)

export const useGetTaskStatusesQuery = ({
  coreUrl,
  enabled = true,
  variables,
  ...options
}: QueryOptions & {
  variables?: TaskStatusesQueryVariables
}): UseQueryResult<GetTaskStatusesResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const hasValidVariables =
    (variables?.pulseId || variables?.defaults) &&
    !(variables?.pulseId && variables?.defaults)

  const isEnabled =
    Boolean(enabled ?? true) && isAuthenticated && hasValidVariables

  return useQuery({
    ...options,
    enabled: isEnabled as boolean,
    queryFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GetTaskStatusesResponse>(
        getTaskStatusesQueryDocument,
        variables ?? {},
      )
    },
    queryKey: ['taskStatuses', variables?.pulseId, variables?.defaults],
    retry: false,
  })
}
