import { Stack, Typography } from '@mui/material'
import { useState } from 'react'

import { formatDate, formatTime } from '~/utils/formatDate'

interface SummaryMetadataProps {
  date: string
  attendees: string[]
}

const SummaryMetadata = ({ date, attendees }: SummaryMetadataProps) => {
  const [expanded, setExpanded] = useState(false)
  const maxVisible = 3
  const visibleAttendees = expanded ? attendees : attendees.slice(0, maxVisible)
  const hiddenCount = attendees.length - maxVisible

  return (
    <Stack>
      <Typography fontSize="small">Date: {formatDate(date)}</Typography>

      <Typography fontSize="small">Time: {formatTime(date)}</Typography>

      <Typography component="span" fontSize="small">
        Attendees: {visibleAttendees.join(', ')}
        {hiddenCount > 0 && !expanded && (
          <Typography
            component="span"
            onClick={() => setExpanded(true)}
            sx={{
              '&:hover': {
                textDecoration: 'underline',
              },
              color: 'primary.main',
              cursor: 'pointer',
              fontSize: 'inherit',
              ml: 0.5,
            }}
          >
            +{hiddenCount} more
          </Typography>
        )}
        {expanded && hiddenCount > 0 && (
          <Typography
            component="span"
            onClick={() => setExpanded(false)}
            sx={{
              '&:hover': {
                textDecoration: 'underline',
              },
              color: 'primary.main',
              cursor: 'pointer',
              fontSize: 'inherit',
              ml: 0.5,
            }}
          >
            See less
          </Typography>
        )}
      </Typography>
    </Stack>
  )
}

export default SummaryMetadata
