import {
  MessageRole,
  Topic,
  TopicEntityType,
} from '@zunou-graphql/core/graphql'
import { useCreateTopicMutation } from '@zunou-queries/core/hooks/useCreateTopicMutation'
import { useDeleteTopicMutation } from '@zunou-queries/core/hooks/useDeleteTopicMutation'
import { useGetTopics } from '@zunou-queries/core/hooks/useGetTopicsQuery'
import { useUpdateTopicMutation } from '@zunou-queries/core/hooks/useUpdateTopicMutation'
import { useMemo } from 'react'

interface UseTeamThreadTopicProps {
  coreUrl: string
  pulseId: string
  organizationId: string
  topicType?: TopicEntityType
  page?: number
}

interface TransformedTopic {
  id: string
  name: string
  hasUnread: boolean
  unreadCount: number
  createdAt?: string
  updatedAt?: string
  messages?: {
    id: string
    content: string | null
    createdAt: string
    user?: {
      id: string
      name: string
      gravatar?: string | null
    } | null
  }[]
  teamMessages?: {
    id: string
    content: string | null
    createdAt: string
    user?: {
      id: string
      name: string
      gravatar?: string | null
    } | null
  }[]
  threadId?: string | null
  isAIGenerated?: boolean
}

export const useTeamThreadTopic = ({
  coreUrl,
  pulseId,
  organizationId,
  topicType = TopicEntityType.TeamThread,
  page = 1,
}: UseTeamThreadTopicProps) => {
  const {
    data: topicsData,
    isLoading: isLoadingTopics,
    error: topicsError,
    refetch: refetchTopics,
  } = useGetTopics({
    coreUrl,
    variables: {
      organizationId,
      page,
      pulseId,
      type: topicType,
    },
  })

  // const {
  //   data: messagesData,
  //   isLoading: isLoadingMessages,
  //   error: messagesError,
  //   fetchNextPage,
  //   hasNextPage,
  //   isFetchingNextPage,
  // } = useGetTeamThreadMessages({
  //   coreUrl,
  //   variables: {
  //     organizationId,
  //     pulseId,
  //     topicId,
  //   },
  //   // initialPage: 6,
  // })

  const createTopicMutation = useCreateTopicMutation({ coreUrl })
  const updateTopicMutation = useUpdateTopicMutation({ coreUrl })
  const deleteTopicMutation = useDeleteTopicMutation({ coreUrl })

  const topics = useMemo<TransformedTopic[]>(() => {
    if (!topicsData?.topics.data) return []

    return topicsData.topics.data.map((topic: Topic) => ({
      createdAt: topic.createdAt,
      hasUnread: (topic.unreadCount ?? 0) > 0,
      id: topic.id,
      messages:
        topicType === TopicEntityType.TeamThread
          ? topic.teamMessages
            ? topic.teamMessages.map((msg) => ({
                content: msg.content ?? null,
                createdAt: msg.createdAt,
                id: msg.id,
                user: msg.user
                  ? {
                      gravatar: msg.user.gravatar ?? null,
                      id: msg.user.id,
                      name: msg.user.name,
                    }
                  : null,
              }))
            : undefined
          : topic.messages
            ? topic.messages.map((msg) => ({
                content: msg.content ?? null,
                createdAt: msg.createdAt,
                id: msg.id,
                isAIGenerated: msg.role === MessageRole.Assistant,
                user: msg.user
                  ? {
                      gravatar: msg.user.gravatar ?? null,
                      id: msg.user.id,
                      name: msg.user.name,
                    }
                  : null,
              }))
            : undefined,
      name: topic.name,
      teamMessages:
        topicType === TopicEntityType.TeamThread && topic.teamMessages
          ? topic.teamMessages.map((msg) => ({
              content: msg.content ?? null,
              createdAt: msg.createdAt,
              id: msg.id,
              user: msg.user
                ? {
                    gravatar: msg.user.gravatar ?? null,
                    id: msg.user.id,
                    name: msg.user.name,
                  }
                : null,
            }))
          : undefined,
      threadId: topic.thread?.id,
      unreadCount: topic.unreadCount ?? 0,
      updatedAt: topic.updatedAt,
    }))
  }, [topicsData, topicType])

  const createTopic = async (teamThreadId: string, name: string) => {
    try {
      const result = await createTopicMutation.mutateAsync({
        name,
        pulseId,
        teamThreadId,
      })
      return result
    } catch (error) {
      console.error('Failed to create topic:', error)
      throw error
    }
  }

  const updateTopic = async (topicId: string, name: string) => {
    try {
      const result = await updateTopicMutation.mutateAsync({
        name,
        pulseId,
        topicId,
      })
      return result
    } catch (error) {
      console.error('Failed to update topic:', error)
      throw error
    }
  }

  const deleteTopic = async (topicIdToDelete: string) => {
    try {
      const result = await deleteTopicMutation.mutateAsync({
        pulseId,
        topicId: topicIdToDelete,
      })
      return result
    } catch (error) {
      console.error('Failed to delete topic:', error)
      throw error
    }
  }

  return {
    createTopic,
    deleteTopic,
    // fetchNextPage,
    // hasNextPage,
    isCreatingTopic: createTopicMutation.isPending,
    isDeletingTopic: deleteTopicMutation.isPending,
    // isFetchingNextPage,
    // isLoadingMessages,
    isLoadingTopics,
    isUpdatingTopic: updateTopicMutation.isPending,
    // messages: messagesData?.pages.flatMap((page) => page.data) || [],
    // messagesError,
    paginatorInfo: topicsData?.topics.paginatorInfo,
    refetchTopics,
    topics,
    topicsError,
    updateTopic,
  }
}
