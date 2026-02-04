import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  PulseMember,
  UpdatePulseMemberInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdatePulseMemberResponse {
  updatePulseMember: PulseMember
}

const UPDATE_PULSE_MEMBER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdatePulseMember($input: UpdatePulseMemberInput!) {
    updatePulseMember(input: $input) {
      ...PulseMemberFragment
    }
  }
`)

export const useUpdatePulseMemberMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePulseMemberResponse,
  Error,
  UpdatePulseMemberInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePulseMemberInput) => {
      // Validate input before sending the request
      if (!input.pulseMemberId) {
        throw new Error('Pulse member ID is required')
      }

      try {
        const token = await getToken()

        return await gqlClient(
          coreUrl,
          token,
        ).request<UpdatePulseMemberResponse>(UPDATE_PULSE_MEMBER_MUTATION, {
          input,
        })
      } catch (error) {
        console.error('GraphQL mutation error:', error)
        // Rethrow with more context if needed
        if (error instanceof Error) {
          throw new Error(`Failed to update pulse member: ${error.message}`)
        }
        throw error
      }
    },
    onSuccess: ({ updatePulseMember }) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationGroups', updatePulseMember.pulseId],
      })

      // Update the pulseMembers query cache if needed
      queryClient.setQueryData(
        ['pulseMembers', updatePulseMember.pulseId],
        (oldData: PulseMember[]) => {
          if (!oldData) return oldData

          const newData = JSON.parse(JSON.stringify(oldData))
          const memberIndex = newData.findIndex(
            (member: PulseMember) => member.id === updatePulseMember.id,
          )

          if (memberIndex !== -1) {
            newData[memberIndex] = updatePulseMember
          }

          return newData
        },
      )

      // Update specific pulseMember query
      queryClient.setQueryData(
        ['pulseMember', updatePulseMember.pulseId, updatePulseMember.userId],
        { pulseMember: updatePulseMember },
      )
    },
  })
}
