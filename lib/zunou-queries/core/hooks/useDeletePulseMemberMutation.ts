import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeletePulseMemberResponse {
  deletePulseMember: boolean
}

const DELETE_PULSE_MEMBER_MUTATION = graphql(/* GraphQL */ `
  mutation DeletePulseMember($pulseMemberId: ID!) {
    deletePulseMember(pulseMemberId: $pulseMemberId)
  }
`)

export const useDeletePulseMemberMutation = ({
  coreUrl,
  variables,
}: MutationOptions): UseMutationResult<
  DeletePulseMemberResponse,
  Error,
  { pulseMemberId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pulseMemberId }: { pulseMemberId: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeletePulseMemberResponse>(
        DELETE_PULSE_MEMBER_MUTATION,
        {
          pulseMemberId,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['pulseMembers'],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulses', variables?.organizationId],
      })
    },
  })
}
