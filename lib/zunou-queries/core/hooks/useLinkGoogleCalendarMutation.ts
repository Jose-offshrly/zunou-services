import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { GoogleCalendarLinkResponse } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface LinkGoogleCalendarResponse {
  linkGoogleCalendar: GoogleCalendarLinkResponse
}

export const LINK_GOOGLE_CALENDAR_MUTATION = graphql(/* GraphQL */ `
  mutation LinkGoogleCalendar($organizationId: ID!, $email: String) {
    linkGoogleCalendar(organizationId: $organizationId, email: $email) {
      success
      message
    }
  }
`)

export const useLinkGoogleCalendarMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  LinkGoogleCalendarResponse,
  Error,
  { organizationId: string; email: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      organizationId,
      email,
    }: {
      organizationId: string
      email: string
    }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<LinkGoogleCalendarResponse>(
        LINK_GOOGLE_CALENDAR_MUTATION,
        {
          email,
          organizationId,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
