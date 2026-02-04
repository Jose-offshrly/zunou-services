import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Transcript } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  transcript: Transcript
}

const GET_TRANSCRIPT_QUERY = graphql(/* GraphQL */ `
  query GetTranscript($dataSourceId: ID!) {
    transcript(dataSourceId: $dataSourceId) {
      ...TranscriptFragment
    }
  }
`)

export const useGetTranscript = ({
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
        GET_TRANSCRIPT_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['transcript', variables?.dataSourceId],
  })

  return response
}
