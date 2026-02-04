import { Badge } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useUnreadDirectMessages } from '@zunou-queries/core/hooks/useUnreadDirectMessagesQuery'
import { debounce } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'

import { usePusherContext } from '~/context/PusherContext'
import { useOrganization } from '~/hooks/useOrganization'
import { useTeamStore } from '~/store/useTeamStore'

interface MemberItemIconProps {
  isInMembersModal?: boolean
  threadId?: string
}

export const MemberItemIcon = ({
  isInMembersModal = false,
  threadId,
}: MemberItemIconProps) => {
  const theme = useTheme()
  const { organizationId } = useOrganization()
  const { usePusherNotification } = usePusherContext()
  const { setUnreadCount } = useTeamStore()

  // Use the optimized unread direct messages query
  const { data: unreadDirectMessages, refetch: refetchUnreadDirectMessages } =
    useUnreadDirectMessages({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      organizationId,
    })

  const debouncedRefetch = useRef(
    debounce(refetchUnreadDirectMessages, 300, {
      leading: true,
      trailing: true,
    }),
  ).current

  const badgePositioning = isInMembersModal
    ? { right: 7, top: 3 }
    : { right: 10, top: 12 }

  // Determine if there are unread messages for the given threadId or any
  let hasUnreadMessages = false
  let directMessageThreadIds: string[] = []

  if (Array.isArray(unreadDirectMessages)) {
    if (threadId) {
      // Find the user who has a thread with this threadId and unreadCount > 0
      hasUnreadMessages = unreadDirectMessages.some((user) =>
        user.directMessageThreads?.some(
          (thread) => thread.id === threadId && thread.unreadCount > 0,
        ),
      )
    } else {
      // Any thread with unreadCount > 0
      hasUnreadMessages = unreadDirectMessages.some((user) =>
        user.directMessageThreads?.some((thread) => thread.unreadCount > 0),
      )
    }
    // Collect all thread IDs for pusher subscription
    directMessageThreadIds = unreadDirectMessages.flatMap(
      (user) => user.directMessageThreads?.map((thread) => thread.id) ?? [],
    )
  }

  useEffect(() => {
    const totalUnreadDirectCount =
      unreadDirectMessages?.reduce((acc, user) => {
        const userTotal =
          user.directMessageThreads?.reduce(
            (sum, thread) => sum + (thread.unreadCount ?? 0),
            0,
          ) ?? 0
        return acc + userTotal
      }, 0) ?? 0

    setUnreadCount('direct', totalUnreadDirectCount)
  }, [unreadDirectMessages, setUnreadCount])

  // Memoize channelIds and eventNames to avoid unnecessary re-subscribes
  const channelIds = useMemo(
    () => directMessageThreadIds,
    [directMessageThreadIds],
  )
  const eventNames = useMemo(() => ['.direct-message-sent'], [])

  usePusherNotification({
    channelIds,
    eventNames,
    onMessageEvent: () => {
      debouncedRefetch()
    },
    type: 'direct',
  })

  if (!hasUnreadMessages) return null

  return (
    <Badge
      color="error"
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: '#FE6C5F',
          outline: `1px solid ${theme.palette.common.white}`,
          ...badgePositioning,
        },
      }}
      variant="dot"
    />
  )
}
