import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  fireFliesWebhookUrl: string
}

const getFirefliesWebhookUrlQueryDocument = graphql(/* GraphQL */ `
  query GetFirefliesWebhookUrl($pulseId: String!) {
    fireFliesWebhookUrl(pulseId: $pulseId)
  }
`)

export const useGetFirefliesWebhookUrl = ({
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
        getFirefliesWebhookUrlQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['fireFliesWebhookUrl', variables?.pulseId],
  })

  return response
}
