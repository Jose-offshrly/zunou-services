import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Agenda, UpdateAgendaInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateAgendaResponse {
  updateAgenda: Agenda
}

const UPDATE_AGENDA_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateAgenda($input: UpdateAgendaInput!) {
    updateAgenda(input: $input) {
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

interface UpdateAgendaInputWithMeetingId extends UpdateAgendaInput {
  meetingSessionId?: string
  organizationId?: string
  pulseId?: string
  eventId?: string
}

export const useUpdateAgendaMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateAgendaResponse,
  Error,
  UpdateAgendaInputWithMeetingId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateAgendaInputWithMeetingId) => {
      const token = await getToken()
      const {
        meetingSessionId: _meetingSessionId,
        organizationId: _organizationId,
        pulseId: _pulseId,
        ...agendaInput
      } = input

      return gqlClient(coreUrl, token).request<UpdateAgendaResponse>(
        UPDATE_AGENDA_MUTATION,
        {
          input: agendaInput,
        },
      )
    },
    onSuccess: async (_res, variables) => {
      if (variables?.meetingSessionId) {
        await queryClient.invalidateQueries({
          queryKey: ['meetingSession', variables.meetingSessionId],
        })
      }

      if (variables?.eventId) {
        await queryClient.invalidateQueries({
          queryKey: ['event', variables?.eventId],
        })
      }

      await queryClient.invalidateQueries({
        queryKey: [
          'meetingSessions',
          variables.organizationId,
          variables.pulseId,
        ],
      })
    },
  })
}
