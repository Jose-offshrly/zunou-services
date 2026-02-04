import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { DataSource, DeleteDataSourceInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteDataSourceResponse {
  deleteDataSource: DataSource
}

const DELETE_DATA_SOURCE_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteDataSource($input: DeleteDataSourceInput!) {
    deleteDataSource(input: $input) {
      ...DataSourceFragment
    }
  }
`)

export const useDeleteDataSourceMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteDataSourceResponse,
  Error,
  DeleteDataSourceInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteDataSourceInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteDataSourceResponse>(
        DELETE_DATA_SOURCE_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['dataSources'],
      })
      queryClient.invalidateQueries({
        queryKey: ['dataSource', variables.id, variables.organizationId],
      })
    },
  })
}
