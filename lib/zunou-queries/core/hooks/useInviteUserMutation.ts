import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { InviteUserInput, User } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface InviteUserResponse {
  inviteUser: [User]
}

const INVITE_USER_MUTATION = graphql(/* GraphQL */ `
  mutation InviteUser($input: [InviteUserInput!]!) {
    inviteUser(input: $input) {
      ...UserFragment
    }
  }
`)

export const useInviteUserMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  InviteUserResponse,
  Error,
  InviteUserInput[]
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InviteUserInput[]) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<InviteUserResponse>(
        INVITE_USER_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['organizationUsers'],
      }),
  })
}
