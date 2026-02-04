import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ClearOrganizationNotificationsResponse {
  clearOrganizationNotifications: boolean
}

const CLEAR_ORGANIZATION_NOTIFICATIONS_MUTATION = graphql(/* GraphQL */ `
  mutation ClearOrganizationNotifications($organizationId: String!) {
    clearOrganizationNotifications(organizationId: $organizationId)
  }
`)

export interface ClearOrganizationNotificationsMutationOptions
  extends MutationOptions {
  organizationId?: string
}

export const useClearOrganizationNotificationsMutation = ({
  coreUrl,
  organizationId,
}: ClearOrganizationNotificationsMutationOptions): UseMutationResult<
  ClearOrganizationNotificationsResponse,
  Error,
  void
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<ClearOrganizationNotificationsResponse>(
        CLEAR_ORGANIZATION_NOTIFICATIONS_MUTATION,
        { organizationId },
      )
    },
    onError: (error) => {
      console.error('Error clearing organization notifications:', error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        exact: false,
        queryKey: ['organizationNotifications', organizationId],
      })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
