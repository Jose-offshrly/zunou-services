import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteOrganizationUserResponse {
  deleteOrganizationUser: boolean
}

const DELETE_ORGANIZATION_USER_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteOrganizationUser($organizationUserId: ID!) {
    deleteOrganizationUser(organizationUserId: $organizationUserId)
  }
`)

export const useDeleteOrganizationUserMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteOrganizationUserResponse,
  Error,
  { organizationUserId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      organizationUserId,
    }: {
      organizationUserId: string
    }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteOrganizationUserResponse>(
        DELETE_ORGANIZATION_USER_MUTATION,
        {
          organizationUserId,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organizationUsers'],
      })
    },
  })
}
