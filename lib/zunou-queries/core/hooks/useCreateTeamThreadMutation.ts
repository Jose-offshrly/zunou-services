import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateTeamThreadInput, TeamThread } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateTeamThreadResponse {
  createTeamThread: TeamThread
}

const createTeamThreadMutationDocument = graphql(/* GraphQL */ `
  mutation CreateTeamThread($input: CreateTeamThreadInput!) {
    createTeamThread(input: $input) {
      id
      pulseId
      organizationId
      createdAt
      updatedAt
    }
  }
`)

export const useCreateTeamThreadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateTeamThreadResponse,
  Error,
  CreateTeamThreadInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTeamThreadInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateTeamThreadResponse>(
        createTeamThreadMutationDocument,
        { input },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['teamThreads'],
      })
      queryClient.invalidateQueries({
        queryKey: ['teamThread', variables.pulseId, variables.organizationId],
      })
    },
  })
}
