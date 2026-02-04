import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  Notification,
  UpdateNotificationStatusInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateNotificationStatusResponse {
  updateNotificationStatus: Notification
}

const UPDATE_NOTIFICATION_STATUS_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateNotificationStatus($input: UpdateNotificationStatusInput!) {
    updateNotificationStatus(input: $input) {
      ...NotificationFragment
    }
  }
`)

export const useUpdateNotificationStatusMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateNotificationStatusResponse,
  Error,
  UpdateNotificationStatusInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateNotificationStatusInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<UpdateNotificationStatusResponse>(
        UPDATE_NOTIFICATION_STATUS_MUTATION,
        {
          input,
        },
      )
    },
    onError: (error) => {
      console.error('Error updating notification status:', error)
    },
    onSuccess: ({ updateNotificationStatus }) => {
      queryClient.invalidateQueries({
        queryKey: [
          'organizationNotifications',
          updateNotificationStatus.organization.id,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulseNotifications', updateNotificationStatus.pulse?.id],
      })
    },
  })
}
