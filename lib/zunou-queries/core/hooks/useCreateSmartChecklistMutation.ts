import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  Checklist,
  CreateSmartChecklistInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateSmartChecklistResponse {
  createSmartChecklist: Checklist[]
}

const CREATE_SMART_CHECKLIST_MUTATION = graphql(/* GraphQL */ `
  mutation CreateSmartChecklist($input: CreateSmartChecklistInput!) {
    createSmartChecklist(input: $input) {
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

export const useCreateSmartChecklistMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateSmartChecklistResponse,
  Error,
  CreateSmartChecklistInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSmartChecklistInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateSmartChecklistResponse>(
        CREATE_SMART_CHECKLIST_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['checklists'],
      })
    },
  })
}
