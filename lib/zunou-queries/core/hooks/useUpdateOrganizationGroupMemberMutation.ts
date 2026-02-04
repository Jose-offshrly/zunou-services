import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  UpdateOrCreateOrganizationGroupMemberInput,
  UpdateOrganizationGroupMemberMutation,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const UPDATE_ORGANIZATION_GROUP_MEMBER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateOrganizationGroupMember(
    $input: UpdateOrCreateOrganizationGroupMemberInput!
  ) {
    createOrganizationGroupMember(input: $input) {
      ...PulseMemberFragment
    }
  }
`)

export const useUpdateOrganizationGroupMemberMutation = ({
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
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<UpdateOrganizationGroupMemberMutation>(
        UPDATE_ORGANIZATION_GROUP_MEMBER_MUTATION as TypedDocumentNode<
          UpdateOrganizationGroupMemberMutation,
          { input: UpdateOrCreateOrganizationGroupMemberInput }
        >,
        {
          input,
        },
      )
    },
    onError: (error) => {
      console.error('Error updating organization group member:', error)
    },
    onSuccess: (_data, variables) => {
      // Invalidate organization groups query to refresh data
      if (variables.pulseId) {
        queryClient.invalidateQueries({
          queryKey: ['organizationGroups', variables.pulseId],
        })
      }
    },
  })
}
