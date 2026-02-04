import { Add } from '@mui/icons-material'
import { alpha, Pagination, Stack, Typography } from '@mui/material'
import { TopicEntityType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { theme } from '@zunou-react/services/Theme'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { CustomModal } from '~/components/ui/CustomModal'
import { SearchInput } from '~/components/ui/form/SearchInput'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { formatTimeAgo } from '~/utils/formatTimeAgo'

import { useTeamThreadTopic } from '../../hooks/useTeamThreadTopic'
import { TopicCreationForm } from '../TopicCreationForm/TopicCreationForm'
import { TopicItem } from './TopicItem'

interface TopicMember {
  id: string
  name: string
  avatar?: string
}

interface TopicLatestMessage {
  id: string
  sender: string
  content: string
  timestamp: string
  gravatar?: string
  isAIGenerated?: boolean
}

interface TopicListItem {
  id: string
  name: string
  unreadCount: number
  members: TopicMember[]
  latestMessage?: TopicLatestMessage
  threadId?: string | null
  isAIGenerated?: boolean
}

interface ApiTopicForSort {
  teamMessages?: { createdAt: string }[]
  createdAt?: string
  updatedAt?: string
  id: string
  name: string
}

interface TopicsModalProps {
  topicType?: TopicEntityType
  isOpen: boolean
  onClose: () => void
  topics?: TopicListItem[]
  onCreateNewTopic?: () => void
  onTopicSelect?: (topic: {
    id: string
    name: string
    unreadCount?: number
  }) => void
  onTopicCreated?: () => void
}

export const TopicsModal = ({
  topicType = TopicEntityType.TeamThread,
  isOpen,
  onClose,
  topics,
  onTopicSelect,
  onTopicCreated,
}: TopicsModalProps) => {
  const { t } = useTranslation('topics')
  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()
  const { pulse } = usePulseStore()

  const teamThreadId = pulse?.team_thread?.id

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateTopic, setShowCreateTopic] = useState(false)

  const {
    topics: apiTopics,
    isLoadingTopics,
    createTopic,
    isCreatingTopic,
    refetchTopics,
    isUpdatingTopic,
    deleteTopic,
    updateTopic,
    isDeletingTopic,
    paginatorInfo,
  } = useTeamThreadTopic({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    organizationId: organizationId || '',
    page: currentPage,
    pulseId: pulseId || '',
    topicType,
  })

  const allTopics = useMemo<TopicListItem[]>(() => {
    if (apiTopics.length > 0) {
      const getLastInteractionTime = (
        t: ApiTopicForSort & { messages?: { createdAt: string }[] },
      ): { hasMessages: boolean; timestamp: number } => {
        // Check both teamMessages and messages for the latest message
        const allMessages = [...(t.teamMessages || []), ...(t.messages || [])]

        const messageTimes = allMessages
          .map((m) => new Date(m.createdAt).getTime())
          .filter((n) => !Number.isNaN(n))

        const latestMessageTs = messageTimes.length
          ? Math.max(...messageTimes)
          : undefined

        const topicCreatedTs = t.createdAt
          ? new Date(t.createdAt).getTime()
          : undefined

        // Return object with hasMessages flag and timestamp
        // Use a very large number for topics with messages to ensure they sort first
        if (latestMessageTs) {
          return { hasMessages: true, timestamp: latestMessageTs }
        }

        // Topics without messages use creation time, but with lower priority
        return {
          hasMessages: false,
          timestamp: topicCreatedTs ?? 0,
        }
      }

      const sorted = [...apiTopics].sort((a, b) => {
        const aInfo = getLastInteractionTime(
          a as unknown as ApiTopicForSort & {
            messages?: { createdAt: string }[]
          },
        )
        const bInfo = getLastInteractionTime(
          b as unknown as ApiTopicForSort & {
            messages?: { createdAt: string }[]
          },
        )

        // First, prioritize topics with messages over topics without messages
        if (aInfo.hasMessages !== bInfo.hasMessages) {
          return aInfo.hasMessages ? -1 : 1
        }

        // Then sort by timestamp (most recent first)
        return bInfo.timestamp - aInfo.timestamp
      })

      return sorted.map<TopicListItem>((topic) => {
        const latestRaw = (topic.messages || []).reduce<
          | {
              createdAt: string
              id: string
              content: string | null
              user?: { name?: string; gravatar?: string | null } | null
              isAIGenerated?: boolean
            }
          | undefined
        >((acc, cur) => {
          if (!acc) return cur
          return new Date(cur.createdAt).getTime() >
            new Date(acc.createdAt).getTime()
            ? cur
            : acc
        }, undefined)

        const latest: TopicLatestMessage | undefined = latestRaw
          ? {
              content: latestRaw.content ?? '',
              gravatar: latestRaw.user?.gravatar || undefined,
              id: latestRaw.id,
              isAIGenerated: latestRaw.isAIGenerated,
              sender: latestRaw.user?.name || t('unknown'),
              timestamp: latestRaw.createdAt
                ? formatTimeAgo(new Date(latestRaw.createdAt))
                : '',
            }
          : undefined

        return {
          id: topic.id,
          latestMessage: latest,
          members: [],
          name: topic.name,
          threadId: topic.threadId,
          unreadCount: 0,
        }
      })
    }

    return topics || []
  }, [apiTopics, topics])

  // Client-side search filtering (server-side search not available in API)
  const filteredTopics = allTopics.filter((topic) =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Use server-side pagination info if available, otherwise fallback to client-side calculation
  const totalPages = paginatorInfo?.lastPage || 1
  const serverCurrentPage = paginatorInfo?.currentPage || currentPage
  const displayTopics = searchQuery
    ? filteredTopics // If searching, show filtered results (client-side)
    : allTopics // Otherwise, show server-paginated results

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = event.target.value
    setSearchQuery(newSearchQuery)
    // Reset to page 1 when search changes
    if (newSearchQuery !== searchQuery) {
      setCurrentPage(1)
    }
  }

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
  }

  const handleTopicClick = (topic: {
    id: string
    name: string
    unreadCount?: number
    threadId?: string | null
  }) => {
    onTopicSelect?.(topic)
    onClose()
  }

  const handleCreateTopic = async (data: { title: string }) => {
    if (topicType === TopicEntityType.Thread) {
      toast.error(t('manual_topic_creation_not_supported'))
      return
    }

    if (!teamThreadId) {
      toast.error(t('team_thread_id_required'))
      return
    }

    try {
      const result = await createTopic(teamThreadId, data.title)
      const created = result?.createTopic
      toast.success(t('topic_created_successfully', { title: data.title }))
      setShowCreateTopic(false)
      if (created) {
        onTopicSelect?.({ id: created.id, name: created.name, unreadCount: 0 })
        onClose()
        setTimeout(() => {
          onTopicCreated?.()
        }, 100)
      }
      refetchTopics()
    } catch (error) {
      console.error('Failed to create topic:', error)
      toast.error(t('failed_to_create_topic_please_try_again'))
    }
  }

  const handleDeleteTopicConfirm = async (topicId: string) => {
    if (!topicId || topicId === 'general') return

    try {
      await deleteTopic(topicId)
      toast.success(t('topic_deleted_successfully'))
      refetchTopics()
    } catch (error) {
      console.error('Failed to delete topic:', error)
      toast.error(t('failed_to_delete_topic'))
      throw error
    }
  }

  const handleSaveTopic = async (topicId: string, newName: string) => {
    if (topicId === 'general') return
    if (!newName.trim()) {
      toast.error(t('topic_name_cannot_be_empty'))
      return
    }

    try {
      await updateTopic(topicId, newName.trim())
      toast.success(t('topic_updated_successfully'))
      refetchTopics()
    } catch (error) {
      console.error('Failed to update topic:', error)
      toast.error(t('failed_to_update_topic'))
      throw error
    }
  }

  return (
    <CustomModal
      isOpen={isOpen}
      maxHeight={700}
      maxWidth={800}
      minHeight={700}
      minWidth={600}
      onClose={onClose}
      title={t('topics')}
    >
      <Stack
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <Stack
          direction={{ sm: 'row', xs: 'column' }}
          spacing={2}
          sx={{ marginBottom: '12px' }}
        >
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            mb={2}
            spacing={2}
            sx={{ width: '100%' }}
          >
            <SearchInput
              fullWidth={true}
              onChange={handleSearchChange}
              onClear={() => setSearchQuery('')}
              placeholder={t('search_topics_or_messages')}
              value={searchQuery}
            />
            {!showCreateTopic && topicType === TopicEntityType.TeamThread && (
              <Button
                onClick={() => setShowCreateTopic(true)}
                size="small"
                variant="contained"
              >
                <Add sx={{ fontSize: '12px', marginRight: '4px' }} />
                {t('new_topic')}
              </Button>
            )}
          </Stack>
        </Stack>

        {showCreateTopic && (
          <Stack
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              gap: '12px',
              marginBottom: '12px',
              padding: '12px',
            }}
          >
            <Typography
              sx={{
                color: theme.palette.text.primary,
                fontSize: 'medium',
                fontWeight: theme.typography.fontWeightBold,
              }}
            >
              {t('create_new_topic')}
            </Typography>
            <TopicCreationForm
              cancelButtonText={t('cancel')}
              isLoading={isCreatingTopic}
              onCancel={() => {
                setShowCreateTopic(false)
              }}
              onSubmit={handleCreateTopic}
              placeholder={t('create_new_topic')}
              submitButtonText={t('create')}
            />
          </Stack>
        )}

        <Stack
          sx={{
            flex: 1,
            marginBottom: '12px',
            overflowY: 'auto',
          }}
        >
          {isLoadingTopics ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ padding: 4 }}
            >
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: 'medium',
                }}
              >
                {t('loading_topics')}
              </Typography>
            </Stack>
          ) : displayTopics.length === 0 ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ padding: 4 }}
            >
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: 'medium',
                }}
              >
                {t('no_topics_found')}
              </Typography>
            </Stack>
          ) : (
            displayTopics.map((topic) => (
              <TopicItem
                isDeleting={isDeletingTopic}
                isSaving={isUpdatingTopic}
                key={topic.id}
                onDeleteConfirm={handleDeleteTopicConfirm}
                onSave={handleSaveTopic}
                onTopicClick={handleTopicClick}
                topic={topic}
              />
            ))
          )}
        </Stack>

        {totalPages > 1 && !searchQuery && (
          <Stack
            alignItems="center"
            sx={{
              flexShrink: 0,
              marginTop: 'auto',
              paddingTop: '12px',
            }}
          >
            <Pagination
              count={totalPages}
              onChange={handlePageChange}
              page={serverCurrentPage}
              shape="rounded"
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.secondary,
              }}
            />
          </Stack>
        )}
      </Stack>
    </CustomModal>
  )
}
