import {
  AccessTime,
  CalendarToday,
  Group,
  Hearing,
  HearingDisabled,
  Link as LinkIcon,
  StopCircleOutlined,
  SvgIconComponent,
} from '@mui/icons-material'
import { FormLabel, Link, Typography } from '@mui/material'
import { Box, Stack, SxProps, useTheme } from '@mui/system'
import {
  MeetingSession,
  MeetingSessionStatus,
} from '@zunou-graphql/core/graphql'
import {
  UpdateMeetingSessionInvitePulseInputWithPulseAndOrgId,
  useUpdateMeetingSessionInvitePulseMutation,
} from '@zunou-queries/core/hooks/useUpdateMeetingSessionInvitePulseMutation'
import { useUpdateMeetingSessionMutation } from '@zunou-queries/core/hooks/useUpdateMeetingSessionMutation'
import { Button, IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { SwitchInput } from 'zunou-react/components/form/SwitchInput'

import gcalIcon from '~/assets/gcal.png'
import { AudioVisualizer } from '~/components/ui/AudioVisualizer'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { toTitleCase } from '~/utils/toTitleCase'

interface MetadataProps {
  Icon: SvgIconComponent
  value: string | string[]
  type?: 'DEFAULT' | 'LINK'
  sx?: SxProps
}

const Metadata = ({ Icon, value, sx, type = 'DEFAULT' }: MetadataProps) => {
  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'
  const isArray = Array.isArray(value)
  const [expanded, setExpanded] = useState(false)

  const MAX = 5

  const displayItems = isArray
    ? expanded
      ? value
      : value.slice(0, MAX)
    : [value]

  const toggle = () => setExpanded((prev) => !prev)

  return (
    <Stack alignItems="start" direction="row" gap={0.5}>
      <Icon
        sx={{
          color: isDarkMode ? 'grey.400' : 'text.secondary',
          fontSize: 14,
          pt: 0.5,
        }}
      />
      {type === 'LINK' && !isArray ? (
        <Link
          fontSize="small"
          href={value}
          rel="noopener noreferrer"
          sx={{
            fontSize: 'small',
          }}
          target="_blank"
          underline="hover"
        >
          {value}
        </Link>
      ) : (
        <Typography
          color={isDarkMode ? 'grey.400' : 'text.secondary'}
          fontSize="small"
          sx={sx}
        >
          {isArray ? displayItems.join(', ') : value}
          {isArray && value.length > MAX && (
            <>
              {', '}
              <Typography
                component="button"
                onClick={toggle}
                sx={{
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                  background: 'none',
                  border: 'none',
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontSize: 'small',
                  ml: 0.5,
                  p: 0,
                }}
              >
                {expanded ? 'See less' : `+${value.length - MAX} more`}
              </Typography>
            </>
          )}
        </Typography>
      )}
    </Stack>
  )
}

interface FormState {
  pulseActive: boolean
  recording: boolean
}

interface MeetingProps {
  meeting: MeetingSession
  onClick?: (() => void) | null
  isGoogleCalMode?: boolean
  isVitalsMode?: boolean
}

export const useMeetingPulse = (meetingId?: string) => {
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()
  const [isEnding, setEnding] = useState(false)
  const [isToggling, setToggling] = useState(false)

  const {
    mutateAsync: updateInvitePulse,
    isPending: isUpdateInvitePulsePending,
  } = useUpdateMeetingSessionInvitePulseMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: updateMeetingStatus } = useUpdateMeetingSessionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateInvitePulseStatus = async (
    invitePulse: boolean,
    onSuccess?: () => void,
    isActive = false,
  ) => {
    if (!meetingId) return

    if (isActive) {
      await updateMeetingStatus(
        {
          meetingSessionId: meetingId,
          organizationId,
          pulseId,
          status: MeetingSessionStatus.Start,
        },
        {
          onError: (error) => {
            console.error('Error adding pulse to meeting:', error)
            toast.error('Failed to add pulse to meeting')
          },
          onSettled: () => setEnding(false),

          onSuccess: () => toast.success('Pulse added to meeting!'),
        },
      )
    } else {
      const input: UpdateMeetingSessionInvitePulseInputWithPulseAndOrgId = {
        invite_pulse: invitePulse,
        meetingSessionId: meetingId,
        organizationId,
        pulseId,
      }

      await updateInvitePulse(input, {
        onError: (error) => {
          console.error('Error updating invite_pulse:', error)
          toast.error('Failed to update pulse status')
        },
        onSuccess: () => {
          toast.success(
            invitePulse
              ? 'Pulse added to meeting'
              : 'No pulse added to meeting',
          )
          onSuccess?.()
        },
      })
    }
  }

  const endMeeting = async () => {
    if (!meetingId) return

    setEnding(true)

    await updateMeetingStatus(
      {
        meetingSessionId: meetingId,
        status: MeetingSessionStatus.Stopped,
      },
      {
        onError: (error) => {
          console.error('Error updating meeting status:', error)
          toast.error('Failed to end meeting')
        },
        onSettled: () => setEnding(false),

        onSuccess: () => toast.success('Meeting ended successfully!'),
      },
    )
  }

  // Toggle between Active and Paused
  const toggleMeeting = async (
    status: MeetingSessionStatus.Active | MeetingSessionStatus.Paused,
  ) => {
    if (!meetingId) return

    setToggling(true)

    await updateMeetingStatus(
      {
        meetingSessionId: meetingId,
        status,
      },
      {
        onError: (error) => {
          console.error('Error updating meeting status:', error)
          toast.error('Failed to toggle meeting status')
        },
        onSettled: () => setToggling(false),
        onSuccess: () => toast.success(`Meeting is ${toTitleCase(status)}`),
      },
    )
  }

  return {
    endMeeting,
    isEnding,

    isToggling,
    isUpdateInvitePulsePending,

    toggleMeeting,
    updateInvitePulseStatus,
  }
}

