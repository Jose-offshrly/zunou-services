import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { MonthlyQuestion } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  monthlyQuestions: MonthlyQuestion[]
}

const monthlyQuestionsQueryDocument = graphql(/* GraphQL */ `
  query GetMonthlyQuestions(
    $organizationId: String!
    $month: Int!
    $year: Int!
    $pulseId: String!
  ) {
    monthlyQuestions(
      organizationId: $organizationId
      month: $month
      year: $year
      pulseId: $pulseId
    ) {
      question
    }
  }
`)

export const useGetMonthlyQuestionsQuery = ({
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
        monthlyQuestionsQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'monthlyQuestions',
      variables?.organizationId,
      variables?.month,
      variables?.year,
    ],
  })

  return response
}
