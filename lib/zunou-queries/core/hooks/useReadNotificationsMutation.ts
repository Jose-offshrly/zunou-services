import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ReadNotificationsResponse {
  readNotifications: { id: string }[]
}

const READ_NOTIFICATIONS_MUTATION = graphql(/* GraphQL */ `
  mutation ReadNotifications {
    readNotifications {
      id
    }
  }
`)

export interface ReadNotificationsMutationOptions extends MutationOptions {
  pulseId?: string
}

export const useReadNotificationsMutation = ({
  coreUrl,
  pulseId,
}: ReadNotificationsMutationOptions): UseMutationResult<
  ReadNotificationsResponse,
  Error,
  void
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<ReadNotificationsResponse>(
        READ_NOTIFICATIONS_MUTATION,
      )
    },
    onError: (error) => {
      console.error('Error reading all notifications:', error)
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
