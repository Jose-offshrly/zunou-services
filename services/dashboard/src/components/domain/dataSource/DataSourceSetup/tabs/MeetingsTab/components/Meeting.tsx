import { AccessTime, CalendarToday } from '@mui/icons-material'
import { Avatar, Chip, Stack, Typography } from '@mui/material'
import { useCreateMeetingDataSourceMutation } from '@zunou-queries/core/hooks/useCreateMeetingDataSourceMutation'
import { useIgnoreMeetingMutation } from '@zunou-queries/core/hooks/useIgnoreMeetingMutation'
import firefliesIcon from '@zunou-react/assets/images/fireflies-icon.png'
import { LoadingButton } from '@zunou-react/components/form'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'

import { MeetingListIdentifier } from './ManageMeetings'

interface MeetingProps {
  id: string
  title: string
  organizer: string
  datetime: string
  mode: MeetingListIdentifier
  source: string
  status: string
  integrationId?: string | null
  profile?: string | null
}

export const Meeting = ({
  id,
  title,
  organizer,
  datetime,
  mode,
  source,
  status,
  integrationId = null,
  profile = null,
}: MeetingProps) => {
  const organization = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()

  const { mutate: ignoreMeeting, isPending: isPendingIgnoreMeeting } =
    useIgnoreMeetingMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutate: addMeeting, isPending: isPendingAddMeeting } =
    useCreateMeetingDataSourceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  // Parse datetime safely
  const parsedDate = new Date(datetime.replace(' ', 'T'))
  const isValidDate = !isNaN(parsedDate.getTime())

  // Format datetime only if valid
  const formattedDate = isValidDate
    ? new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        weekday: 'short',
        year: 'numeric',
      }).format(parsedDate)
    : null

  const formattedTime = isValidDate
    ? new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: true,
        minute: '2-digit',
      }).format(parsedDate)
    : null

  const ignoreHandler = () => {
    ignoreMeeting(
      {
        meetingId: id,
      },
      {
        onError: () => toast.error('Failed to ignore meeting.'),
        onSuccess: () => {
          toast.success('Successfully ignored meeting.')
        },
      },
    )
  }

  const addHandler = () => {
    if (!integrationId || !pulseId) return

    addMeeting(
      {
        integrationId,
        meetingId: id,
        organizationId: organization.organizationId,
        pulseId,
      },
      {
        onError: (error) => {
          toast.error('Failed to add meeting.')
          console.error('Failed to add meeting: ', error)
        },
        onSuccess: () => {
          toast.success(
            'Successfully added meeting. This may take a few minute to process.',
          )
        },
      },
    )
  }

  const RightSection = useMemo(() => {
    if (MeetingListIdentifier.ALL === mode)
      return status === 'added' || status === 'ignored' ? (
        <Typography color="primary.main">
          {status[0].toUpperCase() + status.substring(1).toLowerCase()}
        </Typography>
      ) : (
        <Stack direction={{ md: 'row' }} gap={1}>
          <LoadingButton
            loading={isPendingIgnoreMeeting}
            onClick={ignoreHandler}
            size="large"
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              color: 'text.primary',
              width: 90,
            }}
            variant="outlined"
          >
            Ignore
          </LoadingButton>
          <LoadingButton
            loading={isPendingAddMeeting}
            onClick={addHandler}
            size="large"
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              color: 'text.primary',
              width: 90,
            }}
            variant="outlined"
          >
            Add
          </LoadingButton>
        </Stack>
      )

    if (MeetingListIdentifier.ADDED === mode)
      return source === 'manual' ? (
        <Typography color="primary.main">
          {status[0].toUpperCase() + status.substring(1).toLowerCase()}
        </Typography>
      ) : (
        <Stack>
          <LoadingButton
            loading={isPendingIgnoreMeeting}
            onClick={ignoreHandler}
            size="large"
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              color: 'text.primary',
              width: 90,
            }}
            variant="outlined"
          >
            Ignore
          </LoadingButton>
        </Stack>
      )

    return (
      <Stack>
        <LoadingButton
          loading={isPendingAddMeeting}
          onClick={addHandler}
          size="large"
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            color: 'text.primary',
            width: 90,
          }}
          variant="outlined"
        >
          Add
        </LoadingButton>
      </Stack>
    )
  }, [mode, status, isPendingIgnoreMeeting, isPendingAddMeeting])

  return (
    <Stack
      direction="row"
      gap={2}
      sx={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 16px',
      }}
    >
      {/* Left Section */}
      <Stack alignItems="center" direction="row" spacing={2}>
        <Stack position="relative">
          {/* Avatar */}
          <Avatar src={profile ?? undefined} sx={{ height: 40, width: 40 }}>
            {profile
              ? null
              : organizer && getFirstLetter(organizer)?.toUpperCase()}
          </Avatar>
          {source === 'fireflies' && (
            <img
              alt="fireflies.ai"
              height={18}
              src={firefliesIcon}
              style={{
                bottom: -2,
                position: 'absolute',
                right: -2,
              }}
              width={18}
            />
          )}
        </Stack>

        {/* Meeting Info */}
        <Stack gap={1}>
          <Stack>
            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography color="text.primary" fontWeight="600">
                {title}
              </Typography>
              {/* Red Dot */}
              {!status && (
                <Chip
                  size="small"
                  sx={{
                    backgroundColor: 'red',
                    borderRadius: '50%',
                    height: 6,
                    width: 6,
                  }}
                />
              )}
            </Stack>

            <Typography color="text.secondary" fontSize={14}>
              {organizer}
            </Typography>
          </Stack>

          {/* Date & Time */}
          {isValidDate && (
            <Stack
              alignItems={{ lg: 'center' }}
              direction={{ lg: 'row' }}
              gap={{ lg: 2 }}
            >
              <Stack alignItems="center" direction="row" gap={0.5}>
                <CalendarToday sx={{ color: 'gray', fontSize: 14 }} />
                <Typography color="text.secondary" fontSize={14}>
                  {formattedDate}
                </Typography>
              </Stack>

              <Stack alignItems="center" direction="row" gap={0.5}>
                <AccessTime sx={{ color: 'gray', fontSize: 16 }} />
                <Typography color="text.secondary" fontSize={14}>
                  {formattedTime}
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>

      {/* Right Section */}
      {RightSection}
    </Stack>
  )
}
