import { Stack, Typography } from '@mui/material'
import Avatar from '@zunou-react/components/utility/Avatar'

import FeedCard from '../components/FeedCard'
import TimeAgo from '../components/TimeAgo'

interface MeetingSummaryFeedProps {
  dateString: string
  description: string
  organizationId: string
  pulseId?: string | null
  causer: {
    id: string
    name: string
    gravatar: string
  }
}

const MeetingSummaryFeed = ({ dateString }: MeetingSummaryFeedProps) => {
  return (
    <FeedCard direction="row" gap={2}>
      <Avatar placeholder="Anna Smith" variant="circular" />
      <Stack gap={1}>
        <Typography fontWeight="bold" variant="body1">
          Anna Smith
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Added a new{' '}
          <Typography
            color="text.primary"
            component="span"
            fontWeight="bold"
            variant="body2"
          >
            Meeting Summary
          </Typography>{' '}
          in{' '}
          <Typography
            color="text.primary"
            component="span"
            fontWeight="bold"
            variant="body2"
          >
            Zaiko Pulse
          </Typography>
        </Typography>
        <TimeAgo dateString={dateString} />
      </Stack>
    </FeedCard>
  )
}

export default MeetingSummaryFeed
