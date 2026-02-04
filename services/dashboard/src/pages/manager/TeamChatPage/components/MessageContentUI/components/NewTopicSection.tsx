import { Box, Stack, Typography } from '@mui/material'

import { MessageContentUI } from '../index'
import type { TopicReference } from './NewTopicUI'

interface NewTopicSectionProps {
  isNewTopic: boolean
  topicRef: TopicReference | null
  isJSONObject: boolean
  content: string | null
  isDeleted?: boolean
  onTopicSelect?: (topic: {
    id: string
    name: string
    unreadCount?: number
  }) => void
}

export function NewTopicSection({
  isNewTopic,
  topicRef,
  isJSONObject,
  content,
  isDeleted,
  onTopicSelect,
}: NewTopicSectionProps) {
  if (!isNewTopic || !topicRef) {
    return null
  }

  return (
    <Stack spacing={0} sx={{ width: '100%' }}>
      <Stack
        alignItems="center"
        direction="row"
        spacing={1.5}
        sx={{ mt: 0.5, position: 'relative' }}
      >
        <Box
          sx={{
            alignItems: 'center',
            backgroundColor: '#F47C7C',
            borderRadius: 1.5,
            display: 'flex',
            flexShrink: 0,
            height: 42,
            justifyContent: 'center',
            width: 42,
          }}
        >
          <Typography
            sx={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 400,
            }}
          >
            #
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
          <Typography color="text.primary" variant="body2">
            Started a topic:
          </Typography>
          <Typography
            color="primary.main"
            sx={{ fontWeight: 600 }}
            variant="body2"
          >
            #{topicRef.topic_name}
          </Typography>
        </Stack>

        <Box
          sx={{
            left: 0,
            position: 'absolute',
            top: 0,
            zIndex: 0,
          }}
        >
          <svg
            fill="none"
            height="120"
            viewBox="0 0 80 60"
            width="50"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 0 L0 70 L60 70"
              fill="none"
              stroke="#dedede"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </Box>
      </Stack>

      {isJSONObject && (
        <Box sx={{ pl: '48px', pt: 1 }}>
          <MessageContentUI
            content={content ?? ''}
            isDeleted={isDeleted}
            onTopicSelect={onTopicSelect}
          />
        </Box>
      )}
    </Stack>
  )
}
