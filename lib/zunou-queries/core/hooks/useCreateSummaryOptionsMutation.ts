import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateSummaryOptionsInput, Message } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateSummaryOptionsResponse {
  createSummaryOptions: Message
}

const CREATE_SUMMARY_OPTIONS_MUTATION = graphql(/* GraphQL */ `
  mutation CreateSummaryOptions($input: CreateSummaryOptionsInput!) {
    createSummaryOptions(input: $input) {
      ...MessageFragment
    }
  }
`)

export const useCreateSummaryOptionsMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateSummaryOptionsResponse,
  Error,
  CreateSummaryOptionsInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSummaryOptionsInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateSummaryOptionsResponse>(
        CREATE_SUMMARY_OPTIONS_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['summaryOptions'],
      })
    },
  })
}
