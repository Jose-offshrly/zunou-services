import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Agenda, CreateAgendaInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateAgendaResponse {
  createAgenda: Agenda
}

const CREATE_AGENDA_MUTATION = graphql(/* GraphQL */ `
  mutation CreateAgenda($input: CreateAgendaInput!) {
    createAgenda(input: $input) {
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

interface CreateAgendaInputWithMeetingId extends CreateAgendaInput {
  meetingSessionId?: string
}

export const useCreateAgendaMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateAgendaResponse,
  Error,
  CreateAgendaInputWithMeetingId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAgendaInputWithMeetingId) => {
      const token = await getToken()
      const { meetingSessionId: _meetingSessionId, ...agendaInput } = input

      return gqlClient(coreUrl, token).request<CreateAgendaResponse>(
        CREATE_AGENDA_MUTATION,
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

      await queryClient.invalidateQueries({
        queryKey: ['event', variables?.event_id],
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
