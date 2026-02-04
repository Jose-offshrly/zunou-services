import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OrganizationGroup,
  UpdateOrganizationGroupInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateOrganizationGroupResponse {
  updateOrganizationGroup: OrganizationGroup
}

const UPDATE_ORGANIZATION_GROUP_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateOrganizationGroup($input: UpdateOrganizationGroupInput!) {
    updateOrganizationGroup(input: $input) {
      ...OrganizationGroupFragment
    }
  }
`)

export const useUpdateOrganizationGroupMutation = ({
  coreUrl,
  variables,
}: MutationOptions): UseMutationResult<
  UpdateOrganizationGroupResponse,
  Error,
  UpdateOrganizationGroupInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateOrganizationGroupInput) => {
      if (!input.id) {
        throw new Error('Organization group ID is required')
      }

      try {
        const token = await getToken()

        const response = await gqlClient(
          coreUrl,
          token,
        ).request<UpdateOrganizationGroupResponse>(
          UPDATE_ORGANIZATION_GROUP_MUTATION,
          { input },
        )

        return response
      } catch (error) {
        console.error('GraphQL mutation error:', error)
        if (error instanceof Error) {
          throw new Error(
            `Failed to update organization group: ${error.message}`,
          )
        }
        throw error
      }
    },
    onSuccess: ({ updateOrganizationGroup }) => {
      queryClient.invalidateQueries({
        queryKey: ['organizationGroup', updateOrganizationGroup.id],
      })

      queryClient.setQueryData(
        ['organizationGroups', variables?.pulseId],
        (oldData: OrganizationGroup[]) => {
          const newData = JSON.parse(JSON.stringify(oldData))
          if (newData.organizationGroups?.organizationGroups) {
            newData.organizationGroups.organizationGroups =
              newData.organizationGroups.organizationGroups.map(
                (group: OrganizationGroup) => {
                  if (group.id === updateOrganizationGroup.id) {
                    return {
                      ...group,
                      ...updateOrganizationGroup,
                      pulseMembers:
                        updateOrganizationGroup.pulseMembers ||
                        group.pulseMembers,
                    }
                  }
                  return group
                },
              )
          }

          return newData
        },
      )
    },
  })
}
