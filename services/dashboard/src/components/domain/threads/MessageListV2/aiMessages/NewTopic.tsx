import { alpha, Box, Card, Skeleton, Stack, Typography } from '@mui/material'
import { useGetTopic } from '@zunou-queries/core/hooks/useGetTopicQuery'
import { NewTopicUI } from '@zunou-react/components/form/FormattedContent'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useMemo } from 'react'

import { useTopicStore } from '~/store/useTopicStore'

interface Props {
  topic?: NewTopicUI[]
  topicId?: string
}

const NewTopic = ({ topic, topicId }: Props) => {
  const { setCurrentPulseTopic } = useTopicStore()

  const getTopic = useGetTopic({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(topicId),
    variables: {
      topicId,
    },
  })

  const topicThreadId = getTopic.data?.topic.thread?.id ?? null
  const isLoading = getTopic.isLoading && Boolean(topicId)

  const selectedTopic = topic?.[0]

  const cardSx = useMemo(
    () => ({
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.04),
      },
      borderColor: theme.palette.divider,
      borderRadius: 2,
      boxShadow: 'none',
      cursor: 'pointer',
      p: 2,
      width: '100%',
    }),
    [],
  )

  const handleTopicClick = useCallback(() => {
    if (!topicId || !topicThreadId) return

    setCurrentPulseTopic({
      hasUnread: false,
      id: topicId,
      name: selectedTopic?.topic_name ?? 'Unknown',
      threadId: topicThreadId,
    })
  }, [topicThreadId, selectedTopic, topicId, setCurrentPulseTopic])

  return (
    <Stack gap={1} position="relative" px={1} width="100%">
      <Box
        sx={{
          pointerEvents: 'none',
          position: 'absolute',
          right: '96.5%',
          top: '58%',
          transform: 'translateY(-50%)',
          zIndex: 1,
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
      <Stack direction="row" spacing={0.5} sx={{ flex: 1 }}>
        {isLoading ? (
          <>
            <Skeleton height={20} variant="text" width={120} />
          </>
        ) : (
          <>
            <Typography color="text.primary" variant="body2">
              Started a topic:
            </Typography>
            <Typography
              color="primary.main"
              sx={{ fontWeight: 600 }}
              variant="body2"
            >
              #{selectedTopic?.topic_name}
            </Typography>
          </>
        )}
      </Stack>
      <Card
        onClick={isLoading ? undefined : handleTopicClick}
        sx={cardSx}
        variant="outlined"
      >
        {isLoading ? (
          <>
            <Skeleton height={20} sx={{ mb: 0.5 }} variant="text" width={150} />
            <Skeleton height={24} variant="text" width="80%" />
          </>
        ) : (
          <>
            <Typography color="text.secondary" variant="subtitle2">
              Created from Insights
            </Typography>
            <Typography
              fontWeight={600}
              sx={{
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 1,
                display: '-webkit-box',
                overflow: 'hidden',
              }}
            >
              # {selectedTopic?.topic_name}
            </Typography>
          </>
        )}
      </Card>
    </Stack>
  )
}

export default NewTopic
