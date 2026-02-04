import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateOrganizationGroupInput,
  OrganizationGroup,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateOrganizationGroupMutationResponse {
  createOrganizationGroup: OrganizationGroup
}

const createOrganizationGroupMutationDocument = graphql(/* GraphQL */ `
  mutation CreateOrganizationGroup($input: CreateOrganizationGroupInput!) {
    createOrganizationGroup(input: $input) {
      id
      name
      description
      pulse {
        id
      }
      organization {
        id
      }
    }
  }
`)

export const useCreateOrganizationGroupMutation = ({
  coreUrl,
  variables,
}: MutationOptions): UseMutationResult<
  CreateOrganizationGroupMutationResponse,
  Error,
  CreateOrganizationGroupInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateOrganizationGroupInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<CreateOrganizationGroupMutationResponse>(
        createOrganizationGroupMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizationGroups', variables?.pulseId],
      })
    },
  })
}
