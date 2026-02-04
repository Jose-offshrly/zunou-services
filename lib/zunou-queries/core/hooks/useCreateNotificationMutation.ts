import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateNotificationInput,
  Notification,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateNotificationResponse {
  createNotification: Notification
}

const CREATE_NOTIFICATION_MUTATION = graphql(/* GraphQL */ `
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      id
      status
      description
      kind
    }
  }
`)

export const useCreateNotificationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateNotificationResponse,
  Error,
  CreateNotificationInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateNotificationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateNotificationResponse>(
        CREATE_NOTIFICATION_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: ({ createNotification }) => {
      queryClient.invalidateQueries({
        queryKey: [
          'organizationNotifications',
          createNotification?.organization?.id,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['pulseNotifications', createNotification.pulse?.id],
      })
    },
  })
}
