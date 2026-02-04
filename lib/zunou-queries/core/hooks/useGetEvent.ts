import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Event } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  event: Event | null
}

const getEventQueryDocument = graphql(/* GraphQL */ `
  query GetEvent($eventId: ID!) {
    event(eventId: $eventId) {
      ...EventFragment
      agendas {
        id
        name
        position
      }
      meetingSession {
        id
        name
        meetingUrl
        start_at
        end_at
        status
        invite_pulse
        companion_status
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
      }
    }
  }
`)

export const useGetEvent = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated && !!variables?.eventId && options.enabled,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getEventQueryDocument,
        { eventId: variables?.eventId },
      )
      return result
    },
    queryKey: ['event', variables?.eventId],
  })

  return response
}
