import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { DataSource, UpdateDataSourceInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateDataSourceResponse {
  updateDataSource: DataSource
}

const UPDATE_DATA_SOURCE_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateDataSource($input: UpdateDataSourceInput!) {
    updateDataSource(input: $input) {
      ...DataSourceFragment
    }
  }
`)

export const useUpdateDataSourceMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateDataSourceResponse,
  Error,
  UpdateDataSourceInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateDataSourceInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateDataSourceResponse>(
        UPDATE_DATA_SOURCE_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'dataSource',
          variables.organizationId,
          variables.pulseId,
          variables.id,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['dataSources', variables.organizationId, variables.pulseId],
      })
    },
  })
}
