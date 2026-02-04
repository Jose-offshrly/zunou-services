import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CompanionDetails {
  meeting_id: string
  bot_id: string
  status: string
  original_status: string
  meeting_status: string
  started_at?: string
  ended_at?: string
  joined_at?: string
  last_heartbeat?: string
  is_active: boolean
  heartbeat_age_minutes?: number
}

export interface CompanionStatus {
  id: string
  meetingId: string
  meetingUrl: string
  pulseId?: string
  organizationId?: string
  name?: string
  description?: string
  start_at?: string
  end_at?: string
  companion_status?: string
  companion_details?: CompanionDetails | null
}

interface QueryResponse {
  companionStatus: MeetingSession[]
}

const GET_COMPANION_QUERY = `
  query companionStatus($organizationId: ID!, $origin: Origin) {
    companionStatus(
      organizationId: $organizationId
      origin: $origin
    ) {
        id
        meetingId
        meetingUrl
        pulseId
        organizationId
        name
        description
        start_at
        end_at
        companion_status
        invite_pulse
        companion_details {
            meeting_id
            bot_id
            status
            original_status
            meeting_status
            started_at
            ended_at
            joined_at
            last_heartbeat
            is_active
            heartbeat_age_minutes
        }
        event {
            id
            name
            date
            start_at
            end_at
            link
            location
            priority
            guests
            description
            files
            pulse_id
            organization_id
            user_id
            google_event_id
        }
        pulse {
            name
        }
    }
  }
`

export const useGetCompanionStatus = ({
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
        GET_COMPANION_QUERY,
        variables,
      )
    },
    queryKey: ['companionStatus', variables?.organizationId, variables?.origin],
  })
}
