import {
  AccessTime,
  Add,
  Check,
  Circle,
  Close,
  ContentCopy,
  DeleteOutlined,
  LocationOnOutlined,
  VideocamOutlined,
} from '@mui/icons-material'
import {
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Event } from '@zunou-graphql/core/graphql'
import { useAttachGoogleMeetToEventMutation } from '@zunou-queries/core/hooks/useAttachGoogleMeetToEventMutation'
import { useUpdateEventMutation } from '@zunou-queries/core/hooks/useUpdateEventMutation'
import { Button, LoadingButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { Detail, Row } from './Layout'

const formatDate = (dateString: string): string => {
  return dayjs(dateString).format('dddd, MMM D')
}

const formatTime = (startAt: string, endAt: string): string => {
  const start = dayjs(startAt)
  const end = dayjs(endAt)
  const durationMin = end.diff(start, 'minute')

  let duration = ''
  if (durationMin >= 60) {
    const hours = Math.floor(durationMin / 60)
    const mins = durationMin % 60
    duration = mins > 0 ? `${hours}hr ${mins}min` : `${hours}hr`
  } else {
    duration = `${durationMin}min`
  }

  return `${start.format('h:mm A')} - ${end.format('h:mm A')} (${duration})`
}

interface MeetingHeaderProps {
  event?: Event
  onJoin: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetch: () => Promise<any>
}

export function MeetingHeader({ event, onJoin, refetch }: MeetingHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isEditingDateTime, setIsEditingDateTime] = useState(false)
  const [startTimeValue, setStartTimeValue] = useState('')
  const [endTimeValue, setEndTimeValue] = useState('')
  const [isUpdatingDateTime, setIsUpdatingDateTime] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [locationValue, setLocationValue] = useState('')
  const [isDeletingConferencing, setIsDeletingConferencing] = useState(false)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)

  const { user } = useAuthContext()

  const timezone = user?.timezone ?? 'UTC'

  // Prioritize using event if available
  const eventName = event?.name ?? 'Unknown'
  const startAt = event?.start_at && formatDate(event?.start_at)
  const endAt =
    event?.start_at && event?.end_at && formatTime(event.start_at, event.end_at)

  const location = event?.location
  const link = event?.link

  const {
    mutateAsync: attachLinkToEvent,
    isPending: isPendingAttachLinkToEvent,
  } = useAttachGoogleMeetToEventMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: updateEvent } = useUpdateEventMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleAddConferencing = () => {
    if (!event) return

    attachLinkToEvent(
      {
        eventId: event.id,
        // invite_pulse: true,
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          console.error('Error attaching Google Meet:', error)

          // graphql-request wraps errors in response.errors
          const errorMessage: string =
            error?.response?.errors?.[0]?.message ||
            error?.message ||
            'Failed to attach Google Meet'

          toast.error(errorMessage)
        },
        onSuccess: () => refetch(),
      },
    )
  }

  const handleDeleteConferencing = () => {
    if (!event) return

    setIsDeletingConferencing(true)
    updateEvent(
      {
        id: event.id,
        link: null,
      },
      {
        onError: () => {
          setIsDeletingConferencing(false)
        },
        onSuccess: () => {
          refetch()
          setIsDeletingConferencing(false)
        },
      },
    )
  }

  const handleEditLocation = () => {
    setLocationValue(location ?? '')
    setIsEditingLocation(true)
  }

  const handleEditName = () => {
    setNameValue(eventName)
    setIsEditingName(true)
  }

  const handleEditDateTime = () => {
    if (event?.start_at && event?.end_at) {
      // Mark the timezone WITHOUT converting the time
      const startZoned = dayjs(event.start_at).tz(timezone, true)
      const endZoned = dayjs(event.end_at).tz(timezone, true)
      setStartTimeValue(startZoned.format('YYYY-MM-DDTHH:mm'))
      setEndTimeValue(endZoned.format('YYYY-MM-DDTHH:mm'))
      setIsEditingDateTime(true)
    }
  }

  const handleSaveName = async () => {
    if (!event) return

    setIsUpdatingName(true)
    await updateEvent(
      {
        id: event.id,
        name: nameValue,
      },
      {
        onError: () => {
          setIsUpdatingName(false)
        },
        onSuccess: async () => {
          await refetch()
          setIsEditingName(false)
          setIsUpdatingName(false)
        },
      },
    )
  }

  const handleCancelName = () => {
    setIsEditingName(false)
    setNameValue('')
  }

  const handleSaveDateTime = async () => {
    if (!event) return

    setIsUpdatingDateTime(true)
    // Mark the timezone WITHOUT converting the time
    const startZoned = dayjs(startTimeValue).tz(timezone, true)
    const endZoned = dayjs(endTimeValue).tz(timezone, true)

    await updateEvent(
      {
        end_at: endZoned.format('YYYY-MM-DD HH:mm:ss'),
        id: event.id,
        start_at: startZoned.format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          const errorMessage: string =
            error?.response?.errors?.[0]?.message ||
            error?.message ||
            'Failed to update event date/time'
          toast.error(errorMessage)
          setIsUpdatingDateTime(false)
        },
        onSuccess: async () => {
          await refetch()
          setIsEditingDateTime(false)
          setIsUpdatingDateTime(false)
        },
      },
    )
  }

  const handleCancelDateTime = () => {
    setIsEditingDateTime(false)
    setStartTimeValue('')
    setEndTimeValue('')
  }

  const handleSaveLocation = async () => {
    if (!event) return

    setIsUpdatingLocation(true)
    await updateEvent(
      {
        id: event.id,
        location: locationValue || null,
      },
      {
        onError: () => {
          setIsUpdatingLocation(false)
        },
        onSuccess: async () => {
          await refetch()
          setIsEditingLocation(false)
          setIsUpdatingLocation(false)
        },
      },
    )
  }

  const handleCancelLocation = () => {
    setIsEditingLocation(false)
    setLocationValue('')
  }

  return (
    <Stack
      alignItems="stretch"
      borderBottom={1}
      direction="row"
      gap={6}
      justifyContent="space-between"
      pb={2}
      sx={{ borderColor: 'divider' }}
    >
      <Stack flexGrow={1} gap={2}>
        <Row>
          <Detail>
            <Circle sx={{ color: 'common.lime', fontSize: 15 }} />
            {isEditingName ? (
              <Stack alignItems="center" direction="row" gap={1}>
                <TextField
                  autoFocus={true}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveName()
                    } else if (e.key === 'Escape') {
                      handleCancelName()
                    }
                  }}
                  placeholder="Enter event name"
                  size="small"
                  sx={{ minWidth: 300 }}
                  value={nameValue}
                />
                <IconButton
                  disabled={isUpdatingName}
                  onClick={handleSaveName}
                  size="small"
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    height: 32,
                    width: 32,
                  })}
                >
                  {isUpdatingName ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Check sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
                <IconButton
                  disabled={isUpdatingName}
                  onClick={handleCancelName}
                  size="small"
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    height: 32,
                    width: 32,
                  })}
                >
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            ) : (
              <Typography
                fontWeight={500}
                onClick={handleEditName}
                sx={{
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                  cursor: 'pointer',
                }}
                variant="body2"
              >
                {eventName}
              </Typography>
            )}
          </Detail>
        </Row>

        <Detail>
          <AccessTime sx={{ color: 'text.secondary', fontSize: 16 }} />
          {isEditingDateTime ? (
            <Stack alignItems="center" direction="row" gap={1}>
              <Stack gap={1}>
                <TextField
                  InputLabelProps={{
                    shrink: true,
                  }}
                  label="Start"
                  onChange={(e) => setStartTimeValue(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                  type="datetime-local"
                  value={startTimeValue}
                />
                <TextField
                  InputLabelProps={{
                    shrink: true,
                  }}
                  label="End"
                  onChange={(e) => setEndTimeValue(e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
                  type="datetime-local"
                  value={endTimeValue}
                />
              </Stack>
              <Stack direction="row" gap={1}>
                <IconButton
                  disabled={isUpdatingDateTime}
                  onClick={handleSaveDateTime}
                  size="small"
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    height: 32,
                    width: 32,
                  })}
                >
                  {isUpdatingDateTime ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Check sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
                <IconButton
                  disabled={isUpdatingDateTime}
                  onClick={handleCancelDateTime}
                  size="small"
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    height: 32,
                    width: 32,
                  })}
                >
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            </Stack>
          ) : (
            <Stack
              onClick={handleEditDateTime}
              sx={{
                '&:hover': {
                  textDecoration: 'underline',
                },
                cursor: 'pointer',
              }}
            >
              <Typography variant="body2">{startAt}</Typography>
              <Typography variant="body2">{endAt}</Typography>
            </Stack>
          )}
        </Detail>

        <Detail>
          <LocationOnOutlined sx={{ color: 'text.secondary', fontSize: 16 }} />
          {isEditingLocation ? (
            <Stack alignItems="center" direction="row" gap={1}>
              <TextField
                autoFocus={true}
                onChange={(e) => setLocationValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveLocation()
                  } else if (e.key === 'Escape') {
                    handleCancelLocation()
                  }
                }}
                placeholder="Enter location"
                size="small"
                sx={{ minWidth: 300 }}
                value={locationValue}
              />
              <IconButton
                disabled={isUpdatingLocation}
                onClick={handleSaveLocation}
                size="small"
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.divider}`,
                  height: 32,
                  width: 32,
                })}
              >
                {isUpdatingLocation ? (
                  <CircularProgress size={16} />
                ) : (
                  <Check sx={{ fontSize: 16 }} />
                )}
              </IconButton>
              <IconButton
                disabled={isUpdatingLocation}
                onClick={handleCancelLocation}
                size="small"
                sx={(theme) => ({
                  border: `1px solid ${theme.palette.divider}`,
                  height: 32,
                  width: 32,
                })}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          ) : (
            <Typography
              fontWeight={500}
              onClick={handleEditLocation}
              sx={{
                '&:hover': {
                  textDecoration: 'underline',
                },
                cursor: 'pointer',
              }}
              variant="body2"
            >
              {location || 'Add location'}
            </Typography>
          )}
        </Detail>

        <Detail>
          <VideocamOutlined sx={{ color: 'text.secondary', fontSize: 16 }} />

          {(() => {
            return link ? (
              <Stack alignItems="center" direction="row" gap={2}>
                <Typography
                  component="a"
                  href={link}
                  rel="noopener noreferrer"
                  sx={{
                    '&:hover': { textDecoration: 'underline' },
                    color: 'primary.main',
                    textDecoration: 'none',
                  }}
                  target="_blank"
                  variant="body2"
                >
                  {link}
                </Typography>

                <Stack direction="row" gap={1}>
                  <IconButton
                    onClick={() => {
                      if (link) {
                        navigator.clipboard.writeText(link)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }
                    }}
                    size="small"
                    sx={(theme) => ({
                      border: `1px solid ${theme.palette.divider}`,
                      height: 32,
                      width: 32,
                    })}
                  >
                    {copied ? (
                      <Check
                        sx={{
                          fontSize: 16,
                        }}
                      />
                    ) : (
                      <ContentCopy
                        sx={{
                          fontSize: 16,
                        }}
                      />
                    )}
                  </IconButton>
                  <IconButton
                    disabled={isDeletingConferencing}
                    onClick={handleDeleteConferencing}
                    size="small"
                    sx={(theme) => ({
                      border: `1px solid ${theme.palette.divider}`,
                      height: 32,
                      width: 32,
                    })}
                  >
                    {isDeletingConferencing ? (
                      <CircularProgress size={16} />
                    ) : (
                      <DeleteOutlined fontSize="small" />
                    )}
                  </IconButton>
                </Stack>
              </Stack>
            ) : (
              <LoadingButton
                loading={isPendingAttachLinkToEvent}
                onClick={handleAddConferencing}
                size="small"
                startIcon={<Add />}
                sx={{
                  borderRadius: 9999,
                }}
                variant="outlined"
              >
                Add Conferencing
              </LoadingButton>
            )
          })()}
        </Detail>
      </Stack>

      <Stack justifyContent="space-between">
        <Button
          disabled={event && !event?.link}
          onClick={onJoin}
          variant={event ? 'outlined' : 'contained'}
        >
          Join
        </Button>
      </Stack>
    </Stack>
  )
}
