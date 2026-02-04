import { AddCircleOutline } from '@mui/icons-material'
import { Divider, Tab, Tabs, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { PulseCategory } from '@zunou-graphql/core/graphql'
import googleCalendarIcon from '@zunou-react/assets/images/google-calendar-icon.png'
import { Button } from '@zunou-react/components/form'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useMeetingsContext } from '~/context/MeetingsContext'
import { usePulseStore } from '~/store/usePulseStore'

import { InvitePulseModalMode } from '..'
import { ActiveMeetings, UpcomingMeetings, ViewAllMeetings } from './index'

export enum MeetingListIdentifier {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ALL = 'all',
}

interface MeetingManagerProps {
  handleGoogleLink?: () => void
  handleOpenAddMeetingLink: () => void
  initialTab?: MeetingListIdentifier
  isVitalsMode?: boolean
  setModalMode: (modalMode: InvitePulseModalMode) => void
}

export const MeetingManager = ({
  handleGoogleLink,
  handleOpenAddMeetingLink,
  initialTab = MeetingListIdentifier.UPCOMING,
  isVitalsMode = false,
  setModalMode,
}: MeetingManagerProps) => {
  const { t } = useTranslation('vitals')
  const { googleCalLinked, isLoadingLinkStatus } = useMeetingsContext()

  const { pulse } = usePulseStore()

  const [activeMeetingList, setActiveMeetingList] =
    useState<MeetingListIdentifier>(initialTab)

  const NAVIGATION_LABEL = [
    { id: MeetingListIdentifier.UPCOMING, label: t('upcoming') },
    { id: MeetingListIdentifier.ACTIVE, label: t('active') },
    { id: MeetingListIdentifier.ALL, label: t('view_all') },
  ]
  const handleSelectTab = (
    _event: React.SyntheticEvent,
    newValue: MeetingListIdentifier,
  ): void => {
    setActiveMeetingList(newValue)
  }

  return (
    <Stack height="100%" spacing={2}>
      {/* Header */}
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        p={2}
        spacing={2}
      >
        <Stack>
          <Typography fontWeight={600}>
            {pulse?.name && pulse.category === PulseCategory.Team
              ? `${pulse.name}'s Pulse Companion`
              : 'Pulse Companion'}
          </Typography>
          <Typography fontSize={14} fontWeight={400}>
            {t('invite_pulse_to_meeting')}
          </Typography>
        </Stack>

        <Button
          onClick={handleOpenAddMeetingLink}
          size="large"
          startIcon={<AddCircleOutline />}
          sx={{ height: 40, minWidth: 160 }}
          variant="contained"
        >
          {t('meeting_invite_action')}
        </Button>
      </Stack>
      <Divider />

      <Stack px={2}>
        <Stack>
          {isLoadingLinkStatus ? (
            <LoadingSkeleton height={70} width="100%" />
          ) : googleCalLinked ? (
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
              p={1}
            >
              <Stack alignItems="center" direction="row" gap={2}>
                <Typography fontWeight={600}>Linked Calendars:</Typography>
                <Stack alignItems="center" direction="row" gap={1}>
                  <Button
                    onClick={() =>
                      setModalMode(InvitePulseModalMode.GoogleCalendar)
                    }
                    startIcon={
                      <img height={15} src={googleCalendarIcon} width={15} />
                    }
                    variant="text"
                  >
                    Google Calendar
                  </Button>
                </Stack>
              </Stack>
              <Button
                onClick={handleGoogleLink}
                sx={{
                  '&:not(.Mui-disabled):hover': {
                    bgcolor: 'transparent',
                    color: 'primary.main',
                    textDecoration: 'underline',
                  },
                  color: 'text.primary',
                }}
                variant="text"
              >
                Manage
              </Button>
            </Stack>
          ) : (
            <Stack
              alignItems="start"
              borderRadius={1}
              component={'button'}
              onClick={handleGoogleLink}
              px={2}
              py={1}
              sx={(theme) => ({
                '&:hover': {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                  bgcolor: alpha(theme.palette.primary.light, 0.1),
                },
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                bgcolor: alpha(theme.palette.primary.light, 0.05),
                border: 1,
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              })}
              width="100%"
            >
              <Typography color="text.primary" fontWeight="600">
                You haven&apos;t linked any calendars yet.
              </Typography>
              <Typography color="text.primary" variant="body2">
                To get the most out of your meetings and schedule, link your
                calendar in settings.
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>

      <Stack borderBottom={1} borderColor="divider" px={2}>
        <Tabs
          onChange={handleSelectTab}
          sx={{
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
            },
            minHeight: 40,
          }}
          value={activeMeetingList}
        >
          {NAVIGATION_LABEL.map((nav) => (
            <Tab
              disableRipple={true}
              key={nav.id}
              label={nav.label}
              sx={{ gap: 0.5 }}
              value={nav.id}
            />
          ))}
        </Tabs>
      </Stack>

      <Stack
        flex={1}
        sx={{
          height: '100%',
          overflow: 'auto',
        }}
      >
        {activeMeetingList === MeetingListIdentifier.ALL && (
          <ViewAllMeetings isVitalsMode={isVitalsMode} />
        )}
        {activeMeetingList === MeetingListIdentifier.ACTIVE && (
          <ActiveMeetings isVitalsMode={isVitalsMode} />
        )}
        {activeMeetingList === MeetingListIdentifier.UPCOMING && (
          <UpcomingMeetings isVitalsMode={isVitalsMode} />
        )}
      </Stack>
    </Stack>
  )
}
