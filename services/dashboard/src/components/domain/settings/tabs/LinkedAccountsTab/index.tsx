import { Divider } from '@mui/material'
import { Stack } from '@mui/system'

import GoogleCalLink from './components/GoogleCalLink'
import TeamsLink from './components/TeamsLink'
import ZoomLink from './components/ZoomLink'

interface LinkedAccountsTabProps {
  onGoogleCalendarLink?: () => void
}

const LinkedAccountsTab = ({
  onGoogleCalendarLink,
}: LinkedAccountsTabProps) => {
  return (
    <Stack divider={<Divider />} spacing={2}>
      <GoogleCalLink onGoogleCalendarLink={onGoogleCalendarLink} />
      <TeamsLink />
      <ZoomLink />
    </Stack>
  )
}

export default LinkedAccountsTab
