import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  PulseMember,
  PulseMemberRole,
  UpdatePulseMemberRoleInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdatePulseMemberRoleResponse {
  updatePulseMemberRole: PulseMember
}

interface UpdatePulseMemberRoleVariables {
  input: UpdatePulseMemberRoleInput
}

const UPDATE_PULSE_MEMBER_ROLE_MUTATION = graphql(/* GraphQL */ `
  mutation UpdatePulseMemberRole($input: UpdatePulseMemberRoleInput!) {
    updatePulseMemberRole(input: $input) {
      role
    }
  }
`)

export const useUpdatePulseMemberRoleMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePulseMemberRoleResponse,
  Error,
  UpdatePulseMemberRoleVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ input }: UpdatePulseMemberRoleVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdatePulseMemberRoleResponse>(
        UPDATE_PULSE_MEMBER_ROLE_MUTATION,
        { input },
      )
    },
    onSuccess: (_, { input: variables }) => {
      queryClient.invalidateQueries({
        queryKey: ['pulseMembers', variables.pulseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulseMember', variables.pulseId, variables.userId],
      })

      // Invalidate the pulse member queries if transferring the pulse OWNER role
      if (variables.role === PulseMemberRole.Owner) {
        queryClient.invalidateQueries({
          queryKey: ['pulseMember', variables.pulseId],
        })
      }
      queryClient.invalidateQueries({
        queryKey: ['pulses', variables?.organizationId],
      })
    },
  })
}
