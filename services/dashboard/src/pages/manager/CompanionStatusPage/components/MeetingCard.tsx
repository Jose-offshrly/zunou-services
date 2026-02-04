import { Circle } from '@mui/icons-material'
import { darken, Link, Stack, Typography } from '@mui/material'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import _ from 'lodash'

interface Props {
  meetingName: string
  meetingUrl: string
  pulseName: string
  date: string | null
  status: string | null
  isBotInvited: boolean
  color: string
}

function MeetingCard({
  meetingName,
  meetingUrl,
  pulseName,
  date,
  status,
  isBotInvited,
  color,
}: Props) {
  const { user } = useAuthContext()

  const tz = user?.timezone ?? 'UTC'

  const isUpcoming = !status // Scheduled

  const startDate = dayjs.tz(date, tz)

  const formattedDate = startDate.format('MMMM D, YYYY @ h:mm A')

  const snakeToTitleCase = (str: string): string => {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <Stack gap={1} sx={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
      <Typography
        fontSize="small"
        sx={{ fontWeight: '600', wordBreak: 'break-word' }}
      >
        {meetingName}
      </Typography>
      <Link
        href={meetingUrl}
        rel="noopener noreferrer"
        sx={{
          '&:hover': {
            color: 'primary.main',
          },
          color: 'text.secondary',
          display: 'block',
          fontSize: 'small',
          overflow: 'hidden',
          textDecoration: 'underline',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        target="_blank"
      >
        {meetingUrl}
      </Link>
      <Stack
        alignItems="center"
        divider={
          <Circle
            sx={{
              color: 'divider',
              height: 7,
              width: 7,
            }}
          />
        }
        flexDirection="row"
        gap={2}
      >
        <Stack flexDirection="row" gap={0.5}>
          <Typography fontSize={12}>In:</Typography>
          <Typography fontSize={12} title={pulseName}>
            {_.truncate(pulseName, { length: 20 })}
          </Typography>
        </Stack>
        <Stack flexDirection="row">
          <Typography fontSize={12}>{formattedDate}</Typography>
        </Stack>
      </Stack>
      <Stack alignItems="center" flexDirection="row" gap={1}>
        <Circle
          sx={{
            color: darken(color, 0.05),
            height: 12,
            width: 12,
          }}
        />
        <Typography fontSize={12}>
          {isUpcoming
            ? isBotInvited
              ? 'Bot is Invited'
              : 'No Bot Added'
            : snakeToTitleCase(status)}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default MeetingCard
