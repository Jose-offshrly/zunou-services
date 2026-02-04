import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { GoogleCalendarRevokeResponse as GoogleCalRevokeRes } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GoogleCalendarRevokeResponse {
  googleCalendarRevoke: GoogleCalRevokeRes
}

export const GOOGLE_CALENDAR_REVOKE_MUTATION = graphql(/* GraphQL */ `
  mutation GoogleCalendarRevoke {
    googleCalendarRevoke {
      success
      message
    }
  }
`)

export const useGoogleCalendarRevokeMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GoogleCalendarRevokeResponse,
  Error,
  void
> => {
  const queryClient = useQueryClient()
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GoogleCalendarRevokeResponse>(
        GOOGLE_CALENDAR_REVOKE_MUTATION,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['googleCalendarEvents', 'me'],
      })
    },
  })
}
