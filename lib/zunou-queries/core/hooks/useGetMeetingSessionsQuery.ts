import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GetMeetingSessionsResponse {
  meetingSessions: MeetingSession[]
}

interface GetMeetingSessionsVariables {
  organizationId: string
  pulseId?: string
  userId?: string
}

const GET_MEETING_SESSIONS_QUERY = `
  query GetMeetingSessions($organizationId: String!, $pulseId: String!, $userId: String!, $onDate: Date) {
    meetingSessions(organizationId: $organizationId, pulseId: $pulseId, userId: $userId, onDate: $onDate) {
      id
      status
      type
      start_at
      end_at
      meetingId
      meetingUrl
      external_attendees
      attendees {
        id
        user {
          id
          name
          email
          gravatar
        }
      }
      recurring_meeting_id
    }
  }
`

export const useGetMeetingSessionsQuery = ({
  coreUrl,
  enabled = true,
  variables,
}: QueryOptions & {
  variables: GetMeetingSessionsVariables
}): UseQueryResult<GetMeetingSessionsResponse> => {
  const { getToken } = useAuthContext()

  return useQuery({
    enabled,
    queryFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GetMeetingSessionsResponse>(
        GET_MEETING_SESSIONS_QUERY,
        variables,
      )
    },
    queryKey: [
      'meetingSessions',
      variables?.organizationId,
      variables?.pulseId,
      variables?.userId,
    ],
  })
}
