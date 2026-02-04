import { Close } from '@mui/icons-material'
import { Divider, Drawer, Stack, Typography } from '@mui/material'
import { Button, IconButton } from '@zunou-react/components/form'
import { useState } from 'react'

import { useMeetingsContext } from '~/context/MeetingsContext'

import { InvitePulseToMeetingModal } from '../../dataSource/InvitePulseToMeetingModal'
import LiveMeetings from './components/LiveMeetings'
import ManageMeetings from './components/ManageMeetings'

interface Props {
  open: boolean
  onClose: () => void
}

export default function PulseMeetingsModal({ open, onClose }: Props) {
  // const [isExpanded, setIsExpanded] = useState(false)
  const [isInvitePulseToMeetingOpen, setIsInvitePulseToMeetingOpen] =
    useState(false)
  const { googleCalLinked, isLoadingLinkStatus } = useMeetingsContext()

  return (
    <>
      <Drawer
        PaperProps={{
          sx: {
            borderTop: '2px solid',
            borderTopColor: 'primary.main',
            display: 'flex',
            flexDirection: 'column',
            width: 440,
          },
        }}
        anchor="right"
        onClose={onClose}
        open={open}
      >
        <Stack divider={<Divider />} gap={1} height="100%">
          {/* Header */}
          <Stack
            alignItems="center"
            direction="row"
            flexShrink={0}
            justifyContent="space-between"
            p={2}
          >
            <Typography fontWeight={500}>Meetings</Typography>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Stack>

          {/* Live Meetings */}
          <Stack flexShrink={0} maxHeight={'35%'} overflow={'auto'} px={2}>
            <LiveMeetings />
          </Stack>

          <Stack gap={1} p={2}>
            <Button
              disabled={!googleCalLinked || isLoadingLinkStatus}
              onClick={() => setIsInvitePulseToMeetingOpen(true)}
              variant="contained"
            >
              Add Meetings from Calendar
            </Button>
            {(!googleCalLinked || isLoadingLinkStatus) && (
              <Typography
                color="error.main"
                textAlign="center"
                variant="caption"
              >
                Link your calendar to add meetings from Google Calendar.
              </Typography>
            )}
          </Stack>

          <Stack flexGrow={1} maxHeight="100%" overflow="auto" pb={2} px={2}>
            {/* Manage Meetings */}
            <ManageMeetings />
          </Stack>
        </Stack>
      </Drawer>
      <InvitePulseToMeetingModal
        isGoogleCalendarOnlyMode={true}
        isOpen={isInvitePulseToMeetingOpen}
        onClose={() => setIsInvitePulseToMeetingOpen(false)}
        setModalOpen={() => setIsInvitePulseToMeetingOpen(true)}
      />
    </>
  )
}
