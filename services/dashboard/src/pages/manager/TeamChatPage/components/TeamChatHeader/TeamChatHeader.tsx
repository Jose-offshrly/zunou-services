import { Stack } from '@mui/material'
import type { GetPinnedTeamMessagesQuery } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'

import { useTeamThreadTopic } from '../../hooks/useTeamThreadTopic'
import { TopicActions } from './TopicActions'
import { TopicSelector } from './TopicSelector'
import { TopicsMenu } from './TopicsMenu'

interface SimpleTopic {
  id: string
  name: string
  hasUnread: boolean
}

interface TopicForSort {
  teamMessages?: { createdAt: string }[]
  createdAt?: string
  updatedAt?: string
  id: string
  name: string
  hasUnread: boolean
  unreadCount: number
}

interface TeamChatHeaderProps {
  currentTopic?: SimpleTopic
  recentTopics?: SimpleTopic[]
  pinnedMessagesData?: GetPinnedTeamMessagesQuery
  isLoadingPinnedMessages?: boolean
  onSeeAllTopics?: () => void
  onTopicChange?: (topic: SimpleTopic) => void
  onGeneralClick?: () => void
  teamThreadId?: string
  onUnpinMessage?: (messageId: string) => void
  onTopicCreated?: () => void
}

export const TeamChatHeader = ({
  currentTopic,
  recentTopics = [],
  pinnedMessagesData,
  isLoadingPinnedMessages = false,
  onSeeAllTopics,
  onTopicChange,
  onGeneralClick,
  teamThreadId,
  onUnpinMessage,
  onTopicCreated,
}: TeamChatHeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [pinnedAnchorEl, setPinnedAnchorEl] = useState<null | HTMLElement>(null)
  const [menuContent, setMenuContent] = useState<'topics' | 'create'>('topics')
  const open = Boolean(anchorEl)
  const pinnedOpen = Boolean(pinnedAnchorEl)

  const { t } = useTranslation('topics')
  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()

  const {
    topics: apiTopics,
    createTopic,
    isCreatingTopic,
    refetchTopics,
  } = useTeamThreadTopic({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    organizationId: organizationId || '',
    pulseId: pulseId || '',
  })

  const allRecentTopics = useMemo(() => {
    if (apiTopics.length > 0) {
      const getLastInteractionTime = (t: TopicForSort): number => {
        const messageTimes = (t.teamMessages || [])
          .map((m) => new Date(m.createdAt).getTime())
          .filter((n) => !Number.isNaN(n))
        const latestMessageTs = messageTimes.length
          ? Math.max(...messageTimes)
          : undefined
        const topicUpdatedTs = t.updatedAt
          ? new Date(t.updatedAt).getTime()
          : undefined
        const topicCreatedTs = t.createdAt
          ? new Date(t.createdAt).getTime()
          : undefined
        return latestMessageTs ?? topicUpdatedTs ?? topicCreatedTs ?? 0
      }

      const hasRecentEngagement = (t: TopicForSort): boolean => {
        const messageTimes = (t.teamMessages || [])
          .map((m) => new Date(m.createdAt).getTime())
          .filter((n) => !Number.isNaN(n))
        return messageTimes.length > 0
      }

      // Separate topics into three groups
      const recentlyEngaged: typeof apiTopics = []
      const unreadTopics: typeof apiTopics = []
      const otherTopics: typeof apiTopics = []

      apiTopics.forEach((topic) => {
        const topicForSort = topic as unknown as TopicForSort
        const hasEngagement = hasRecentEngagement(topicForSort)
        const hasUnread = topicForSort.hasUnread

        if (hasEngagement) {
          recentlyEngaged.push(topic)
        } else if (hasUnread) {
          unreadTopics.push(topic)
        } else {
          otherTopics.push(topic)
        }
      })

      // Sort each group by most recent interaction time
      const sortByInteractionTime = (
        a: (typeof apiTopics)[0],
        b: (typeof apiTopics)[0],
      ) => {
        const aLast = getLastInteractionTime(a as unknown as TopicForSort)
        const bLast = getLastInteractionTime(b as unknown as TopicForSort)
        return bLast - aLast
      }

      recentlyEngaged.sort(sortByInteractionTime)
      unreadTopics.sort(sortByInteractionTime)
      otherTopics.sort(sortByInteractionTime)

      // Combine groups in priority order: recently engaged, then unread, then others
      return [...recentlyEngaged, ...unreadTopics, ...otherTopics]
    }

    // Apply same sorting logic to recentTopics fallback
    if (recentTopics.length > 0) {
      const unreadTopics: SimpleTopic[] = []
      const otherTopics: SimpleTopic[] = []

      recentTopics.forEach((topic) => {
        if (topic.hasUnread) {
          unreadTopics.push(topic)
        } else {
          otherTopics.push(topic)
        }
      })

      // For fallback topics, prioritize unread, then others
      return [...unreadTopics, ...otherTopics]
    }

    return recentTopics
  }, [apiTopics, recentTopics])

  const displayedTopics = useMemo(() => {
    const topics = allRecentTopics.slice(0, 8)
    // Transform topics to include unreadCount for TopicsMenu
    return topics.map((topic) => {
      const topicForSort = topic as unknown as TopicForSort
      return {
        hasUnread: topicForSort.hasUnread,
        id: topicForSort.id,
        name: topicForSort.name,
        unreadCount: topicForSort.unreadCount ?? 0,
      }
    })
  }, [allRecentTopics])

  const inlineRecentTopics = useMemo(() => {
    return displayedTopics.slice(0, 5)
  }, [displayedTopics])

  // Calculate total unread count across all topics
  const totalUnreadCount = useMemo(() => {
    return apiTopics.reduce((total: number, topic) => {
      const topicForSort = topic as unknown as TopicForSort
      return total + (topicForSort.unreadCount ?? 0)
    }, 0)
  }, [apiTopics])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleTopicSelect = useCallback(
    (topic: SimpleTopic) => {
      onTopicChange?.(topic)
      handleClose()
    },
    [handleClose, onTopicChange],
  )

  const handleTopicSelectorClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (pinnedOpen) {
        setPinnedAnchorEl(null)
      }
      setAnchorEl(event.currentTarget)
      setMenuContent('topics')
    },
    [pinnedOpen],
  )

  const handleNewTopicClick = useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      if (pinnedOpen) {
        setPinnedAnchorEl(null)
      }
      if (open) {
        setMenuContent('create')
      } else if (event) {
        setAnchorEl(event.currentTarget)
        setMenuContent('create')
      }
    },
    [open, pinnedOpen],
  )

  const handleSeeAllTopicsClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSeeAllTopics?.()
      handleClose()
    },
    [onSeeAllTopics, handleClose],
  )

  const handleTopicClick = useCallback(
    (topic: SimpleTopic) => (e: React.MouseEvent) => {
      e.stopPropagation()
      handleTopicSelect(topic)
    },
    [handleTopicSelect],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  )

  const handleMainButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (currentTopic?.id === 'general') {
        if (pinnedOpen) {
          setPinnedAnchorEl(null)
        }
        setAnchorEl(event.currentTarget)
        setMenuContent('create')
      }
    },
    [currentTopic?.id, pinnedOpen],
  )

  const handleGeneralClick = useCallback(() => {
    onGeneralClick?.()
  }, [onGeneralClick])

  const handleTopicCreated = useCallback(
    async (data: { title: string }) => {
      if (!teamThreadId) {
        toast.error(t('team_thread_id_required'))
        return
      }

      try {
        const result = await createTopic(teamThreadId ?? '', data.title)
        const created = result?.createTopic
        toast.success(t('topic_created_successfully', { title: data.title }))
        if (created) {
          onTopicChange?.({
            hasUnread: false,
            id: created.id,
            name: created.name,
          })
          setTimeout(() => {
            onTopicCreated?.()
          }, 100)
        }
        refetchTopics()
        handleClose()
      } catch (error) {
        console.error('Failed to create topic:', error)
      }
    },
    [
      createTopic,
      handleClose,
      teamThreadId,
      refetchTopics,
      onTopicChange,
      onTopicCreated,
    ],
  )

  const handleCancelCreateTopic = useCallback(() => {
    handleClose()
  }, [handleClose])

  const handlePinnedButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (open) {
        setAnchorEl(null)
      }
      if (event) {
        setPinnedAnchorEl(event.currentTarget)
      }
    },
    [open],
  )

  const handlePinnedClose = useCallback(() => {
    setPinnedAnchorEl(null)
  }, [])

  const handlePinnedMessageClick = useCallback(
    (message: {
      id: string
      gravatar: string
      name: string
      dateCreated: string
      message: string
    }) => {
      console.log('Pinned message clicked:', message)
      // TODO: Implement pinned message click logic
    },
    [],
  )
  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.common.white,
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: '8px 16px',
        top: 0,
        zIndex: 1000,
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{ minWidth: 0, position: 'relative', zIndex: 1 }}
      >
        <TopicSelector
          currentTopic={
            currentTopic ?? {
              hasUnread: false,
              id: 'general',
              name: 'General',
            }
          }
          inlineRecentTopics={inlineRecentTopics}
          onGeneralClick={handleGeneralClick}
          onInlineTopicClick={handleTopicClick}
          onMainButtonClick={handleMainButtonClick}
          onTopicSelectorClick={handleTopicSelectorClick}
          totalUnreadCount={totalUnreadCount}
        />

        <TopicActions
          isLoadingPinnedMessages={isLoadingPinnedMessages}
          onMouseDown={handleMouseDown}
          onPinnedButtonClick={handlePinnedButtonClick}
          onPinnedClose={handlePinnedClose}
          onPinnedMessageClick={handlePinnedMessageClick}
          onUnpinMessage={onUnpinMessage}
          pinnedAnchorEl={pinnedAnchorEl}
          pinnedMessagesData={pinnedMessagesData}
        />
      </Stack>

      <TopicsMenu
        anchorEl={anchorEl}
        displayedTopics={displayedTopics}
        isCreatingTopic={isCreatingTopic}
        menuContent={menuContent}
        onCancelCreateTopic={handleCancelCreateTopic}
        onClose={handleClose}
        onMouseDown={handleMouseDown}
        onNewTopicClick={handleNewTopicClick}
        onSeeAllTopicsClick={handleSeeAllTopicsClick}
        onSubmitCreateTopic={handleTopicCreated}
        onTopicClick={handleTopicClick}
      />
    </Stack>
  )
}
