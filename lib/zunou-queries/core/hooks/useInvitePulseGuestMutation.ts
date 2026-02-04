import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { InvitePulseGuestInput, User } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface InvitePulseGuestResponse {
  invitePulseGuest: User
}

const INVITE_PULSE_GUEST_MUTATION = graphql(/* GraphQL */ `
  mutation InvitePulseGuest($input: InvitePulseGuestInput!) {
    invitePulseGuest(input: $input) {
      ...UserFragment
    }
  }
`)

export const useInvitePulseGuestMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  InvitePulseGuestResponse,
  Error,
  InvitePulseGuestInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InvitePulseGuestInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<InvitePulseGuestResponse>(
        INVITE_PULSE_GUEST_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: ['pulseMembers', input.pulseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationUsers', input.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulses', input.organizationId],
      })
    },
  })
}
