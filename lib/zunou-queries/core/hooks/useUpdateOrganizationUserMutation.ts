import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OrganizationUser,
  UpdateOrganizationUserInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateOrganizationUserResponse {
  updateOrganizationUser: OrganizationUser
}

const UPDATE_ORGANIZATION_USER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateOrganizationUser($input: UpdateOrganizationUserInput!) {
    updateOrganizationUser(input: $input) {
      ...OrganizationUserFragment
    }
  }
`)

export const useUpdateOrganizationUserMutation = ({
  coreUrl,
  variables,
}: MutationOptions): UseMutationResult<
  UpdateOrganizationUserResponse,
  Error,
  UpdateOrganizationUserInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateOrganizationUserInput) => {
      // Validate input before sending the request
      if (!input.organizationUserId) {
        throw new Error('Organization user ID is required')
      }

      try {
        const token = await getToken()

        return await gqlClient(
          coreUrl,
          token,
        ).request<UpdateOrganizationUserResponse>(
          UPDATE_ORGANIZATION_USER_MUTATION,
          { input },
        )
      } catch (error) {
        console.error('GraphQL mutation error:', error)
        // Rethrow with more context if needed
        if (error instanceof Error) {
          throw new Error(
            `Failed to update organization user: ${error.message}`,
          )
        }
        throw error
      }
    },
    onSuccess: ({ updateOrganizationUser }) => {
      queryClient.invalidateQueries({
        queryKey: [
          'organizationUser',
          updateOrganizationUser.organizationId,
          updateOrganizationUser.userId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationUsers', updateOrganizationUser.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulses', updateOrganizationUser.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationGroups', variables?.pulseId],
      })
    },
  })
}
