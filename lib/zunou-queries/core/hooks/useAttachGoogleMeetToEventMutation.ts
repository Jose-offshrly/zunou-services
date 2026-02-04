import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Event } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface AttachGoogleMeetToEventInput {
  eventId: string
  invite_pulse?: boolean
}

interface AttachGoogleMeetToEventResponse {
  attachGoogleMeetToEvent: Event
}

const attachGoogleMeetToEventMutationDocument = graphql(/* GraphQL */ `
  mutation AttachGoogleMeetToEvent($eventId: ID!, $invite_pulse: Boolean) {
    attachGoogleMeetToEvent(eventId: $eventId, invite_pulse: $invite_pulse) {
      id
      name
      start_at
      end_at
      meetingSession {
        id
        status
        invite_pulse
      }
    }
  }
`)

export const useAttachGoogleMeetToEventMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  AttachGoogleMeetToEventResponse,
  Error,
  AttachGoogleMeetToEventInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AttachGoogleMeetToEventInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<AttachGoogleMeetToEventResponse>(
        attachGoogleMeetToEventMutationDocument,
        {
          eventId: input.eventId,
          invite_pulse: input.invite_pulse,
        },
      )
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ['event', response.attachGoogleMeetToEvent.id],
      })
    },
  })
}
