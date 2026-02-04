import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Checklist, UpdateChecklistInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateChecklistResponse {
  updateChecklist: Checklist
}

const UPDATE_CHECKLIST_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateChecklist($input: UpdateChecklistInput!) {
    updateChecklist(input: $input) {
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

export const useUpdateChecklistMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateChecklistResponse,
  Error,
  UpdateChecklistInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateChecklistInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateChecklistResponse>(
        UPDATE_CHECKLIST_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['checklist', variables.id],
      })

      await queryClient.invalidateQueries({
        queryKey: ['checklists', response.updateChecklist.event_id],
      })
    },
  })
}
