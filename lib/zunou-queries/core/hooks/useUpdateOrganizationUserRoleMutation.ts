import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OrganizationUser,
  UpdateOrganizationUserRoleInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateOrganizationUserRoleResponse {
  updateOrganizationUserRole: OrganizationUser
}

const UPDATE_ORGANIZATION_USER_ROLE_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateOrganizationUserRole(
    $input: UpdateOrganizationUserRoleInput!
  ) {
    updateOrganizationUserRole(input: $input) {
      id
      userId
      role
    }
  }
`)

export const useUpdateOrganizationUserRoleMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateOrganizationUserRoleResponse,
  Error,
  UpdateOrganizationUserRoleInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateOrganizationUserRoleInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<UpdateOrganizationUserRoleResponse>(
        UPDATE_ORGANIZATION_USER_ROLE_MUTATION,
        { input },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'organizationUser',
          variables.organizationId,
          variables.userId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationUsers', variables?.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationUser', variables?.organizationId],
      })
    },
  })
}
