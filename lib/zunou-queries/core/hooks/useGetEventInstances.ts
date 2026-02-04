import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { EventInstance } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  eventInstances: EventInstance[]
}

const getEventInstancesQueryDocument = graphql(/* GraphQL */ `
  query GetEventInstances($input: EventsInput!) {
    eventInstances(input: $input) {
      ...EventInstanceFragment
    }
  }
`)

export const useGetEventInstances = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated && !!variables?.pulseId,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getEventInstancesQueryDocument,
        { input: variables },
      )
      return result
    },
    queryKey: ['eventInstances', variables?.pulseId, variables],
  })

  return response
}
