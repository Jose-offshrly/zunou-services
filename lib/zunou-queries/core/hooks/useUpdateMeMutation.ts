import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { UpdateMeInput, User } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateMeResponse {
  updateMe: User
}

const UPDATE_USER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateMe($input: UpdateMeInput!) {
    updateMe(input: $input) {
      ...UserFragment
      organizationUsers {
        data {
          ...OrganizationUserFragment
        }
      }
    }
  }
`)

export const useUpdateMeMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateMeResponse,
  Error,
  UpdateMeInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateMeInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateMeResponse>(
        UPDATE_USER_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['user'],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulseMembers'],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationUser'],
      })
    },
  })
}
