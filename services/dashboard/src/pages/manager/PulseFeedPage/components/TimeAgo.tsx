import { Stack, Typography } from '@mui/material'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { relativeTimeWithTz } from '~/utils/relativeDateWithTz'

dayjs.extend(relativeTime)

interface TimeAgoProps {
  dateString: string
}

const TimeAgo = ({ dateString }: TimeAgoProps) => {
  const { user } = useAuthContext()

  const timezone = user?.timezone ?? 'UTC'

  return (
    <Stack alignItems="start" justifyContent="center">
      <Typography color="text.secondary" variant="caption">
        {relativeTimeWithTz(dateString, timezone)}
      </Typography>
    </Stack>
  )
}

export default TimeAgo
