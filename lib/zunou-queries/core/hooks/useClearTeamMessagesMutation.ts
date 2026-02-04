import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const CLEAR_TEAM_MESSAGES_MUTATION = graphql(/* GraphQL */ `
  mutation ClearTeamMessages($organizationId: String!) {
    clearTeamMessages(organizationId: $organizationId)
  }
`)

export const useClearTeamMessagesMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<boolean, Error, string> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<boolean>(
        CLEAR_TEAM_MESSAGES_MUTATION,
        { organizationId },
      )
    },
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ['unreadTeamMessages', organizationId],
      })
    },
  })
}
