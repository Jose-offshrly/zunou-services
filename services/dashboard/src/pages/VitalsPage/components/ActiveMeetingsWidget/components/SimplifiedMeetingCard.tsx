import {
  Hearing,
  HearingDisabled,
  StopCircleOutlined,
} from '@mui/icons-material'
import { Link, Typography, useTheme } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import {
  MeetingSessionStatus,
  MeetingSessionType,
} from '@zunou-graphql/core/graphql'
import { useUpdateMeetingSessionStatus } from '@zunou-queries/core/hooks/useUpdateMeetingSessionStatus'
import { Button, IconButton } from '@zunou-react/components/form'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { AudioVisualizer } from '~/components/ui/AudioVisualizer'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

interface SimplifiedMeetingCardProps {
  meetingId: string
  title: string
  pulseName: string
  pulseId: string
  initialStatus: MeetingSessionStatus
  type: MeetingSessionType
  meetingUrl?: string | null
}

export const SimplifiedMeetingCard: React.FC<SimplifiedMeetingCardProps> = ({
  meetingId,
  title,
  pulseName,
  pulseId,
  initialStatus,
  type,
  meetingUrl = null,
}) => {
  const { t } = useTranslation('vitals')
  const { organizationId } = useOrganization()
  const { setting } = useVitalsContext()
  const queryClient = useQueryClient()
  const muiTheme = useTheme()

  const isDarkMode = setting.theme === 'dark'

  const [status, setStatus] = useState<MeetingSessionStatus>(initialStatus)
  const [isEnding, setEnding] = useState(false)

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  const handleMeetingSessionEnded = useCallback(() => {
    // Invalidate all queries that has meetingSessions key
    queryClient.invalidateQueries({
      exact: false,
      queryKey: ['meetingSessions'],
    })

    // Invalidate collabs
    queryClient.invalidateQueries({
      exact: false,
      queryKey: ['collabs', organizationId],
    })
  }, [queryClient, organizationId])

  usePusherChannel({
    channelName: `meeting-session.${meetingId}`,
    eventName: '.meeting-session-ended',
    onEvent: handleMeetingSessionEnded,
  })

  const endButtonText =
    type === MeetingSessionType.Collab ? t('end_collab') : t('end_recording')

  const getHighlightGreen = () => {
    return isDarkMode ? muiTheme.palette.success.dark : 'common.lime'
  }

  const {
    mutateAsync: updateMeetingStatus,
    isPending: updateMeetingStatusPending,
  } = useUpdateMeetingSessionStatus()

  const handleTogglePlayStatus = async (
    meetingId: string,
    currentStatus: string,
  ) => {
    const newStatus =
      currentStatus === 'ACTIVE'
        ? MeetingSessionStatus.Paused
        : MeetingSessionStatus.Active

    await updateMeetingStatus({
      id: meetingId,
      status: newStatus,
    })

    setStatus(newStatus)
  }

  const handleEndMeeting = async (meetingId: string) => {
    setEnding(true)

    await updateMeetingStatus(
      {
        id: meetingId,
        status: MeetingSessionStatus.Stopped,
      },
      {
        onError: () => toast.error(t('end_recording_error')),
        onSettled: () => setEnding(false),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['collabs', organizationId],
          })

          queryClient.invalidateQueries({
            queryKey: ['collabs', organizationId, pulseId],
          })

          toast.success(t('end_recording_success'))
        },
      },
    )

    setStatus(MeetingSessionStatus.Stopped)
  }

  return (
    <Stack
      sx={{
        bgcolor: isDarkMode ? 'rgba(0, 128, 0, 0.05)' : '#F6FCFA80',
        border: 1,
        borderColor: getHighlightGreen(),
        borderRadius: 2,
        gap: 2,
        p: 2,
      }}
    >
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Stack spacing={1}>
          <Stack alignItems="center" direction="row" spacing={1}>
            <Box
              sx={{
                bgcolor: getHighlightGreen(),
                borderRadius: 9999,
                color: 'common.white',
                fontSize: 'x-small',
                fontWeight: 'bold',
                px: 1,
                py: 0.25,
                textTransform: 'uppercase',
              }}
            >
              {t('live').toUpperCase()}
            </Box>
            <Typography
              sx={{
                color: isDarkMode ? 'grey.500' : 'grey.400',
                fontSize: '0.45rem',
              }}
            >
              •
            </Typography>
            <Typography
              sx={{
                color: isDarkMode ? 'grey.300' : 'text.primary',
                fontSize: 'x-small',
              }}
            >
              {pulseName}
            </Typography>
          </Stack>

          <Typography
            sx={{
              color: isDarkMode ? 'grey.100' : 'text.primary',
              fontSize: '12px',
              fontWeight: 'bold',
              ml: 0.5,
            }}
          >
            {title}
          </Typography>

          {meetingUrl && (
            <Link
              fontSize="small"
              href={meetingUrl}
              rel="noopener noreferrer"
              sx={{
                fontSize: '0.7rem',
              }}
              target="_blank"
              underline="hover"
            >
              {meetingUrl}
            </Link>
          )}

          <Stack
            alignItems="center"
            direction="row"
            spacing={0.5}
            sx={{ ml: 0.5 }}
          >
            <Box
              sx={{
                height: 16,
                transform: 'scale(0.7)',
                transformOrigin: 'left center',
              }}
            >
              <AudioVisualizer
                isPaused={status !== MeetingSessionStatus.Active}
              />
            </Box>

            <Typography
              sx={{
                color: isDarkMode ? 'grey.400' : 'text.secondary',
                fontSize: '10px',
              }}
            >
              {status === MeetingSessionStatus.Active
                ? t('recording_in_progress')
                : t('paused')}
            </Typography>
          </Stack>
        </Stack>

        <IconButton
          disabled={updateMeetingStatusPending || isEnding}
          onClick={() => handleTogglePlayStatus(meetingId, status)}
          sx={{
            '&:hover': {
              bgcolor: isDarkMode
                ? muiTheme.palette.error.dark
                : muiTheme.palette.error.light,
              color: muiTheme.palette.common.white,
            },
            bgcolor: isDarkMode ? 'grey.800' : 'common.white',
            border: 1,
            borderColor: isDarkMode ? 'grey.700' : 'divider',
            borderRadius: '50%',
            height: 32,
            width: 32,
          }}
        >
          {status === MeetingSessionStatus.Active ? (
            <HearingDisabled
              sx={{
                color: isDarkMode ? 'grey.300' : 'inherit',
                fontSize: '1rem',
              }}
            />
          ) : (
            <Hearing
              sx={{
                color: isDarkMode ? 'grey.300' : 'inherit',
                fontSize: '1rem',
                transform: 'scaleX(-1)',
              }}
            />
          )}
        </IconButton>
      </Stack>
      <Button
        color="inherit"
        disabled={updateMeetingStatusPending || isEnding}
        onClick={() => handleEndMeeting(meetingId)}
        startIcon={<StopCircleOutlined color="secondary" fontSize="small" />}
        sx={{
          '&.Mui-disabled': {
            borderColor: isDarkMode ? 'grey.700' : undefined,
            opacity: 0.5,
          },
          borderColor: 'divider',
          borderRadius: 4,
        }}
        variant="outlined"
      >
        <Typography fontWeight="bold" variant="caption">
          {isEnding ? `${t('ending')}...` : endButtonText}
        </Typography>
      </Button>
    </Stack>
  )
}
