import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Checklist, ChecklistOrderInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateChecklistOrderResponse {
  updateChecklistOrder: Checklist[]
}

interface UpdateChecklistOrderVariables {
  input: ChecklistOrderInput[]
  event_id: string
}

const UPDATE_CHECKLIST_ORDER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateChecklistOrder($input: [ChecklistOrderInput!]!) {
    updateChecklistOrder(input: $input) {
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

export const useUpdateChecklistOrderMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateChecklistOrderResponse,
  Error,
  UpdateChecklistOrderVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: UpdateChecklistOrderVariables) => {
      const token = await getToken()
      const { input } = variables

      return gqlClient(coreUrl, token).request<UpdateChecklistOrderResponse>(
        UPDATE_CHECKLIST_ORDER_MUTATION,
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
