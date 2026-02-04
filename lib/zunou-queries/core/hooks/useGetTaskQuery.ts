import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Task } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  task: Task
}

const getTaskQueryDocument = graphql(/* GraphQL */ `
  query GetTask($taskId: String!) {
    task(taskId: $taskId) {
      ...TaskFragment
    }
  }
`)

export const useGetTaskQuery = ({
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
        getTaskQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['tasks', variables?.taskId],
    retry: false,
  })
}
