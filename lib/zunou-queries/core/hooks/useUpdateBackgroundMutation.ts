import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Background, UpdateBackgroundInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateBackgroundResponse {
  updateBackground: Background
}

const updateBackgroundMutationDocument = graphql(/* GraphQL */ `
  mutation updateBackground($input: UpdateBackgroundInput!) {
    updateBackground(input: $input) {
      ...BackgroundFragment
    }
  }
`)

export const useUpdateBackgroundMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateBackgroundResponse,
  Error,
  UpdateBackgroundInput
> => {
  const { user, getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateBackgroundInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateBackgroundResponse>(
        updateBackgroundMutationDocument,
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
