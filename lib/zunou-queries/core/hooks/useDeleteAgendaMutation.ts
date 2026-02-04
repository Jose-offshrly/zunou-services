import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Agenda } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteAgendaResponse {
  deleteAgenda: Agenda
}

const DELETE_AGENDA_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteAgenda($id: ID!) {
    deleteAgenda(id: $id) {
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

interface DeleteAgendaVariables {
  id: string
  meetingSessionId?: string
  organization_id?: string
  pulse_id?: string
  eventId?: string
}

export const useDeleteAgendaMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteAgendaResponse,
  Error,
  DeleteAgendaVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: DeleteAgendaVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteAgendaResponse>(
        DELETE_AGENDA_MUTATION,
        {
          id,
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
          variables.organization_id,
          variables.pulse_id,
        ],
      })
    },
  })
}
