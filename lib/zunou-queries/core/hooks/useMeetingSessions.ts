import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { MeetingSession } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  meetingSessions: MeetingSession[]
}

// GraphQL query with proper dateRange support
const GET_MEETING_SESSIONS_QUERY = graphql(/* GraphQL */ `
  query GetMeetingSessions(
    $organizationId: String!
    $pulseId: String
    $userId: String
    $status: MeetingSessionStatus
    $onDate: Date
    $dateRange: [Date!]
    $origin: Origin!
  ) {
    meetingSessions(
      organizationId: $organizationId
      pulseId: $pulseId
      userId: $userId
      status: $status
      onDate: $onDate
      dateRange: $dateRange
      origin: $origin
    ) {
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
        priority
        name
        agendas {
          id
          name
          position
        }
        date
      }
    }
  }
`)

export const useMeetingSessions = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { getToken, isAuthenticated } = useAuthContext()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateRange = (variables as any)?.dateRange

  // Process the variables before sending the query
  const processedVariables = {
    ...variables,
    // Only include dateRange if both start and end dates are provided
    dateRange:
      Array.isArray(dateRange) && dateRange[0] && dateRange[1]
        ? dateRange
        : undefined,
    // Use onDate only if dateRange is not provided
    onDate:
      (!Array.isArray(dateRange) || !dateRange[0] || !dateRange[1]) &&
      variables?.onDate
        ? variables.onDate
        : undefined,
  }

  return useQuery({
    ...options,
    enabled: isAuthenticated && !!variables?.organizationId,
    queryFn: async () => {
      const token = await getToken()

      const client = gqlClient(coreUrl, token)
      const result = await client.request<QueryResponse>(
        GET_MEETING_SESSIONS_QUERY,
        processedVariables,
      )
      return result
    },
    queryKey: [
      'meetingSessions',
      variables?.organizationId,
      variables?.pulseId,
      variables?.userId,
      variables?.status,
      variables?.onDate,
      dateRange?.[0],
      dateRange?.[1],
    ],
  })
}
