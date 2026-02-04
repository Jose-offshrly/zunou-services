import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateDataSourceInput, DataSource } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateDataSourceResponse {
  createDataSource: DataSource
}

const CREATE_DATA_SOURCE_MUTATION = graphql(/* GraphQL */ `
  mutation CreateDataSource($input: CreateDataSourceInput!) {
    createDataSource(input: $input) {
      ...DataSourceFragment
    }
  }
`)

export const useCreateDataSourceMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateDataSourceResponse,
  Error,
  CreateDataSourceInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateDataSourceInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateDataSourceResponse>(
        CREATE_DATA_SOURCE_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dataSources'],
      })
    },
  })
}
