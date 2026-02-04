import { Circle } from '@mui/icons-material'
import { Link, Stack, Typography } from '@mui/material'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import _ from 'lodash'

interface CompanionCardProps {
  botName: string
  meetingName: string
  meetingUrl: string
  date: string | null
  status: string | null
  startedAt: string | null
  joinedAt: string | null
  endedAt: string | null
}

function CompanionCard({
  botName,
  meetingName,
  meetingUrl,
  date,
  status,
  startedAt,
  joinedAt,
  endedAt,
}: CompanionCardProps) {
  const { user } = useAuthContext()

  const FORMAT = 'MMMM D, YYYY @ h:mm A'

  const isScheduled = !status

  const tz = user?.timezone ?? 'UTC'

  const startDate = dayjs.tz(date, tz)

  // Came from pulse companion details, datetime are in UTC
  const startedAtDate = dayjs.utc(startedAt).tz(tz)
  const joinedAtDate = dayjs.utc(joinedAt).tz(tz)
  const endedAtDate = dayjs.utc(endedAt).tz(tz)

  const formattedDate = startDate.format(FORMAT)

  const approxJoinDate = startDate.subtract(2, 'minute').format(FORMAT)

  return (
    <Stack gap={0.5} sx={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
      <Typography
        fontSize="small"
        fontWeight={600}
        sx={{ wordBreak: 'break-word' }}
      >
        {botName}
      </Typography>
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
        <Typography fontSize={12} title={meetingName}>
          {_.truncate(meetingName, { length: 20 })}
        </Typography>
        <Stack flexDirection="row">
          <Typography fontSize={12}>{formattedDate}</Typography>
        </Stack>
      </Stack>
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
      <Stack mt={2}>
        {isScheduled && (
          <Typography
            color="text.secondary"
            fontSize={12}
            title="Indicates when the bot is scheduled to join — approximately 2 minutes before the meeting starts."
          >
            Scheduled to join at: {approxJoinDate}
          </Typography>
        )}

        {status === 'waiting_to_join' && (
          <Typography
            color="text.secondary"
            fontSize={12}
            title="Uses the 'started_at' timestamp — marks the time the endpoint was called to initiate the meeting entry."
          >
            Waiting to join since: {startedAtDate.format(FORMAT)}
          </Typography>
        )}

        {(status === 'in_meeting' || status === 'paused') && (
          <Typography
            color="text.secondary"
            fontSize={12}
            title="Uses the 'joined_at' timestamp — the exact time the bot was admitted into the meeting."
          >
            Joined meeting at: {joinedAtDate.format(FORMAT)}
          </Typography>
        )}

        {(status === 'not_admitted' || status === 'finished') && (
          <Typography
            color="text.secondary"
            fontSize={12}
            title="Uses the 'ended_at' timestamp — the time the bot left or was removed from the meeting."
          >
            Left meeting at: {endedAtDate.format(FORMAT)}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}

export default CompanionCard
