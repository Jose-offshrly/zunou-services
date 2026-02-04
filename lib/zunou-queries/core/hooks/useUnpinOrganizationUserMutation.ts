import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  OrganizationUser,
  UnpinOrganizationUserInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UnpinOrganizationUserResponse {
  data: {
    unpinOrganizationUser: OrganizationUser
  }
}

const UNPIN_ORGANIZATION_USER_MUTATION_DOCUMENT = graphql(`
  mutation UnpinOrganizationUser($input: UnpinOrganizationUserInput!) {
    unpinOrganizationUser(input: $input) {
      ...OrganizationUserFragment
    }
  }
`)

export const useUnpinOrganizationUserMutation = ({
  coreUrl,
}: MutationOptions) => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UnpinOrganizationUserInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UnpinOrganizationUserResponse>(
        UNPIN_ORGANIZATION_USER_MUTATION_DOCUMENT,
        { input },
      )
    },

    onError: (error) => {
      console.error('Error unpinning organization user:', error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationUsers'] })
    },
  })
}
