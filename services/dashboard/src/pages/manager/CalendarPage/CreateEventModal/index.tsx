import {
  CalendarMonthOutlined,
  Close,
  LocationOnOutlined,
  PeopleOutlined,
  Search,
} from '@mui/icons-material'
import {
  alpha,
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { EventPriority, User } from '@zunou-graphql/core/graphql'
import { useCreateEventInstanceMutation } from '@zunou-queries/core/hooks/useCreateEventInstanceMutation'
import { useCreateEventMutation } from '@zunou-queries/core/hooks/useCreateEventMutation'
import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { format } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { getFirstLetter } from '~/utils/textUtils'

interface CreateEventModalProps {
  open: boolean
  onClose: (createdEventId?: string) => void
}

export const CreateEventModal = ({ open, onClose }: CreateEventModalProps) => {
  const { organizationId, pulseId } = useParams<{
    organizationId: string
    pulseId: string
  }>()
  const { user } = useAuthContext()

  const { mutateAsync: createEvent, isPending: isCreatingEvent } =
    useCreateEventMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const {
    mutateAsync: createEventInstance,
    isPending: isCreatingEventInstance,
  } = useCreateEventInstanceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const isPending = isCreatingEvent || isCreatingEventInstance

  const [title, setTitle] = useState('')
  const [date, setDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [endTime, setEndTime] = useState<Date>(new Date())
  const [location, setLocation] = useState('')
  const [includeMeetingLink, setIncludeMeetingLink] = useState(true)
  const [addToGoogleCalendar, setAddToGoogleCalendar] = useState(true)
  const importance = EventPriority.Medium // medium importance by default
  const [attendees, setAttendees] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const { t } = useTranslation('common')

  const { data: organizationUsersData } = useGetOrganizationUsersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })
  const orgUsers = organizationUsersData?.organizationUsers?.data ?? []

  const filteredOrgUsers = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim()
    if (!normalizedQuery) return orgUsers

    return orgUsers.filter(({ user }) => {
      const { name, email } = user
      return (
        name.toLowerCase().includes(normalizedQuery) ||
        email.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [orgUsers, searchQuery])

  // add current user to attendees by default when modal opens
  useEffect(() => {
    if (open && user && !attendees.some((a) => a.id === user.id)) {
      setAttendees([user])
    }
  }, [open, user])

  const handleToggleAttendee = (user: User) => {
    setAttendees((prev) => {
      const isSelected = prev.some((p) => p.id === user.id)
      if (isSelected) {
        return prev.filter((p) => p.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const handleRemoveAttendee = (userId: string) => {
    setAttendees((prev) => prev.filter((p) => p.id !== userId))
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Event title is required')
      return
    }

    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    if (!pulseId || !organizationId) {
      toast.error('Missing pulse or organization context')
      return
    }

    // start and end times should be relative to the selected date
    const startDateTime = new Date(date)
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0)

    const endDateTime = new Date(date)
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0)

    try {
      const result = await createEvent({
        attendees: attendees.map((a) => a.name),
        create_event: addToGoogleCalendar,
        date: format(date, 'yyyy-MM-dd'),
        end_at: endDateTime.toISOString(),
        invite_pulse: includeMeetingLink,
        location: location || 'Online', // location should be set to 'Online' to automatically create a meeting_session entry
        name: title,
        organization_id: organizationId,
        priority: importance,
        pulse_id: pulseId,
        start_at: startDateTime.toISOString(),
        user_id: user.id,
      })

      const eventId = result?.createEvent?.id
      if (eventId) {
        // Create an event instance for the newly created event
        await createEventInstance({
          event_id: eventId,
          organization_id: organizationId,
          pulse_id: pulseId,
        })
      }

      toast.success(t('event_created_successfully'))
      resetInputFields()
      onClose(eventId)
    } catch (error) {
      console.error('Failed to create event:', error)
      toast.error('Failed to create event. Please try again.')
    }
  }

  const resetInputFields = () => {
    setTitle('')
    setDate(new Date())
    setStartTime(new Date())
    setEndTime(new Date())
    setIncludeMeetingLink(true)
    setAttendees([])
    setSearchQuery('')
    setLocation('')
    setAddToGoogleCalendar(true)
  }

  return (
    <Dialog
      PaperProps={{
        sx: {
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          borderRadius: '20px',
          maxWidth: '700px',
          msOverflowStyle: 'none',
          py: 3,
          scrollbarWidth: 'none',
          width: '100%',
        },
      }}
      onClose={() => onClose()}
      open={open}
    >
      {/* Close Button */}
      <IconButton
        onClick={() => onClose()}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
        }}
      >
        <Close />
      </IconButton>

      <Stack spacing={3}>
        <Stack
          sx={{
            px: 3,
          }}
        >
          <Typography fontWeight={600} variant="h6">
            {t('create_event')}
          </Typography>
        </Stack>

        <Divider />

        <Stack
          spacing={3}
          sx={{
            px: 3,
          }}
        >
          {/* <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${lighten(theme.palette.primary.main, 0.5)}`,
              borderRadius: '6px',
              minWidth: 240,
              padding: 2,
              width: '100%',
            }}
          >
            <Box
              sx={{
                alignItems: 'center',
                backgroundColor: theme.palette.primary.main,
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                p: 1,
              }}
            >
              <SmartToyOutlined sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 500,
              }}
              variant="body2"
            >
              {t('pulse_companion_invited')}
            </Typography>
          </Stack> */}

          {/* Title Input */}
          <TextField
            fullWidth={true}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('add_title')}
            value={title}
            variant="outlined"
          />

          {/* Date and Time Pickers */}
          <Stack direction="row" spacing={2}>
            <DatePicker
              label={t('date')}
              onChange={(newDate) => newDate && setDate(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
              value={date}
            />
            <TimePicker
              label={t('start_time')}
              onChange={(newTime) => newTime && setStartTime(newTime)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
              value={startTime}
            />
            <TimePicker
              label={t('end_time')}
              onChange={(newTime) => newTime && setEndTime(newTime)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
              value={endTime}
            />
          </Stack>

          <Divider />

          {/* Importance Toggle */}
          {/* <Stack
            alignItems="center"
            direction="row"
            onClick={handleImportanceClick}
            sx={{ cursor: 'pointer', width: 'fit-content' }}
          >
            <Stack alignItems="center" direction="row" spacing={2}>
              <Box
                sx={{
                  alignItems: 'center',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  p: 1,
                }}
              >
                <OutlinedFlag
                  sx={{
                    color:
                      importance === EventPriority.High
                        ? 'error.main'
                        : importance === EventPriority.Low
                          ? 'success.main'
                          : 'text.secondary',
                  }}
                />
              </Box>
              <Box
                sx={{
                  borderRadius: '4px',
                  px: 1.5,
                  py: 0.5,
                  ...getImportanceStyles(),
                }}
              >
                <Typography
                  fontWeight={importance ? 600 : 400}
                  sx={{ color: 'inherit' }}
                  variant="body2"
                >
                  {getImportanceLabel()}
                </Typography>
              </Box>
            </Stack>
          </Stack> */}

          {/* Add attendees */}
          <Stack spacing={1}>
            <Stack alignItems="flex-start" direction="row">
              <Box
                sx={{
                  alignItems: 'center',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  p: 1,
                }}
              >
                <PeopleOutlined sx={{ fontSize: '20px' }} />
              </Box>

              <Stack spacing={1} sx={{ flex: 1, position: 'relative' }}>
                <OutlinedInput
                  endAdornment={
                    searchQuery && (
                      <IconButton
                        onClick={() => setSearchQuery('')}
                        size="small"
                        sx={{
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    )
                  }
                  fullWidth={true}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('add_attendees')}
                  size="small"
                  startAdornment={
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  }
                  value={searchQuery}
                />

                {/* Member List */}
                {searchQuery && (
                  <Stack
                    spacing={1}
                    sx={{
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      boxShadow: theme.shadows[1],
                      left: 0,
                      maxHeight: 200,
                      mt: 0.5,
                      overflow: 'auto',
                      p: 1,
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      zIndex: 1000,
                    }}
                  >
                    {filteredOrgUsers.length === 0 ? (
                      <Typography
                        color="text.secondary"
                        textAlign="center"
                        variant="body2"
                      >
                        No members found
                      </Typography>
                    ) : (
                      filteredOrgUsers.map(({ user }) => {
                        const isSelected = attendees.some(
                          (a) => a.id === user.id,
                        )

                        return (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleToggleAttendee(user)}
                                size="small"
                              />
                            }
                            key={user.id}
                            label={
                              <Stack
                                alignItems="center"
                                direction="row"
                                spacing={1}
                                sx={{ ml: 1 }}
                              >
                                <Avatar
                                  src={user.gravatar || undefined}
                                  sx={{ height: 32, width: 32 }}
                                  variant="rounded"
                                >
                                  {!user.gravatar && getFirstLetter(user.name)}
                                </Avatar>
                                <Stack>
                                  <Typography variant="body2">
                                    {user.name}
                                  </Typography>
                                  <Typography
                                    color="text.secondary"
                                    variant="caption"
                                  >
                                    {user.email}
                                  </Typography>
                                </Stack>
                              </Stack>
                            }
                          />
                        )
                      })
                    )}
                  </Stack>
                )}

                {/* Selected Attendees */}
                {attendees.length > 0 && (
                  <Stack spacing={1}>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {attendees.map((user) => (
                        <Stack
                          alignItems="center"
                          direction="row"
                          key={user.id}
                          spacing={1}
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            border: 1,
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.75,
                          }}
                        >
                          <Avatar
                            src={user.gravatar || undefined}
                            sx={{ height: 24, width: 24 }}
                            variant="rounded"
                          >
                            {!user.gravatar && getFirstLetter(user.name)}
                          </Avatar>
                          <Typography variant="body2">{user.name}</Typography>
                          <IconButton
                            onClick={() => handleRemoveAttendee(user.id)}
                            size="small"
                            sx={{ ml: 0.5, p: 0.25 }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Stack>

          <Divider />

          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
          >
            {/* Meeting Link Switch */}
            <Stack alignItems="center" direction="row" spacing={1}>
              <Box
                sx={{
                  alignItems: 'center',
                  backgroundColor: theme.palette.primary.main + '19',
                  borderRadius: '7px',
                  display: 'flex',
                  justifyContent: 'center',
                  p: 1,
                }}
              >
                <LocationOnOutlined
                  sx={{ color: 'primary.main', fontSize: '19px' }}
                />
              </Box>
              <Stack>
                <Typography>{t('meeting_link')}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>
                  {t('meeting_link_description')}
                </Typography>
              </Stack>
            </Stack>
            <Switch
              checked={includeMeetingLink}
              onChange={(e) => setIncludeMeetingLink(e.target.checked)}
            />
          </Stack>

          {/* Location Input - Only shown when user does not include a meeting link, meaning event is not online */}
          {!includeMeetingLink && (
            <TextField
              fullWidth={true}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('add_location')}
              value={location}
              variant="outlined"
            />
          )}

          {/* Add to Google Calendar Checkbox */}
          <Stack direction="row" justifyContent="space-between">
            <Stack alignItems="center" direction="row" spacing={1}>
              <Box
                sx={{
                  alignItems: 'center',
                  backgroundColor: theme.palette.primary.main + '19',
                  borderRadius: '7px',
                  display: 'flex',
                  justifyContent: 'center',
                  p: 1,
                }}
              >
                <CalendarMonthOutlined
                  sx={{ color: 'primary.main', fontSize: '19px' }}
                />
              </Box>
              <Stack>
                <Typography>{t('add_to_google_calendar')}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>
                  {t('add_to_google_calendar_description')}
                </Typography>
              </Stack>
            </Stack>
            <Switch
              checked={addToGoogleCalendar}
              onChange={(e) => setAddToGoogleCalendar(e.target.checked)}
            />
          </Stack>

          {/* Save Button */}
          <Stack direction="row" justifyContent="flex-end">
            <Button
              disabled={isPending}
              onClick={handleSave}
              sx={{ px: 2, textTransform: 'none' }}
              variant="contained"
            >
              {isPending ? `${t('saving')}...` : t('save')}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Dialog>
  )
}

export default CreateEventModal
