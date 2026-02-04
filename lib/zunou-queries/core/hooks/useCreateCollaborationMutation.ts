import { useMutation, UseMutationResult } from '@tanstack/react-query'
import {
  Collaboration,
  CreateCollaborationInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateCollaborationResponse {
  createCollaboration: Collaboration
}

const CREATE_COLLABORATION_MUTATION = `
  mutation CreateCollaboration($input: CreateCollaborationInput!) {
    createCollaboration(input: $input) {
      id
      name
      description
      attendees {
        id
        user {
          id
          name
          email
        }
      }
      pulseId
      organizationId
    }
  }
`

export const useCreateCollaborationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateCollaborationResponse,
  Error,
  CreateCollaborationInput
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: CreateCollaborationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateCollaborationResponse>(
        CREATE_COLLABORATION_MUTATION,
        { input },
      )
    },
  })
}
