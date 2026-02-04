import {
  AccessTime,
  CalendarToday,
  ErrorOutlineRounded,
  Group,
  Link as LinkIcon,
  SvgIconComponent,
} from '@mui/icons-material'
import { Box, FormLabel, Link, Stack, Typography } from '@mui/material'
import { alpha, SxProps, useTheme } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import {
  Event,
  MeetingSessionStatus,
  MeetingSessionType,
} from '@zunou-graphql/core/graphql'
import { useCreateMeetingSessionMutation } from '@zunou-queries/core/hooks/useCreateMeetingSessionMutation'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { Button, SelectField, SwitchInput } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import gcalIcon from '~/assets/gcal.png'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { getMeetingStatus as getMeetingStatusUtil } from '~/utils/meetingUtils'

dayjs.extend(isBetween)

interface MetadataProps {
  Icon: SvgIconComponent
  value: string | string[]
  type?: 'DEFAULT' | 'LINK'
  sx?: SxProps
}

interface FormData {
  pulseId: string
  addPulse: boolean
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

export interface EventWithInstanceId extends Event {
  eventInstanceId: string
}

const EventMeeting = ({
  googleCalendarMeeting,
  isVitalsMode,
}: {
  googleCalendarMeeting: EventWithInstanceId
  isVitalsMode: boolean
}) => {
  const {
    id,
    name,
    start_at,
    end_at,
    google_event_id,
    participants: rawParticipants,
    link,
    eventInstanceId,
  } = googleCalendarMeeting

  const queryClient = useQueryClient()
  const { setting } = useVitalsContext()
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const [showRecurringPrompt, setShowRecurringPrompt] = useState(false)

  const isDarkMode = setting.theme === 'dark' && isVitalsMode
  const muiTheme = useTheme()

  // Form control setup
  const { control, watch, setValue } = useForm<FormData>({
    defaultValues: {
      addPulse: false,
      pulseId: pulseId || '',
    },
  })

  const selectedPulseId = watch('pulseId')
  const pulseAdded = watch('addPulse')

  const {
    mutateAsync: createMeetingSession,
    isPending: isCreateMeetingSessionPending,
  } = useCreateMeetingSessionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const recurring_meeting_id = google_event_id?.split('_')[0]

  const participants = useMemo(
    () => rawParticipants.map((participants) => participants.email || '') || [],
    [rawParticipants],
  )

  const startDateObj = dayjs.tz(start_at, user?.timezone ?? 'UTC')
  const endDateObj = dayjs.tz(end_at, user?.timezone ?? 'UTC')

  const { data: pulsesData, isLoading: isLoadingPulses } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const pulseOptions = useMemo(
    () =>
      pulsesData
        ? pulsesData.pulses.map((pulse) => ({
            label: pulse.name,
            value: pulse.id,
          }))
        : [],
    [pulsesData],
  )

  // Meeting status calculation
  const getMeetingStatus = useMemo(
    () =>
      getMeetingStatusUtil({
        end: endDateObj,
        start: startDateObj,
        timezone: user?.timezone ?? 'UTC',
      }),
    [startDateObj, endDateObj, user?.timezone],
  )

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

  const handlePulseActiveChange = useCallback(() => {
    if (pulseAdded) return

    if (recurring_meeting_id) setShowRecurringPrompt(true)
    else handleJoinOnce()
  }, [recurring_meeting_id, pulseAdded])

  const handleCreateMeetingSession = (isRecurring: boolean) => {
    const targetPulseId = selectedPulseId || pulseId
    if (!targetPulseId) {
      toast.error('Pulse is Required.')
      return
    }

    createMeetingSession(
      {
        attendees: [],
        end_at,
        event_id: id,
        event_instance_id: eventInstanceId,
        external_attendees: participants,
        gcal_meeting_id: google_event_id,
        invite_pulse: true,
        meeting_url: link,
        name,
        organizationId,
        pulseId: targetPulseId,
        start_at,
        status: getMeetingStatus.status,
        type: MeetingSessionType.Meeting,
        ...(isRecurring
          ? { recurring_invite: true, recurring_meeting_id }
          : {}),
      },
      {
        onError: (error: unknown) => {
          let message = 'Failed to add meeting.'
          if (error && typeof error === 'object') {
            const err = error as {
              response?: { errors?: { message?: string }[] }
              message?: string
            }
            if (
              err.response &&
              Array.isArray(err.response.errors) &&
              err.response.errors[0]?.message
            ) {
              message = err.response.errors[0].message
            } else if (err.message) {
              message = err.message
            }
          }
          toast.error(message)
        },
        onSuccess: async () => {
          await queryClient.refetchQueries({
            queryKey: ['meetingSessions', organizationId, pulseId, user?.id],
          })

          await queryClient.invalidateQueries({
            queryKey: ['events', organizationId, pulseId],
          })

          toast.success('Meeting has been added.')
        },
      },
    )
  }

  const handleJoinOnce = () => {
    setShowRecurringPrompt(false)
    setValue('addPulse', true)
    handleCreateMeetingSession(false)
  }

  const handleJoinRecurring = () => {
    setShowRecurringPrompt(false)
    setValue('addPulse', true)
    handleCreateMeetingSession(recurring_meeting_id ? true : false)
  }

  const handleRecurringCancel = () => {
    setShowRecurringPrompt(false)
    setValue('addPulse', false)
  }

  return (
    <Stack
      sx={{
        bgcolor: isDarkMode ? 'grey.900' : muiTheme.palette.common.white,
        border: 1,
        borderColor: isDarkMode ? 'grey.500' : 'divider',
        borderRadius: 5,
        gap: 2,
        justifyContent: 'space-between',
        p: 3,
      }}
    >
      {/* Main */}
      <Stack direction="row" justifyContent="space-between" sx={{}}>
        <Stack gap={1} maxWidth="70%">
          <Stack alignItems="center" direction="row" gap={0.5}>
            <Typography
              sx={{ color: isDarkMode ? 'grey.100' : 'text.primary' }}
            >
              {name}
            </Typography>
            <img
              alt="Google Calendar"
              src={gcalIcon}
              style={{ height: 24, width: 24 }}
            />
          </Stack>
          {/* Url */}
          {link && (
            <Metadata
              Icon={LinkIcon}
              sx={{
                color: isDarkMode ? 'primary.light' : 'text.primary',
                textDecoration: 'underline',
              }}
              type="LINK"
              value={link}
            />
          )}

          <Stack alignItems="center" direction="row" gap={2}>
            {/* Date */}
            <Metadata
              Icon={CalendarToday}
              value={formattedStartDateTime?.date ?? ''}
            />

            {/* Time */}
            <Metadata
              Icon={AccessTime}
              value={`${formattedStartDateTime?.time} ${formattedStartDateTime && formattedEndDateTime ? '-' : ''} ${formattedEndDateTime?.time}`}
            />
          </Stack>
          {participants?.length > 0 && (
            <Metadata Icon={Group} value={participants ?? []} />
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
                textTransform: 'none',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {getMeetingStatus.label}
            </Box>
          </Stack>
        </Stack>
      </Stack>

      {/* Footer */}
      <Stack
        sx={{
          alignItems: 'end',
          borderColor: 'divider',
          flexDirection: 'row',
          gap: 2,
          justifyContent: 'end',
          mt: 2,
          width: '100%',
        }}
      >
        {/* <LoadingButton
          disabled={isSubmitting || !url}
          loading={isSubmitting}
          onClick={handleCreateMeetingSession}
          sx={{
            '&.Mui-disabled:not(.MuiLoadingButton-loading)': {
              bgcolor: 'grey.200',
              color: 'grey.400',
            },
          }}
          variant="text"
        >
          {url ? 'Add to Meetings' : 'No Meeting Link'}
        </LoadingButton> */}

        {showRecurringPrompt ? (
          <Stack
            bgcolor={(theme) => alpha(theme.palette.primary.light, 0.1)}
            borderRadius={1}
            gap={1}
            p={1.5}
            width="100%"
          >
            <Stack
              alignItems="center"
              color={(theme) => theme.palette.primary.main}
              direction="row"
              gap={1}
            >
              <ErrorOutlineRounded fontSize="small" />
              <Typography>Apply to one or all?</Typography>
            </Stack>
            <Stack borderBottom={1} borderColor="divider" pb={1}>
              <Typography fontSize="small">
                This is a recurring meeting. Choose your preference:
              </Typography>
            </Stack>

            <Stack
              alignItems="center"
              direction="row"
              gap={1}
              justifyContent="space-between"
              pt={1}
            >
              <Stack alignItems="center" direction="row" gap={1}>
                <Button onClick={handleJoinOnce} variant="outlined">
                  Join One
                </Button>
                <Button onClick={handleJoinRecurring} variant="contained">
                  Join All
                </Button>
              </Stack>

              <Stack>
                <Button onClick={handleRecurringCancel} variant="text">
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <>
            <Stack alignItems="center" direction="row" flex={1} gap={1}>
              <SwitchInput
                control={control}
                disabled={
                  getMeetingStatus.status === MeetingSessionStatus.Ended
                }
                id="addPulse"
                name="addPulse"
                onChange={handlePulseActiveChange}
              />
              <FormLabel htmlFor="pulseActive" sx={{ fontSize: 'small' }}>
                {isCreateMeetingSessionPending
                  ? 'Updating Pulse...'
                  : pulseAdded
                    ? 'Pulse Companion Added'
                    : 'No Pulse Companion Added'}
              </FormLabel>
            </Stack>
            {isVitalsMode && (
              <Box sx={{ width: 250 }}>
                <SelectField
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: isDarkMode
                          ? muiTheme.palette.grey[900]
                          : undefined,
                        color: isDarkMode
                          ? muiTheme.palette.common.white
                          : undefined,
                      },
                    },
                  }}
                  control={control}
                  disabled={isLoadingPulses}
                  name="pulseId"
                  options={pulseOptions}
                  placeholder="Select a Pulse"
                  required={isVitalsMode}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: isDarkMode
                        ? muiTheme.palette.grey[400]
                        : undefined,
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: isDarkMode
                          ? muiTheme.palette.grey[700]
                          : undefined,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: isDarkMode
                          ? muiTheme.palette.primary.main
                          : undefined,
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode
                          ? muiTheme.palette.grey[500]
                          : undefined,
                      },
                      backgroundColor: isDarkMode
                        ? muiTheme.palette.grey[900]
                        : undefined,
                      color: isDarkMode
                        ? muiTheme.palette.common.white
                        : undefined,
                    },
                    '& .MuiSelect-icon': {
                      color: isDarkMode
                        ? muiTheme.palette.grey[400]
                        : undefined,
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Stack>
    </Stack>
  )
}

export default EventMeeting
