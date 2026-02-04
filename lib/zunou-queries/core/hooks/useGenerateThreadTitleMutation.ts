import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GenerateThreadTitleResponse {
  generateThreadTitle: {
    title: string
  }
}

interface GenerateThreadTitleInput {
  threadId: string
}

const GENERATE_THREAD_TITLE_MUTATION = graphql(/* GraphQL */ `
  mutation GenerateThreadTitle($input: GenerateThreadTitleInput!) {
    generateThreadTitle(input: $input) {
      title
    }
  }
`)

export const useGenerateThreadTitleMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GenerateThreadTitleResponse,
  Error,
  GenerateThreadTitleInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: GenerateThreadTitleInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GenerateThreadTitleResponse>(
        GENERATE_THREAD_TITLE_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['threads'],
      })
    },
  })
}
