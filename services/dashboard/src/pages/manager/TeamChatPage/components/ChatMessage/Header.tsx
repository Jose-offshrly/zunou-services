import { Stack, Typography } from '@mui/material'

interface TopicContent {
  topic_name: string
}

interface HeaderProps {
  name: string
  messageDate: string
  isToday?: boolean
  isFlipped?: boolean
  isSentByPulse?: boolean
  UIType?: string | null
  newTopicContent?: TopicContent | null
}

export default function Header({
  name,
  messageDate,
  isToday = false,
  isFlipped = false,
  isSentByPulse = false,
  UIType,
  newTopicContent,
}: HeaderProps) {
  if (UIType === 'new_topic' && newTopicContent) {
    return (
      <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
        <Typography color="text.primary" variant="body2">
          Started a topic:
        </Typography>
        <Typography
          color="primary.main"
          sx={{ fontWeight: 600 }}
          variant="body2"
        >
          #{newTopicContent.topic_name}
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack
      direction={isFlipped ? 'row-reverse' : 'row'}
      spacing={1}
      width="100%"
    >
      <Typography fontWeight={600} variant="body2">
        {isSentByPulse ? 'Pulse' : name}
      </Typography>
      <Typography color="text.secondary" variant="caption">
        {isToday ? 'Today' : messageDate}
      </Typography>
    </Stack>
  )
}
