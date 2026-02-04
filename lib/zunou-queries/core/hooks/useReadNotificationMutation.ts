import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { ReadNotificationInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ReadNotificationResponse {
  readNotification: {
    id: string
  }
}

const READ_NOTIFICATION_MUTATION = graphql(/* GraphQL */ `
  mutation ReadNotification($input: ReadNotificationInput!) {
    readNotification(input: $input) {
      id
    }
  }
`)

export const useReadNotificationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  ReadNotificationResponse,
  Error,
  ReadNotificationInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ReadNotificationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<ReadNotificationResponse>(
        READ_NOTIFICATION_MUTATION,
        {
          input,
        },
      )
    },
    onError: (error) => {
      console.error('Error reading notification:', error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationNotifications'] })
      queryClient.invalidateQueries({ queryKey: ['pulseNotifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
