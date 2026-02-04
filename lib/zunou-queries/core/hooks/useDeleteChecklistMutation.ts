import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Checklist } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteChecklistResponse {
  deleteChecklist: Checklist
}

const DELETE_CHECKLIST_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteChecklist($id: ID!) {
    deleteChecklist(id: $id) {
      id
      name
      pulse_id
      organization_id
      event_id
      position
      created_at
      updated_at
    }
  }
`)

interface DeleteChecklistInput {
  id: string
  eventId: string
}

export const useDeleteChecklistMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteChecklistResponse,
  Error,
  DeleteChecklistInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteChecklistInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteChecklistResponse>(
        DELETE_CHECKLIST_MUTATION,
        {
          id: input.id,
        },
      )
    },
    onSuccess: async (_res, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['checklists', variables.eventId],
      })
    },
  })
}
