import { Stack, Typography } from '@mui/material'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { SelectedTab, SelectedTopic } from '~/store/usePulseStore'

import TopicButton from './TopicButton'

export interface TopicsListProps {
  topics: { id: string; name: string; unreadCount: number }[]
  isLoading: boolean
  generalUnreadCount: number
  currentTopic?: SelectedTopic | null
  currentPath: string
  selected: boolean
  onButtonClick: (
    e: React.MouseEvent,
    tab?: SelectedTab,
    topic?: SelectedTopic,
  ) => void
}

export default function TopicsList({
  topics,
  isLoading,
  generalUnreadCount,
  currentTopic,
  currentPath,
  selected,
  onButtonClick,
}: TopicsListProps) {
  const isGeneralSelected =
    currentTopic?.id === 'general' &&
    currentPath.includes('team-chat') &&
    selected

  return (
    <Stack gap={1} pl={2}>
      <TopicButton
        isSelected={isGeneralSelected}
        name="General"
        onButtonClick={onButtonClick}
        unreadCount={generalUnreadCount}
      />

      {!isLoading && topics.length > 0 && (
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

      {isLoading ? (
        <>
          <LoadingSkeleton height={32} />
          <LoadingSkeleton height={32} />
          <LoadingSkeleton height={32} />
        </>
      ) : (
        topics.map((topic) => (
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
        ))
      )}
    </Stack>
  )
}
