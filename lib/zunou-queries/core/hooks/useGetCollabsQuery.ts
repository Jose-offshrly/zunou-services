import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  collabs: MeetingSession[]
}

const GET_COLLABS_QUERY = graphql(/* GraphQL */ `
  query getCollabs(
    $organizationId: ID!
    $pulseId: ID
    $default: Boolean!
    $origin: Origin
  ) {
    collabs(
      organizationId: $organizationId
      pulseId: $pulseId
      default: $default
      origin: $origin
    ) {
      id
      meetingId
      meetingUrl
      type
      status
      pulseId
      userId
      organizationId
      name
      description
      start_at
      end_at
      external_attendees
      attendees {
        id
        user {
          id
          name
          gravatar
        }
      }
      invite_pulse
      gcal_meeting_id
      pulse {
        name
      }
      companion_status
      meeting_type
    }
  }
`)

export const useGetCollabsQuery = ({
  coreUrl,
  variables,
  enabled = true,
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { getToken } = useAuthContext()

  return useQuery({
    enabled,
    queryFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<QueryResponse>(
        GET_COLLABS_QUERY,
        variables,
      )
    },
    queryKey: [
      'collabs',
      variables?.organizationId,
      variables?.pulseId,
      variables?.default,
    ],
  })
}
