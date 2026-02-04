import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Agenda, AgendaOrderInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateAgendaOrderResponse {
  updateAgendaOrder: Agenda[]
}

interface UpdateAgendaOrderVariables {
  input: AgendaOrderInput[]
  meetingSessionId?: string
  eventId?: string
  organization_id?: string
  pulse_id?: string
}

const UPDATE_AGENDA_ORDER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateAgendaOrder($input: [AgendaOrderInput!]!) {
    updateAgendaOrder(input: $input) {
      id
      name
      pulse_id
      organization_id
      event {
        id
        name
      }
      position
      created_at
      updated_at
    }
  }
`)

export const useUpdateAgendaOrderMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateAgendaOrderResponse,
  Error,
  UpdateAgendaOrderVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ input }: UpdateAgendaOrderVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateAgendaOrderResponse>(
        UPDATE_AGENDA_ORDER_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: async (_res, variables) => {
      if (variables?.meetingSessionId) {
        await queryClient.invalidateQueries({
          queryKey: ['meetingSession', variables.meetingSessionId],
        })
      }

      await queryClient.invalidateQueries({
        queryKey: ['event', variables?.eventId],
      })

      await queryClient.invalidateQueries({
        queryKey: [
          'meetingSessions',
          variables.organization_id,
          variables.pulse_id,
        ],
      })
    },
  })
}
