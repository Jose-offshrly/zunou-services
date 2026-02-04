import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ClearNotificationsResponse {
  clearNotifications: { id: string }[]
}

const CLEAR_NOTIFICATIONS_MUTATION = graphql(/* GraphQL */ `
  mutation ClearNotifications($pulseId: String!) {
    clearNotifications(pulseId: $pulseId)
  }
`)

export interface ClearNotificationsMutationOptions extends MutationOptions {
  pulseId?: string
}

export const useClearNotificationsMutation = ({
  coreUrl,
  pulseId,
}: ClearNotificationsMutationOptions): UseMutationResult<
  ClearNotificationsResponse,
  Error,
  void
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<ClearNotificationsResponse>(
        CLEAR_NOTIFICATIONS_MUTATION,
        { pulseId },
      )
    },
    onError: (error) => {
      console.error('Error clearing notifications:', error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationNotifications'] })
      queryClient.invalidateQueries({
        queryKey: ['pulseNotifications', pulseId],
      })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
