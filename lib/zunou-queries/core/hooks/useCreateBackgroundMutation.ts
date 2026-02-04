import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Background, CreateBackgroundInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateBackgroundResponse {
  createBackground: Background
}

const CREATE_BACKGROUND_MUTATION = graphql(/* GraphQL */ `
  mutation CreateBackground($input: CreateBackgroundInput!) {
    createBackground(input: $input) {
      ...BackgroundFragment
    }
  }
`)

export const useCreateBackgroundMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateBackgroundResponse,
  Error,
  CreateBackgroundInput
> => {
  const { user, getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBackgroundInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateBackgroundResponse>(
        CREATE_BACKGROUND_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['backgrounds', user?.id],
      })
    },
  })
}
