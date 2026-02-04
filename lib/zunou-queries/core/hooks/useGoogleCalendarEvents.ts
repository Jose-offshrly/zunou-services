/// <reference types="vite/client" />

import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { GoogleCalendarEvent } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const GET_GOOGLE_CALENDAR_EVENTS = /* GraphQL */ `
  query GetGoogleCalendarEvents(
    $onDate: Date
    $dateRange: [Date!]
    $pulseId: String
  ) {
    googleCalendarEvents(
      onDate: $onDate
      dateRange: $dateRange
      pulseId: $pulseId
    ) {
      id
      summary
      description
      location
      start {
        dateTime
        timeZone
      }
      end {
        dateTime
        timeZone
      }
      attendees {
        email
        displayName
        responseStatus
      }
      conferenceData {
        entryPoints {
          entryPointType
          uri
        }
      }
      recurring_meeting_id
    }
  }
`
interface GoogleCalendarEventsResponse {
  googleCalendarEvents: GoogleCalendarEvent[]
}

export const useGoogleCalendarEvents = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<GoogleCalendarEventsResponse> => {
  const { getToken } = useAuthContext()

  return useQuery({
    ...options,
    queryFn: async () => {
      const token = await getToken()

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const client = gqlClient(coreUrl, token)
      const response = await client.request<GoogleCalendarEventsResponse>(
        GET_GOOGLE_CALENDAR_EVENTS,
        variables,
      )

      return response
    },
    queryKey: ['googleCalendarEvents', variables],
  })
}
