import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  FetchUserGoogleCalendarSourcedEventsInput,
  FetchUserGoogleCalendarSourcedEventsResponse,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  fetchUserGoogleCalendarSourcedEvents: FetchUserGoogleCalendarSourcedEventsResponse
}

const fetchUserGoogleCalendarSourcedEventsQueryMutation = graphql(
  /* GraphQL */ `
    mutation FetchUserGoogleCalendarSourcedEvents(
      $input: FetchUserGoogleCalendarSourcedEventsInput!
    ) {
      fetchUserGoogleCalendarSourcedEvents(input: $input) {
        success
        message
      }
    }
  `,
)

export const useFetchUserCalendarSourcedEventsMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  QueryResponse,
  Error,
  FetchUserGoogleCalendarSourcedEventsInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FetchUserGoogleCalendarSourcedEventsInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<QueryResponse>(
        fetchUserGoogleCalendarSourcedEventsQueryMutation,
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
