import { useQueryClient } from '@tanstack/react-query'
import { TeamMessage } from '@zunou-graphql/core/graphql'
import { useJumpTeamThreadMessageQuery } from '@zunou-queries/core/hooks/useGetJumpTeamThreadQuery'
import { useGetReplyTeamThreadMessagesQuery } from '@zunou-queries/core/hooks/useGetReplyTeamThreadMessagesQuery'
import { useUpdateTeamMessageMutation } from '@zunou-queries/core/hooks/useUpdateTeamMessageMutation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { useJumpStore } from '~/store/useJumpStore'

interface UseReplyThreadMessagesProps {
  replyTeamThreadId?: string
  coreUrl: string
}

export const useReplyThreadMessages = ({
  replyTeamThreadId,
  coreUrl,
}: UseReplyThreadMessagesProps) => {
  const { anchor } = useJumpStore()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const [editingMessage, setEditingMessage] = useState<TeamMessage | null>(null)

  const [initialPage, setInitialPage] = useState<number | null>(null)

  const jumpTeamThread = useJumpTeamThreadMessageQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(
      anchor?.messageId &&
        anchor?.replyTeamThreadId &&
        anchor.destination === 'MINI_PULSE_CHAT',
    ),
    variables: {
      messageId: anchor?.messageId,
      organizationId,
      pulseId: pulseId || '',
      replyTeamThreadId: anchor?.replyTeamThreadId,
    },
  })

  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    status,
    isLoading,
    refetch,
    isFetching,
    isRefetching,
  } = useGetReplyTeamThreadMessagesQuery({
    coreUrl,
    initialPage,
    variables: {
      organizationId,
      pulseId,
      replyTeamThreadId: replyTeamThreadId || '',
    },
  })

  const hasLoadedLatestPage = data?.pageParams.some((page) => page === 1)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (jumpTeamThread.isLoading || anchor?.destination !== 'MINI_PULSE_CHAT')
      return

    if (!anchor) {
      queryClient.removeQueries({
        queryKey: ['replyTeamThreadMessages', replyTeamThreadId],
      })
      setInitialPage(null)
      return
    }

    const targetPage =
      jumpTeamThread.data?.jumpTeamThreadMessage.paginatorInfo.currentPage

    if (!targetPage) return

    // Guard: Prevent re-running if already at target
    if (initialPage === targetPage) return

    // 1. Remove cache
    queryClient.removeQueries({
      queryKey: ['replyTeamThreadMessages', replyTeamThreadId],
    })

    // 2. Set page (this changes queryKey and triggers fetch)
    setInitialPage(targetPage)
  }, [anchor?.messageId, jumpTeamThread.data])

  const { mutateAsync: updateTeamMessage } = useUpdateTeamMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleSubmitEditMessage = useCallback(
    async (messageId: string, content: string) => {
      try {
        if (!pulseId) {
          toast.error('Team chat not initialized')
          return
        }

        await updateTeamMessage({
          content,
          pulseId,
          teamMessageId: messageId,
        })
        setEditingMessage(null)
        toast.success('Message updated successfully')
        await refetchMessages()
      } catch (error) {
        toast.error('Failed to update message')
      }
    },
    [updateTeamMessage, pulseId],
  )

  const messages = useMemo(() => {
    if (!data) return []

    return data.pages
      .flatMap((page) => page.data)
      .sort((a, b) => {
        if (!a || !b) return 0
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })
  }, [data])

  const threadTitle =
    messages.find((message) => message.isParentReply)?.metadata?.excerpt || ''

  const threadCreationDate = messages.length > 0 ? messages[0]?.createdAt : null

  const handleLoadOldMessages = useCallback(
    async (isIntersecting: boolean) => {
      if (isIntersecting && hasNextPage && !isFetchingNextPage) {
        await fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  const handleLoadNewMessages = useCallback(
    async (isIntersecting: boolean) => {
      if (isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
        await fetchPreviousPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  const refetchMessages = useCallback(async () => {
    if (replyTeamThreadId) {
      await refetch()
    }
  }, [replyTeamThreadId, refetch])

  const handleEditMessage = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)

      if (message) {
        setEditingMessage(message)
        return message.content
      }
    },
    [messages],
  )

  return {
    editingMessage,
    fetchPreviousPage,
    handleEditMessage,
    handleLoadNewMessages,
    handleLoadOldMessages,
    handleSubmitEditMessage,
    hasLoadedLatestPage,
    hasNextPage,
    hasPreviousPage,
    initialPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isJumpThreadLoading: jumpTeamThread.isLoading,
    isJumpThreadRefetching: jumpTeamThread.isRefetching,
    isLoading,
    isRefetching,
    messages,
    refetch,
    refetchMessages,
    setEditingMessage,
    setInitialPage,
    status,
    threadCreationDate,
    threadTitle,
  }
}
