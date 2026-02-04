import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Checklist } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  checklists: Checklist[]
}

const GET_CHECKLISTS_QUERY = graphql(/* GraphQL */ `
  query getChecklists(
    $organizationId: String!
    $pulseId: String
    $eventId: String
  ) {
    checklists(
      organizationId: $organizationId
      pulseId: $pulseId
      eventId: $eventId
    ) {
      id
      name
      pulse_id
      organization_id
      event_id
      position
      created_at
      updated_at
      complete
    }
  }
`)

export const useGetChecklistsQuery = ({
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
        GET_CHECKLISTS_QUERY,
        variables,
      )
    },
    queryKey: ['checklists', variables?.eventId],
  })
}
