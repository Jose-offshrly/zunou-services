import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Meeting } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  meetings: Meeting[]
}

const getMeetingsQueryDocument = graphql(/* GraphQL */ `
  query getMeetings(
    $userId: String!
    $pulseId: String!
    $added: Boolean
    $ignored: Boolean
  ) {
    meetings(
      userId: $userId
      pulseId: $pulseId
      added: $added
      ignored: $ignored
    ) {
      ...MeetingFragment
    }
  }
`)

export const useGetMeetingsQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getMeetingsQueryDocument,
        variables,
      )

      return result
    },
    queryKey: [
      'meetings',
      variables?.added,
      variables?.ignored,
      variables?.userId,
      variables?.pulseId,
    ],
  })
  if (response.error) {
    console.error('Error fetching meetings:', response.error)
  }

  return response
}
