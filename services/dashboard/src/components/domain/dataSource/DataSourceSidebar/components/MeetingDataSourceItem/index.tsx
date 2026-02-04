import {
  Hearing,
  HearingDisabled,
  StopCircleOutlined,
} from '@mui/icons-material'
import { Divider, IconButton, Link, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import {
  MeetingSessionStatus,
  MeetingSessionType,
} from '@zunou-graphql/core/graphql'
import { Button, Chip } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { AudioVisualizer } from '~/components/ui/AudioVisualizer'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

export interface MeetingDataSourceItemProps {
  id: string
  title: string
  status: MeetingSessionStatus.Active | MeetingSessionStatus.Paused
  onToggleStatus: () => Promise<void>
  onEndMeeting: () => Promise<void>
  showAudioVisualizer?: boolean
  type?: MeetingSessionType
  meetingUrl?: string | null
  showControls?: boolean
  initialCompanionStatus: string | null
}

// Function to get status background color
const getStatusBackgroundColor = (status: string | null) => {
  if (!status) return alpha(theme.palette.grey[400], 0.2)

  switch (status) {
    case 'waiting_to_join':
      return alpha(theme.palette.common.dandelion, 0.1)
    case 'in_meeting':
    case 'paused':
    case 'finished':
      return alpha(theme.palette.common.lime, 0.3)
    case 'recorder_unavailable':
    case 'service_unavailable':
      return alpha(theme.palette.error.main, 0.3)
    default:
      return alpha(theme.palette.grey[400], 0.2)
  }
}

export const MeetingDataSourceItem = ({
  id,
  title,
  status,
  onToggleStatus,
  onEndMeeting,
  showAudioVisualizer = true,
  type = MeetingSessionType.Meeting,
  meetingUrl = null,
  showControls = true,
  initialCompanionStatus = null,
}: MeetingDataSourceItemProps) => {
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const [isEnding, setEnding] = useState(false)
  const [isToggling, setToggling] = useState(false)
  const queryClient = useQueryClient()

  const [currentStatus, setCurrentStatus] = useState<string | null>(
    initialCompanionStatus,
  )

  const hasBotJoined =
    currentStatus === 'in_meeting' || currentStatus === 'paused'

  const handleMeetingSessionEnded = useCallback(() => {
    // Invalidate all queries that has meetingSessions key
    queryClient.invalidateQueries({
      exact: false,
      queryKey: ['meetingSessions'],
    })

    // Invalidate collabs
    queryClient.invalidateQueries({
      queryKey: ['collabs', organizationId, pulseId],
    })
  }, [queryClient, organizationId, pulseId])

  usePusherChannel({
    channelName: `meeting-session.${id}`,
    eventName: '.meeting-session-ended',
    onEvent: handleMeetingSessionEnded,
  })

  const handleCompanionStatusUpdated = useCallback(
    (response: { data: { status: string } }) => {
      setCurrentStatus(response.data.status)
    },
    [],
  )

  usePusherChannel({
    channelName: `companion-status.${id}`,
    eventName: '.companion-status-updated',
    onEvent: handleCompanionStatusUpdated,
  })

  const endButtonText =
    type === MeetingSessionType.Collab ? 'End Collab' : 'End Recording'

  const handleEndMeeting = async () => {
    setEnding(true)

    await onEndMeeting()

    setEnding(false)
  }

  const handleToggleMeeting = async () => {
    try {
      setToggling(true)

      await onToggleStatus()
    } catch (error) {
      toast.error('Meeting toggle has failed.')
    } finally {
      setToggling(false)
    }
  }

  return (
    <Stack
      divider={<Divider />}
      key={id}
      padding={1.5}
      spacing={1.5}
      sx={{
        bgcolor: alpha(theme.palette.common.lime, 0.05),
        border: 1,
        borderColor: 'common.lime',
        borderRadius: 2,
      }}
    >
      {
        <Stack
          alignItems="center"
          borderRadius={1}
          justifyContent="center"
          px={2}
          py={1}
          sx={{
            backgroundColor: getStatusBackgroundColor(currentStatus),
          }}
        >
          {currentStatus ? (
            <Typography color="text.secondary" fontSize="small">
              {currentStatus
                .split('_')
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
                )
                .join(' ')}
            </Typography>
          ) : (
            <Typography color="text.secondary" fontSize="small">
              Starting...
            </Typography>
          )}
        </Stack>
      }
      <Stack spacing={0.5}>
        <Chip
          label={
            <Typography color="common.white" fontSize={12}>
              LIVE
            </Typography>
          }
          size="small"
          sx={{
            bgcolor: 'common.lime',
            paddingX: 0.5,
            width: 'fit-content',
          }}
        />
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography
            fontWeight="bold"
            sx={{
              flex: 1,
              minWidth: 0,
              wordBreak: 'break-word',
            }}
            variant="body2"
          >
            {title}
          </Typography>
          {showControls && hasBotJoined && (
            <IconButton
              disabled={isEnding || isToggling}
              onClick={handleToggleMeeting}
              size="small"
              sx={{
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              {status === MeetingSessionStatus.Active ? (
                <HearingDisabled fontSize="small" />
              ) : (
                <Hearing fontSize="small" sx={{ transform: 'scaleX(-1)' }} />
              )}
            </IconButton>
          )}
        </Stack>

        {showAudioVisualizer && hasBotJoined && (
          <Stack alignItems="center" direction="row" spacing={1}>
            <AudioVisualizer
              isPaused={status === MeetingSessionStatus.Paused}
              size="small"
            />
            <Typography color="grey.400" variant="caption">
              {status === MeetingSessionStatus.Active
                ? 'Recording in progress'
                : 'Paused'}
            </Typography>
          </Stack>
        )}

        {meetingUrl && showControls && (
          <Link
            fontSize="small"
            href={meetingUrl}
            rel="noopener noreferrer"
            sx={{
              display: 'block',
              fontSize: '0.7rem',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            target="_blank"
            title={meetingUrl}
            underline="hover"
          >
            {meetingUrl}
          </Link>
        )}
      </Stack>
      {showControls ? (
        <Button
          color="inherit"
          disabled={isEnding || isToggling}
          onClick={handleEndMeeting}
          startIcon={<StopCircleOutlined color="secondary" fontSize="small" />}
          sx={{ borderColor: 'divider', borderRadius: 4 }}
          variant="outlined"
        >
          <Typography fontWeight="bold" variant="caption">
            {isEnding ? 'Ending...' : endButtonText}
          </Typography>
        </Button>
      ) : (
        meetingUrl && (
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
        )
      )}
    </Stack>
  )
}
