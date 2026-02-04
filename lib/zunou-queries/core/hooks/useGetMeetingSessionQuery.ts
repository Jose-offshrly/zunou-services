import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  meetingSession: MeetingSession
}

const getMeetingSessionQueryDocument = graphql(/* GraphQL */ `
  query GetMeetingSession($meetingSessionId: ID!) {
    meetingSession(meetingSessionId: $meetingSessionId) {
      id
      meetingId
      meetingUrl
      name
      description
      start_at
      end_at
      status
      type
      pulse {
        id
        name
      }
      organizationId
      invite_pulse
      gcal_meeting_id
      attendees {
        id
        user {
          id
          name
          email
          gravatar
        }
      }
      external_attendees
      recurring_meeting_id
      companion_status
      event {
        id
        name
        date
        start_at
        end_at
        location
        priority
        attendees {
          id
          user {
            name
            email
            gravatar
          }
        }
        guests
        participants {
          name
          email
          gravatar
        }
        files
        pulse_id
        organization_id
        user_id
        google_event_id
        meeting {
          dataSourceId
        }
        link
        summary
        location
      }
    }
  }
`)

export const useGetMeetingSessionQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated && options.enabled,
    queryFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<QueryResponse>(
        getMeetingSessionQueryDocument,
        variables,
      )
    },
    queryKey: ['meetingSession', variables?.meetingSessionId],
  })
}
