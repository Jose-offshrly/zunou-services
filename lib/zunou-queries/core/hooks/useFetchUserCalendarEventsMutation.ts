import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  FetchUserCalendarEventsInput,
  FetchUserCalendarEventsResponse,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  fetchUserCalendarEvents: FetchUserCalendarEventsResponse
}

const fetchUserCalendarEventsQueryMutation = graphql(/* GraphQL */ `
  mutation FetchUserCalendarEvents($input: FetchUserCalendarEventsInput!) {
    fetchUserCalendarEvents(input: $input) {
      success
      message
    }
  }
`)

export const useFetchUserCalendarEventsMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  QueryResponse,
  Error,
  FetchUserCalendarEventsInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FetchUserCalendarEventsInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<QueryResponse>(
        fetchUserCalendarEventsQueryMutation,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        exact: false,
        queryKey: ['events'],
      })
    },
  })
}
