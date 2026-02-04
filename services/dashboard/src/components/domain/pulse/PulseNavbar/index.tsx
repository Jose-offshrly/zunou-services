import { Stack } from '@mui/material'

import { NavbarBottom } from './NavbarBottom'
import { NavbarTop } from './NavbarTop'

interface PulseNavbarProps {
  pendingNotificationCount: number
  onNotificationToggle: () => void
  openFeedDrawer: () => void
  openSavedChat: () => void
  openStrategiesDrawer: () => void
  openContentDrawer: () => void
  openMeetingsDrawer: () => void
  savedMessagesCount: number
  isNotificationsOpen?: boolean
}

const PulseNavbar = ({
  pendingNotificationCount,
  onNotificationToggle,
  openFeedDrawer,
  openSavedChat,
  openStrategiesDrawer,
  openContentDrawer,
  openMeetingsDrawer,
  savedMessagesCount,
  isNotificationsOpen,
}: PulseNavbarProps) => {
  return (
    <Stack bgcolor="common.white" width="100%">
      <NavbarTop
        isNotificationsOpen={isNotificationsOpen}
        onNotificationToggle={onNotificationToggle}
        openContentDrawer={openContentDrawer}
        openFeedDrawer={openFeedDrawer}
        openMeetingsDrawer={openMeetingsDrawer}
        openSavedChat={openSavedChat}
        openStrategiesDrawer={openStrategiesDrawer}
        pendingNotificationCount={pendingNotificationCount}
        savedMessagesCount={savedMessagesCount}
      />
      <NavbarBottom />
    </Stack>
  )
}

export default PulseNavbar
