import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Checklist, CreateChecklistInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateChecklistResponse {
  createChecklist: Checklist
}

const CREATE_CHECKLIST_MUTATION = graphql(/* GraphQL */ `
  mutation CreateChecklist($input: CreateChecklistInput!) {
    createChecklist(input: $input) {
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

export const useCreateChecklistMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateChecklistResponse,
  Error,
  CreateChecklistInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateChecklistInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateChecklistResponse>(
        CREATE_CHECKLIST_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: async (_res, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['checklists', variables.event_id],
      })
    },
  })
}
