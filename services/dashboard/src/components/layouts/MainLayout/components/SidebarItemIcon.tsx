import { AssignmentInd } from '@mui/icons-material'
import { ListItemIcon, ListItemIconProps } from '@mui/material'
import { alpha, darken, styled, Theme, useTheme } from '@mui/material/styles'
import { useUnreadTeamMessagesQuery } from '@zunou-queries/core/hooks/useUnreadTeamMessagesQuery'
import { debounce } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'

import { usePusherContext } from '~/context/PusherContext'
import { useOrganization } from '~/hooks/useOrganization'
import { useTeamStore } from '~/store/useTeamStore'

import NotificationBadge from './NotificationBadge'

const StyledListItemIcon = styled(ListItemIcon)<ListItemIconProps>(() => ({
  alignItems: 'center',
  borderRadius: '12px',
  height: 40,
  justifyContent: 'center',
  minWidth: 40,
  width: 40,
}))

export const SidebarItemIcon = ({
  inverted = false,
  children,
  selected = false,
  pulseId,
  hasGuest,
  isGuest,
  ...props
}: ListItemIconProps & {
  inverted?: boolean
  selected?: boolean
  pulseId?: string
  hasGuest?: boolean
  isGuest?: boolean
}) => {
  const theme = useTheme()
  const { organizationId } = useOrganization()
  const { usePusherNotification } = usePusherContext()
  const { setUnreadCount } = useTeamStore()

  const { data: unreadPulses, refetch: refetchUnreadPulses } =
    useUnreadTeamMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    })

  const debouncedRefetch = useRef(
    debounce(refetchUnreadPulses, 300, { leading: true, trailing: true }),
  ).current

  const hasUnreadMessages: boolean =
    Array.isArray(unreadPulses) && pulseId
      ? unreadPulses.some((pulse) => pulse.id === pulseId)
      : false

  // Memoize channelIds and eventNames to avoid unnecessary re-subscribes
  const channelIds = useMemo(() => (pulseId ? [pulseId] : []), [pulseId])
  const eventNames = useMemo(() => ['.team-message-sent'], [])

  usePusherNotification({
    channelIds,
    eventNames,
    onMessageEvent: () => {
      debouncedRefetch()
    },
    shouldNotify: true,
    suppressFor: selected
      ? { organizationId, pulseId: pulseId ?? '' }
      : undefined,
    type: 'team',
  })

  useEffect(() => {
    if (!pulseId) return

    if (Array.isArray(unreadPulses)) {
      setUnreadCount('team', unreadPulses.length)
    } else {
      setUnreadCount('team', 0)
    }
  }, [unreadPulses, pulseId, setUnreadCount])

  const getBackgroundColor = (
    selected: boolean,
    inverted: boolean,
    theme: Theme,
  ) => {
    if (!selected) return 'transparent'

    return inverted
      ? alpha(theme.palette.common.white, 0.2)
      : alpha(theme.palette.common.white, 0.7)
  }

  const normalMode = selected
    ? theme.palette.primary.main
    : theme.palette.text.primary

  const invertedMode = selected
    ? theme.palette.common.white
    : darken(theme.palette.secondary.dark, 0.1)

  const content = (
    <StyledListItemIcon
      {...props}
      sx={{
        backgroundColor: getBackgroundColor(selected, inverted, theme),
        color: inverted ? invertedMode : normalMode,
        position: 'relative',
      }}
    >
      {children}
      {hasGuest && !isGuest && (
        <AssignmentInd
          sx={{
            bottom: '-15%',
            color: 'common.gold',
            fontSize: 'medium',
            position: 'absolute',
            right: '-15%',
          }}
        />
      )}
    </StyledListItemIcon>
  )

  if (hasUnreadMessages) {
    return (
      <NotificationBadge isInverted={inverted}>{content}</NotificationBadge>
    )
  }

  return content
}
