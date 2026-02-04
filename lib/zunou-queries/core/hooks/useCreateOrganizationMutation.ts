import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateOrganizationInput,
  Organization,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateOrganizationResponse {
  createOrganization: Organization
}

const CREATE_ORGANIZATION_MUTATION = graphql(/* GraphQL */ `
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      ...OrganizationFragment
    }
  }
`)

export const useCreateOrganizationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateOrganizationResponse,
  Error,
  CreateOrganizationInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateOrganizationResponse>(
        CREATE_ORGANIZATION_MUTATION,
        {
          input,
        },
      )
    },
  })
}
