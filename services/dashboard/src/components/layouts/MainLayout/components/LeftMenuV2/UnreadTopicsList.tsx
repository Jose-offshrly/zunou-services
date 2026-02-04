import { Stack, Typography } from '@mui/material'

import TopicButton from './TopicButton'
import { TopicsListProps } from './TopicsList'

interface UnreadTopicsListProps extends Omit<TopicsListProps, 'isLoading'> {
  show: boolean
}

export default function UnreadTopicsList({
  show,
  topics,
  generalUnreadCount,
  currentTopic,
  currentPath,
  selected,
  onButtonClick,
}: UnreadTopicsListProps) {
  const isGeneralSelected =
    currentTopic?.id === 'general' &&
    currentPath.includes('team-chat') &&
    selected

  return (
    <Stack
      gap={1}
      pl={2}
      sx={{
        maxHeight: show ? '500px' : '0px',
        opacity: show ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
      }}
    >
      {generalUnreadCount > 0 && (
        <TopicButton
          isSelected={isGeneralSelected}
          name="General"
          onButtonClick={onButtonClick}
          unreadCount={generalUnreadCount}
        />
      )}

      {topics.length > 0 && (
        <Typography
          fontSize={10}
          noWrap={true}
          sx={{
            color: 'text.secondary',
            maxWidth: 150,
            overflow: 'hidden',
            pl: 1,
            textAlign: 'left',
            textOverflow: 'ellipsis',
          }}
          textTransform="uppercase"
        >
          Recent
        </Typography>
      )}

      {topics.map((topic) => (
        <TopicButton
          id={topic.id}
          isSelected={
            currentTopic?.id === topic.id &&
            currentPath.includes('team-chat') &&
            selected
          }
          key={topic.id}
          name={topic.name}
          onButtonClick={onButtonClick}
          unreadCount={topic.unreadCount}
        />
      ))}
    </Stack>
  )
}
