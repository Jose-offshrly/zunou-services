import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  Organization,
  UpdateOrganizationInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateOrganizationResponse {
  updateOrganization: Organization
}

const UPDATE_ORGANIZATION_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      ...OrganizationFragment
    }
  }
`)

export const useUpdateOrganizationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateOrganizationResponse,
  Error,
  UpdateOrganizationInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateOrganizationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateOrganizationResponse>(
        UPDATE_ORGANIZATION_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organization', variables.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['organizationLogo', variables.organizationId],
      })
    },
  })
}
