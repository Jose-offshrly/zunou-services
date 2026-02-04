import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OrganizationUser,
  PinOrganizationUserInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface PinOrganizationUserResponse {
  data: {
    pinOrganizationUser: OrganizationUser
  }
}

const PIN_ORGANIZATION_USER_MUTATION_DOCUMENT = graphql(`
  mutation PinOrganizationUser($input: PinOrganizationUserInput!) {
    pinOrganizationUser(input: $input) {
      ...OrganizationUserFragment
    }
  }
`)

export const usePinOrganizationUserMutation = ({
  coreUrl,
}: MutationOptions) => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PinOrganizationUserInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<PinOrganizationUserResponse>(
        PIN_ORGANIZATION_USER_MUTATION_DOCUMENT,
        { input },
      )
    },

    onError: (error) => {
      console.error('Error pinning organization user:', error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationUsers'] })
    },
  })
}
