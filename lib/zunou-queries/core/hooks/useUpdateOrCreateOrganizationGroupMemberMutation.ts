import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  UpdateOrCreateOrganizationGroupMemberInput,
  UpdateOrganizationGroupMemberMutation,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const MUTATION_DOCUMENT = `
  mutation UpdateOrganizationGroupMember($input: UpdateOrCreateOrganizationGroupMemberInput!) {
    createOrganizationGroupMember(input: $input) {
      id
      role
      user {
        id
        name
        email
      }
      organizationUser {
        id
        jobTitle
        jobDescription
        responsibilities
      }
    }
  }
`

export const useUpdateOrCreateOrganizationGroupMemberMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateOrganizationGroupMemberMutation,
  Error,
  UpdateOrCreateOrganizationGroupMemberInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateOrCreateOrganizationGroupMemberInput) => {
      try {
        const token = await getToken()

        const client = gqlClient(coreUrl, token)
        const response = await client.request(MUTATION_DOCUMENT, { input })

        return response || { createOrganizationGroupMember: null }
      } catch (error) {
        console.error('Error updating organization group member:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizationGroups'],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationGroupMembers'],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulseMembers'],
      })
    },
  })
}
