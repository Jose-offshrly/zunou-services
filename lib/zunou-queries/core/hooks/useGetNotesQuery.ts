import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Note } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  notes: Note[]
}

// prettier-ignore
const getNotesQueryDocument = graphql(/* GraphQL */ `
  query GetNotes(
    $pulseId: ID,
    $organizationId: ID!,
    $userId: ID,
    $viewAllLabels: Boolean
  ) {
    notes(
      pulseId: $pulseId,
      organizationId: $organizationId,
      userId: $userId,
      viewAllLabels: $viewAllLabels
    ) {
      id
      title
      content
      pinned
      updatedAt
      position
      dataSourceId
      pulseId
      labels {
        id
        name
        color
        pulse {
          id
          name
          icon
          type
          unread_notifications
          notification_count
          member_count
          saved_message_count
          features
          description
          summary
          created_at
          updated_at
          latest_update
          hasGuest
          category
        }
      }
      pulse {
        id
      }
      files {
        id
        path
        file_name
        type
        entity_type
        entity_id
        organization_id
        pulse_id
        created_at
        updated_at
        url
        size
      }
      dataSource {
        id
        name
      }
    }
  }
`)

export const useGetNotesQuery = ({
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

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getNotesQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'notes',
      variables?.organizationId,
      variables?.pulseId,
      variables?.userId,
      variables?.viewAllLabels,
    ],
  })
}
