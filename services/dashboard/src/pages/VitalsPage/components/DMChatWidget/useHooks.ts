import { useQueryClient } from '@tanstack/react-query'
import { useGetDirectMessagesQuery } from '@zunou-queries/core/hooks/useGetDirectMessagesQuery'
import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

export const useHooks = () => {
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()

  const queryClient = useQueryClient()

  const { data: directMessages, isLoading: isDirectMessagesLoading } =
    useGetDirectMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!organizationId,
      organizationId: organizationId,
    })

  const { data: organizationUsersData, isLoading: isLoadingOrganizationUsers } =
    useGetOrganizationUsersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
      },
    })

  const orgUsers = organizationUsersData?.organizationUsers.data.map(
    (orgUsers) => orgUsers.user,
  )

  usePusherChannel({
    channelName: `direct-messages.${user?.id}`,
    eventName: '.direct-message-sent',
    onEvent: () => {
      queryClient.invalidateQueries({
        queryKey: ['directMessages', organizationId],
      })

      queryClient.invalidateQueries({
        queryKey: ['pulseMembersByOrganization', organizationId],
      })
    },
  })

  const unreadMessages =
    directMessages?.filter(
      (message) =>
        message.unreadCount > 0 &&
        message.directMessages &&
        message.directMessages?.length > 0,
    ) ?? []

  const readMessages =
    directMessages?.filter(
      (message) =>
        message.unreadCount === 0 &&
        message.directMessages &&
        message.directMessages?.length > 0,
    ) ?? []

  return {
    directMessages,
    isDirectMessagesLoading,
    isLoadingOrganizationUsers,
    orgUsers,
    readMessages,
    unreadMessages,
  }
}
