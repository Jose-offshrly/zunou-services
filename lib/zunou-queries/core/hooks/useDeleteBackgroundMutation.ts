import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Background } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ID } from 'graphql-ws'

interface DeleteBackgroundResponse {
  background: Background
}

const DELETE_BACKGROUND_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteBackground($id: ID!) {
    deleteBackground(id: $id) {
      id
    }
  }
`)

export const useDeleteBackgroundMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<DeleteBackgroundResponse, Error, ID> => {
  const { user, getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (backgroundId: ID) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteBackgroundResponse>(
        DELETE_BACKGROUND_MUTATION,
        {
          id: backgroundId,
        },
      )
    },
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: ['backgrounds', user?.id],
      })
    },
  })
}
