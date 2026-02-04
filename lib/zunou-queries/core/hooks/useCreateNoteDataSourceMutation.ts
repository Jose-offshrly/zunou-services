import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateNoteDataSourceInput,
  DataSource,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateNoteDataSourceResponse {
  createNoteDataSource: DataSource
}

const CREATE_NOTE_DATA_SOURCE_MUTATION = graphql(/* GraphQL */ `
  mutation CreateNoteDataSource($input: CreateNoteDataSourceInput!) {
    createNoteDataSource(input: $input) {
      ...DataSourceFragment
    }
  }
`)

export const useCreateNoteDataSourceMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateNoteDataSourceResponse,
  Error,
  CreateNoteDataSourceInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateNoteDataSourceInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateNoteDataSourceResponse>(
        CREATE_NOTE_DATA_SOURCE_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dataSources'],
      })
      queryClient.invalidateQueries({
        queryKey: ['notes'],
      })
    },
  })
}