export const Meeting = ({
  meeting,
  onClick = null,
  isVitalsMode,
}: MeetingProps) => {
  const {
    attendees,
    external_attendees,
    id,
    invite_pulse,
    meetingUrl,
    name,
    start_at,
    end_at,
    status,
    gcal_meeting_id,
  } = meeting

  const {
    updateInvitePulseStatus,
    endMeeting,
    isEnding,
    toggleMeeting,
    isToggling,
    isUpdateInvitePulsePending,
  } = useMeetingPulse(id)

  const { user } = useAuthContext()

  const [isLiveWithPulse, setLiveWithPulse] = useState(false)

  const startDateObj = start_at
    ? dayjs.tz(start_at, user?.timezone ?? 'UTC')
    : null

  const endDateObj = end_at ? dayjs.tz(end_at, user?.timezone ?? 'UTC') : null

  const { setting } = useVitalsContext()

  const muiTheme = useTheme()
  const isDarkMode = setting.theme === 'dark' && isVitalsMode

  const { control, watch, setValue } = useForm<FormState>({
    defaultValues: {
      pulseActive: invite_pulse,
      recording: status === MeetingSessionStatus.Active,
    },
  })

  const pulseActive = watch('pulseActive')
  const recording = watch('recording')

  const participants: string[] = useMemo(() => {
    // Extract internal attendees with valid email
    const internalAttendees = attendees
      .map((attendee) => {
        const email = attendee?.user?.email
        const name = attendee?.user?.name
        return email ? { email, name: name ?? null } : null
      })
      .filter((a): a is { email: string; name: string | null } => a !== null)

    // Extract external attendees with non-null emails
    const externalAttendees = (external_attendees ?? [])
      .filter((email): email is string => typeof email === 'string' && !!email)
      .map((email) => ({ email, name: null }))

    // Combine all attendees
    const combined: { email: string; name: string | null }[] = [
      ...internalAttendees,
      ...externalAttendees,
    ]

    // Deduplicate using email as the key
    const uniqueByEmail = Object.values(
      combined.reduce<Record<string, { email: string; name: string | null }>>(
        (acc, curr) => {
          acc[curr.email] = curr // safe: curr.email is guaranteed to be string
          return acc
        },
        {},
      ),
    )

    // Use name if available, otherwise email
    return uniqueByEmail.map((person) => person.name || person.email)
  }, [attendees, external_attendees])

  useEffect(() => {
    setValue('pulseActive', invite_pulse)
  }, [invite_pulse, setValue])

  useEffect(() => {
    setValue('recording', status === MeetingSessionStatus.Active)
  }, [status, setValue])

  const handlePulseActiveChange = async (checked: boolean) => {
    await updateInvitePulseStatus(
      checked,
      () => {
        setValue('pulseActive', checked)
      },
      status === MeetingSessionStatus.Active,
    )
  }

  const handleRecordingChange = () => {
    const newRecording = !recording
    setValue('recording', newRecording)

    if (newRecording) toggleMeeting(MeetingSessionStatus.Active)
    else toggleMeeting(MeetingSessionStatus.Paused)
  }

  // Meeting status calculation
  const getMeetingStatus = useMemo(() => {
    const timezone = user?.timezone ?? 'UTC'

    const now = dayjs().tz(timezone)
    const start = dayjs(startDateObj).tz(timezone)
    const end = dayjs(endDateObj).tz(timezone)

    if (
      status === MeetingSessionStatus.Ended ||
      status == MeetingSessionStatus.Stopped
    ) {
      return {
        bgColor: theme.palette.common.sky,
        label: 'Meeting Finished',
        status: MeetingSessionStatus.Ended,
        textColor: theme.palette.text.secondary,
      }
    } else if (now.isBetween(start, end, undefined, '[]')) {
      return {
        bgColor: theme.palette.common.pastelGreen,
        label: 'Happening now',
        status: MeetingSessionStatus.Active,
        textColor: theme.palette.common.lime,
      }
    }

    if (now.isBefore(start)) {
      const diffMins = start.diff(now, 'minutes')
      const diffHours = start.diff(now, 'hours')
      const diffDays = start.diff(now, 'days')

      if (diffDays > 0) {
        return {
          bgColor: theme.palette.grey[200],
          label: `Happening in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
          status: MeetingSessionStatus.Inactive,
          textColor: theme.palette.text.secondary,
        }
      } else if (diffHours > 0) {
        return {
          bgColor: theme.palette.common.cream,
          label: `Happening in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`,
          status: MeetingSessionStatus.Inactive,
          textColor: theme.palette.text.secondary,
        }
      } else {
        return {
          bgColor: theme.palette.common.pink,
          label: `Happening in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`,
          status: MeetingSessionStatus.Inactive,
          textColor: theme.palette.error.main,
        }
      }
    }

    return {
      bgColor: theme.palette.common.sky,
      label: 'Meeting Finished',
      status: MeetingSessionStatus.Ended,
      textColor: theme.palette.text.secondary,
    }
  }, [startDateObj, endDateObj, user?.timezone, status])

  useEffect(() => {
    setLiveWithPulse(
      (getMeetingStatus.status === MeetingSessionStatus.Active ||
        getMeetingStatus.status === MeetingSessionStatus.Paused) &&
        invite_pulse,
    )
  }, [getMeetingStatus, invite_pulse])

  const formattedStartDateTime = useMemo(() => {
    if (!startDateObj) return null

    return {
      date: startDateObj.format('ddd, MMMM D, YYYY'), // e.g. "Thu, May 15, 2025"
      time: startDateObj.format('h:mm A'), // e.g. "12:00 PM"
    }
  }, [startDateObj])

  const formattedEndDateTime = useMemo(() => {
    if (!endDateObj) return null

    return {
      date: endDateObj.format('ddd, MMMM D, YYYY'),
      time: endDateObj.format('h:mm A'),
    }
  }, [endDateObj])

  const handleEndMeeting = () => {
    endMeeting()
  }

  return (
    <Stack
      onClick={onClick || undefined}
      sx={{
        bgcolor: isLiveWithPulse
          ? isDarkMode
            ? 'rgba(0, 128, 0, 0.05)'
            : '#F6FCFA80'
          : isDarkMode
            ? 'grey.900'
            : muiTheme.palette.common.white,
        border: 1,
        borderColor: isLiveWithPulse
          ? theme.palette.common.lime
          : isDarkMode
            ? 'grey.700'
            : 'divider',
        borderRadius: 5,
        cursor: onClick ? 'pointer' : 'default',
        gap: 5,
        justifyContent: 'space-between',
        padding: 3,
      }}
    >
      {/* Main */}
      <Stack gap={1}>
        {gcal_meeting_id && (
          <Stack alignItems="center" direction="row" gap={1}>
            <img
              alt="Google Calendar"
              src={gcalIcon}
              style={{ height: 24, width: 24 }}
            />

            <Typography
              color="text.secondary"
              sx={{
                textTransform: 'uppercase',
              }}
              variant="caption"
            >
              Google Calendar
            </Typography>
          </Stack>
        )}

        <Stack direction="row" justifyContent="space-between">
          <Stack gap={1} maxWidth="70%">
            <Stack alignItems="center" direction="row" gap={0.5}>
              <Typography
                sx={{ color: isDarkMode ? 'grey.100' : 'text.primary' }}
              >
                {name}
              </Typography>
            </Stack>
            {/* Url */}
            <Metadata
              Icon={LinkIcon}
              sx={{
                color: isDarkMode ? 'primary.light' : 'text.primary',
                textDecoration: 'underline',
              }}
              type={'LINK'}
              value={meetingUrl}
            />
            <Stack alignItems="center" direction="row" gap={2}>
              {/* Date */}
              <Metadata
                Icon={CalendarToday}
                value={formattedStartDateTime?.date ?? ''}
              />

              {/* Time */}
              <Metadata
                Icon={AccessTime}
                value={`${formattedStartDateTime?.time ?? ''} ${formattedStartDateTime && formattedEndDateTime ? '-' : ''} ${formattedEndDateTime?.time}`}
              />
            </Stack>
            {participants.length > 0 && (
              <Metadata Icon={Group} value={participants} />
            )}
          </Stack>

          <Stack alignItems="center" justifyContent="space-between">
            <Stack direction="row">
              <Box
                sx={{
                  bgcolor: getMeetingStatus.bgColor,
                  borderRadius: 9999,
                  color: getMeetingStatus.textColor,
                  fontSize: 'small',
                  px: 2,
                  py: 0.5,
                  textAlign: 'center',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}
              >
                {getMeetingStatus.label}
              </Box>
            </Stack>

            {isLiveWithPulse && <AudioVisualizer isPaused={!recording} />}
          </Stack>
        </Stack>
      </Stack>

      {/* Footer */}

      <Stack
        borderTop={1}
        sx={{
          borderColor: 'divider',
          flexDirection: 'row',
          justifyContent: 'space-between',
          pt: 2,
        }}
      >
        {isLiveWithPulse ? (
          <Button
            color="inherit"
            disabled={isEnding || isToggling}
            onClick={handleEndMeeting}
            startIcon={
              <StopCircleOutlined color="secondary" fontSize="small" />
            }
            sx={{
              borderColor: 'divider',
              borderRadius: 9999,
              textTransform: 'none',
            }}
            variant="outlined"
          >
            <Typography fontWeight="bold" variant="caption">
              {isEnding ? 'Ending...' : 'End Recording'}
            </Typography>
          </Button>
        ) : (
          <Stack alignItems="center" direction="row" gap={1}>
            <SwitchInput
              control={control}
              disabled={
                status === MeetingSessionStatus.Ended ||
                isUpdateInvitePulsePending
              }
              id="pulseActive"
              name="pulseActive"
              onChange={handlePulseActiveChange}
            />
            <FormLabel htmlFor="pulseActive" sx={{ fontSize: 'small' }}>
              {isUpdateInvitePulsePending
                ? 'Updating Pulse...'
                : pulseActive
                  ? 'Pulse Added'
                  : 'No Pulse Added'}
            </FormLabel>
          </Stack>
        )}

        {isLiveWithPulse && (
          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            sx={{
              visibility:
                status === MeetingSessionStatus.Active ||
                status === MeetingSessionStatus.Paused
                  ? 'visible'
                  : 'hidden',
            }}
          >
            <IconButton
              disabled={status === MeetingSessionStatus.Ended || isToggling}
              onClick={handleRecordingChange}
              sx={{
                '&:hover': {
                  bgcolor: isDarkMode
                    ? muiTheme.palette.error.main
                    : muiTheme.palette.error.light,
                  color: muiTheme.palette.common.white,
                },
                bgcolor: isDarkMode ? 'grey.400' : 'background.paper',
                border: 1,
                borderColor: isDarkMode ? 'grey.700' : 'divider',
                borderRadius: '50%',
              }}
            >
              {!recording ? (
                <HearingDisabled color="inherit" fontSize="small" />
              ) : (
                <Hearing fontSize="small" sx={{ transform: 'scaleX(-1)' }} />
              )}
            </IconButton>

            <Typography variant="caption">
              {recording ? 'Recording in progress' : 'Paused'}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
