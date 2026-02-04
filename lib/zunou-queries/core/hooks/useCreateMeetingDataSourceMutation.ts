import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateMeetingDataSourceInput,
  DataSource,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface AddMeetingResponse {
  createMeetingDataSource: DataSource
}

const createMeetingDataSourceMutation = graphql(/* GraphQL */ `
  mutation CreateMeetingDataSource($input: CreateMeetingDataSourceInput!) {
    createMeetingDataSource(input: $input) {
      ...DataSourceFragment
    }
  }
`)

export const useCreateMeetingDataSourceMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  AddMeetingResponse,
  Error,
  CreateMeetingDataSourceInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMeetingDataSourceInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<AddMeetingResponse>(
        createMeetingDataSourceMutation,
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
        queryKey: ['meetings'],
      })
    },
  })
}
