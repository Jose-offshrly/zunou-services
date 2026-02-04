import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { OrganizationGroup } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteOrganizationGroupResponse {
  deleteOrganizationGroup: OrganizationGroup
}

// const DELETE_ORGANIZATION_GROUP_MUTATION = graphql(/* GraphQL */ `
//   mutation DeleteOrganizationGroup($id: ID!) {
//     deleteOrganizationGroup(id: $id) {
//       ...OrganizationGroupFragment
//     }
//   }
// `)

// Temporarily define graphql as plain string due to blocker
const DELETE_ORGANIZATION_GROUP_MUTATION = `
  mutation DeleteOrganizationGroup($id: ID!) {
    deleteOrganizationGroup(id: $id) {
      pulse {
        id
      }
    }
  }
`

export const useDeleteOrganizationGroupMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteOrganizationGroupResponse,
  Error,
  { id: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteOrganizationGroupResponse>(
        DELETE_ORGANIZATION_GROUP_MUTATION,
        {
          id,
        },
      )
    },
    onSuccess: ({ deleteOrganizationGroup }) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationGroups', deleteOrganizationGroup.pulse.id],
      })
    },
  })
}
