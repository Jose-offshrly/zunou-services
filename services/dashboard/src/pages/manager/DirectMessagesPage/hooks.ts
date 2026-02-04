import { useAuth0 } from '@auth0/auth0-react'
import { DirectMessage, User } from '@zunou-graphql/core/graphql'
import { useCreateDirectMessageMutation } from '@zunou-queries/core/hooks/useCreateDirectMessageMutation'
import { useDeleteDirectMessageMutation } from '@zunou-queries/core/hooks/useDeleteDirectMessageMutation'
import { useGetOrCreateDirectMessageThreadMutation } from '@zunou-queries/core/hooks/useGetOrCreateDirectMessageThreadMutation'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import { useGetPinnedDirectMessages } from '@zunou-queries/core/hooks/useGetPinnedDirectMessages'
import { useMarkDirectMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkDirectMessagesAsReadMutation'
import { usePinOrganizationUserMutation } from '@zunou-queries/core/hooks/usePinOrganizationUserMutation'
import { useToggleDirectMessageReactionMutation } from '@zunou-queries/core/hooks/useToggleDirectMessageReaction'
import { useUnpinOrganizationUserMutation } from '@zunou-queries/core/hooks/useUnpinOrganizationUserMutation'
import { useUnreadDirectMessages } from '@zunou-queries/core/hooks/useUnreadDirectMessagesQuery'
import { useUpdatePinDirectMessageMutation } from '@zunou-queries/core/hooks/useUpdatePinDirectMessage'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import Echo from 'laravel-echo'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { hasTextContent } from '~/components/ui/form/SlateInput/editor/helpers'
import { usePusherContext } from '~/context/PusherContext'
import { zodResolver } from '~/libs/zod'
import {
  DirectMessageInput,
  directMessageSchema,
} from '~/schemas/DirectMessageSchema'

import { useDirectMessageFileAttachments } from './hooks/useDirectMessageFileAttachments'

interface UseDirectMessageProps {
  userId?: string | null
  organizationId: string
}

// DirectMessageGroupedReaction type (matching the GraphQL schema)
export interface DirectMessageGroupedReaction {
  reaction: string
  count: number
  users: User[]
}

export type PartialDirectMessage = Pick<
  DirectMessage,
  | 'id'
  | 'directMessageThreadId'
  | 'content'
  | 'createdAt'
  | 'updatedAt'
  | 'isEdited'
  | 'deletedAt'
  | 'isPinned'
  | 'repliedToMessageId'
> & {
  sender: Pick<DirectMessage['sender'], 'id' | 'name' | 'email' | 'gravatar'>
  files?: DirectMessage['files']
  groupedReactions?: DirectMessageGroupedReaction[]
  repliedToMessage?:
    | (Pick<DirectMessage, 'id' | 'content' | 'isEdited' | 'deletedAt'> & {
        sender: Pick<
          DirectMessage['sender'],
          'id' | 'name' | 'gravatar' | 'email'
        >
      })
    | null
}

const initialFormState = {
  file: null,
  message: '',
}

export const useDirectMessage = ({
  userId,
  organizationId,
}: UseDirectMessageProps) => {
  const [messages, setMessages] = useState<PartialDirectMessage[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [editingMessage, setEditingMessage] =
    useState<PartialDirectMessage | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [replyingToMessage, setReplyingToMessage] = useState<{
    id: string
    name: string
    content: string
  } | null>(null)
  const paginatorInfoRef = useRef<{ currentPage: number; lastPage: number }>({
    currentPage: 1,
    lastPage: 1,
  })

  const {
    control,
    formState: { isValid },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues: initialFormState,
    mode: 'onChange',
    resolver: zodResolver(directMessageSchema),
  })

  const message = watch('message')

  const {
    attachments,
    clearAttachments,
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    isUploadingFiles,
  } = useDirectMessageFileAttachments()

  const isValidContent =
    (hasTextContent(message) ||
      (attachments.length > 0 &&
        attachments.every((att) => att.fileKey && !att.loading))) &&
    // Make sure no attachment is pending
    attachments.filter((att) => att.loading).length === 0

  const {
    mutateAsync: getOrCreateThread,
    isPending: isGetOrCreateThreadLoading,
  } = useGetOrCreateDirectMessageThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: createMessage } = useCreateDirectMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: deleteMessage } = useDeleteDirectMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutate: markDirectMessagesAsRead } =
    useMarkDirectMessagesAsReadMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutateAsync: updatePinMessage } = useUpdatePinDirectMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(() => {
    if (threadId) {
      markDirectMessagesAsRead({ threadId })
    }
  }, [threadId, markDirectMessagesAsRead])

  // Auto-mark messages as read when thread ID becomes available
  useEffect(() => {
    if (threadId) {
      markMessagesAsRead()
    }
  }, [threadId, markMessagesAsRead])

  // Fetch messages for a given page
  const fetchMessages = useCallback(
    async (page = 1, append = false) => {
      if (!userId || !organizationId) return
      try {
        const { getOrCreateDirectMessageThread: thread } =
          await getOrCreateThread({
            organizationId,
            page,
            receiverId: userId,
          })
        setThreadId(thread.threadId)
        paginatorInfoRef.current = {
          currentPage: thread.paginatorInfo.currentPage,
          lastPage: thread.paginatorInfo.lastPage,
        }
        setCurrentPage(thread.paginatorInfo.currentPage)
        setTotalPages(thread.paginatorInfo.lastPage)
        const pageMessages = (thread.data || []) as PartialDirectMessage[]
        setMessages((prev) => {
          if (append) {
            // For loading more (older) messages, append to end
            return [...prev, ...pageMessages]
          } else {
            // For initial load or refresh, replace
            return [...pageMessages]
          }
        })
        if (isInitialLoading) {
          setIsInitialLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
        if (isInitialLoading) {
          setIsInitialLoading(false)
        }
      }
    },
    [userId, organizationId, getOrCreateThread, isInitialLoading],
  )

  // Initial load
  useEffect(() => {
    if (userId && organizationId) {
      setIsInitialLoading(true)
      fetchMessages(1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, organizationId])

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !userId) return
    if (currentPage >= totalPages) return
    setIsLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const { getOrCreateDirectMessageThread: thread } =
        await getOrCreateThread({
          organizationId,
          page: nextPage,
          receiverId: userId,
        })
      paginatorInfoRef.current = {
        currentPage: thread.paginatorInfo.currentPage,
        lastPage: thread.paginatorInfo.lastPage,
      }
      setCurrentPage(thread.paginatorInfo.currentPage)
      setTotalPages(thread.paginatorInfo.lastPage)
      const pageMessages = (thread.data || []) as PartialDirectMessage[]
      setMessages((prev) => [...prev, ...pageMessages])
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    isLoadingMore,
    currentPage,
    totalPages,
    getOrCreateThread,
    organizationId,
    userId,
  ])

  // Refresh messages (reload first page) - debounced to prevent excessive calls
  const refreshMessages = useCallback(async () => {
    if (isLoading || isInitialLoading) return
    await fetchMessages(1, false)
  }, [fetchMessages, isLoading, isInitialLoading])

  // Real-time listeners for direct message events
  const { echo, getChannel } = usePusherContext()
  const { user } = useAuthContext()

  useEffect(() => {
    if (!echo || !threadId || !user?.id) return

    const channelName = `direct.thread.${threadId}`
    const channel = getChannel(channelName)
    if (!channel) return

    // Listen for new messages
    const handleMessageSent = (data: {
      senderId: string
      threadId: string
      content: string
      timestamp: string
    }) => {
      if (data.senderId !== user.id && data.threadId === threadId) {
        if (!isLoading && !isInitialLoading) {
          refreshMessages()
        }
      }
    }

    // Listen for message updates
    const handleMessageUpdated = (data: {
      directMessageId: string
      threadId: string
      message: string
      timestamp: string
    }) => {
      if (data.threadId === threadId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.directMessageId
              ? {
                  ...m,
                  content: data.message,
                  isEdited: true,
                }
              : m,
          ),
        )
      }
    }

    // Listen for message deletions
    const handleMessageDeleted = (data: {
      directMessageId: string
      threadId: string
      timestamp: string
    }) => {
      if (data.threadId === threadId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.directMessageId
              ? {
                  ...m,
                  deletedAt: new Date().toISOString(),
                }
              : m,
          ),
        )
      }
    }

    channel.listen('.direct-message-sent', handleMessageSent)
    channel.listen('.direct-message-updated', handleMessageUpdated)
    channel.listen('.direct-message-deleted', handleMessageDeleted)

    return () => {
      channel.stopListening('.direct-message-sent', handleMessageSent)
      channel.stopListening('.direct-message-updated', handleMessageUpdated)
      channel.stopListening('.direct-message-deleted', handleMessageDeleted)
    }
  }, [
    echo,
    threadId,
    user?.id,
    getChannel,
    refreshMessages,
    isLoading,
    isInitialLoading,
  ])

  const handleNewMessage = useCallback((message: PartialDirectMessage) => {
    setMessages((prev) =>
      Array.isArray(prev) ? [message, ...prev] : [message],
    )
  }, [])

  const handleEditMessage = useCallback(() => {
    // This will be handled by the inline editor in ChatMessage
    // The editing state is managed by EditingProvider context
  }, [])

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await deleteMessage({
          directMessageId: messageId,
          organizationId,
        })

        setMessages((prev) => {
          const updatedMessages = prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: response.deleteDirectMessage.content,
                  deletedAt: new Date().toISOString(),
                  isEdited: response.deleteDirectMessage.isEdited,
                }
              : m,
          )
          return [...updatedMessages]
        })
      } catch (error) {
        console.error('Failed to delete message:', error)
      }

      // Editing is now handled inline, no need to clear editing state here
    },
    [deleteMessage, organizationId],
  )

  // Pinned messages query
  const { data: pinnedMessagesData, isLoading: isLoadingPinnedMessages } =
    useGetPinnedDirectMessages({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        directMessageThreadId: threadId || '',
        organizationId,
      },
    })

  const handleUnpinMessage = useCallback(
    async (messageId: string) => {
      if (!threadId || !organizationId) {
        toast.error('Missing thread ID or organization ID.')
        return
      }

      try {
        await updatePinMessage({
          directMessageId: messageId,
          directMessageThreadId: threadId,
          organizationId,
          pinned: false,
        })
        toast.success('Message unpinned')
      } catch (error) {
        console.error('Failed to unpin message:', error)
        toast.error('Failed to unpin message')
      }
    },
    [threadId, organizationId, updatePinMessage],
  )

  const handlePinMessage = useCallback(
    async (messageId: string) => {
      if (!threadId || !organizationId) {
        toast.error('Missing thread ID or organization ID.')
        return
      }

      try {
        await updatePinMessage({
          directMessageId: messageId,
          directMessageThreadId: threadId,
          organizationId,
          pinned: true,
        })
        toast.success('Message pinned')
      } catch (error) {
        console.error('Failed to pin message:', error)
        toast.error('Failed to pin message')
      }
    },
    [threadId, organizationId, updatePinMessage],
  )

  const { mutateAsync: toggleDirectMessageReaction } =
    useToggleDirectMessageReactionMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleReaction = useCallback(
    async (messageId: string, reaction: string) => {
      if (!threadId || !organizationId) {
        toast.error('Missing thread ID or organization ID.')
        return
      }

      try {
        await toggleDirectMessageReaction({
          directMessageId: messageId,
          organizationId,
          reaction,
          threadId,
        })
        // Refresh messages to get updated reactions
        refreshMessages()
      } catch (error) {
        console.error('Failed to toggle reaction:', error)
        toast.error('Failed to toggle reaction')
      }
    },
    [threadId, organizationId, toggleDirectMessageReaction, refreshMessages],
  )

  const handleSubmitMessage = async (data: DirectMessageInput) => {
    if ((!data.message && attachments.length === 0) || !threadId) return

    setIsLoading(true)
    try {
      // Prepare files array for the mutation - only include attachments that have completed uploading
      const files = attachments
        .filter((att) => att.fileKey && !att.loading)
        .map((att) => ({
          fileKey: att.fileKey ?? '',
          fileName: att.fileName,
          type: att.fileType,
        }))

      // Editing is now handled inline in ChatMessage, so this only creates new messages
      const response = await createMessage({
        content: data.message || '',
        directMessageThreadId: threadId,
        organizationId,
        ...(files.length > 0 ? { files } : {}),
        repliedToMessageId: replyingToMessage?.id,
      } as Parameters<typeof createMessage>[0])

      setMessages((prev) =>
        Array.isArray(prev)
          ? [response.createDirectMessage as PartialDirectMessage, ...prev]
          : [response.createDirectMessage as PartialDirectMessage],
      )
      reset({ message: '' })
      clearAttachments()
      setReplyingToMessage(null)
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetReplyingToMessage = useCallback(
    (message: { id: string; name: string; content: string } | null) => {
      setReplyingToMessage(message)
    },
    [],
  )

  const handleClearReplyingToMessage = useCallback(() => {
    setReplyingToMessage(null)
  }, [])

  return {
    attachments,
    clearAttachments,
    control,
    currentPage,
    editingMessage,
    handleClearReplyingToMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleFileUpload,
    handleImageUpload,
    handleNewMessage,
    handlePinMessage,
    handleReaction,
    handleRemoveFile,
    handleSetReplyingToMessage,
    handleSubmit: handleSubmit(handleSubmitMessage),
    handleUnpinMessage,
    isGetOrCreateThreadLoading,
    isInitialLoading,
    isLoading,
    isLoadingMore,
    isLoadingPinnedMessages,
    isUploadingFiles,
    isValid,
    isValidContent,
    loadMore,
    markMessagesAsRead,
    messages,
    pinnedMessagesData,
    refreshMessages,
    replyingToMessage,
    reset,
    setEditingMessage,
    threadId,
    totalPages,
  }
}

interface UseUnreadMemberMessagesProps {
  organizationId: string
}

interface UseUnreadMemberMessagesReturn {
  membersWithUnreads: Set<string>
  refreshUnreadCount: () => void
  handleMessageRead: (userId: string) => void
}

export const useUnreadMemberMessages = ({
  organizationId,
}: UseUnreadMemberMessagesProps): UseUnreadMemberMessagesReturn => {
  const [membersWithUnreads, setMembersWithUnreads] = useState<Set<string>>(
    new Set(),
  )
  const { getAccessTokenSilently } = useAuth0()
  const { user } = useAuthContext()
  const [echo, setEcho] = useState<Echo<'pusher'> | null>(null)

  const { data: allUnreadMessages, refetch: refreshUnreadCount } =
    useUnreadDirectMessages({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!organizationId,
      organizationId: organizationId || '',
    })

  useEffect(() => {
    if (!allUnreadMessages || !user?.id) return

    try {
      const newMembersWithUnreads = new Set<string>()

      allUnreadMessages.forEach((userData) => {
        if (userData.id === user.id) return

        userData.directMessageThreads?.forEach((thread) => {
          if (thread.unreadCount && thread.unreadCount > 0) {
            newMembersWithUnreads.add(userData.id)
          }
        })
      })

      setMembersWithUnreads(newMembersWithUnreads)
    } catch (error) {
      console.error('Failed to process unread messages:', error)
    }
  }, [allUnreadMessages, user?.id])

  useEffect(() => {
    const initializeEcho = async () => {
      try {
        const token = await getAccessTokenSilently()

        const newEcho = new Echo({
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT,
          broadcaster: 'pusher',
          cluster: import.meta.env.VITE_PUSHER_CLUSTER,
          forceTLS: true,
          key: import.meta.env.VITE_PUSHER_KEY,
        })

        setEcho(newEcho)
      } catch (error) {
        console.error('Failed to initialize Echo:', error)
      }
    }

    if (organizationId) {
      initializeEcho()
    }

    return () => {
      if (echo) {
        echo.disconnect()
      }
    }
  }, [getAccessTokenSilently, organizationId])

  useEffect(() => {
    if (!echo || !organizationId || !user?.id) return

    const channelName = `organization.${organizationId}`
    const channel = echo.join(channelName)

    channel.listen(
      'direct-message-sent',
      (data: {
        senderId: string
        threadId: string
        organizationId: string
      }) => {
        if (data.senderId !== user.id) {
          setMembersWithUnreads((prev) => {
            const newSet = new Set(prev)
            newSet.add(data.senderId)
            return newSet
          })
        }
      },
    )

    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    const handleMarkAsRead = (event: CustomEvent) => {
      if (event.detail && event.detail.senderId) {
        handleMessageRead(event.detail.senderId)
      }
    }

    window.addEventListener(
      'direct-messages-read',
      handleMarkAsRead as EventListener,
    )

    return () => {
      channel.stopListening('direct-message-sent')
      echo.leave(channelName)
      window.removeEventListener(
        'direct-messages-read',
        handleMarkAsRead as EventListener,
      )
    }
  }, [echo, organizationId, user?.id])

  const handleMessageRead = useCallback((userId: string) => {
    setMembersWithUnreads((prev) => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }, [])

  return {
    handleMessageRead,
    membersWithUnreads,
    refreshUnreadCount,
  }
}

interface UseOrganizationUserProps {
  organizationId?: string
  userId?: string | null
}

export const useOrganizationUser = ({
  organizationId,
  userId,
}: UseOrganizationUserProps) => {
  const { data: organizationUserData } = useGetOrganizationUserQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId,
    },
  })

  return {
    organizationUserData,
  }
}

interface UseOrganizationUsersProps {
  organizationId?: string
}

export const useOrganizationUsers = ({
  organizationId,
}: UseOrganizationUsersProps) => {
  const { data: organizationUsersData, isLoading } =
    useGetOrganizationUsersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId: organizationId || '',
      },
    })

  const users =
    organizationUsersData?.organizationUsers.data.map((orgUser) => ({
      ...orgUser.user,
      isPinned: orgUser.isPinned,
      one_to_one: orgUser.one_to_one,
      organizationUserId: orgUser.id,
    })) || []

  return {
    isLoading,
    organizationUsersData,
    users,
  }
}

interface UsePinnedDirectMessagesProps {
  directMessageThreadId: string | null
  organizationId: string
  enabled?: boolean
}

export const usePinnedDirectMessages = ({
  directMessageThreadId,
  organizationId,
}: UsePinnedDirectMessagesProps) => {
  const { data: pinnedMessagesData, isLoading: isLoadingPinnedMessages } =
    useGetPinnedDirectMessages({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        directMessageThreadId: directMessageThreadId || '',
        organizationId,
      },
    })

  const { mutateAsync: updatePinMessage } = useUpdatePinDirectMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleUnpinMessage = useCallback(
    async (messageId: string) => {
      if (!directMessageThreadId || !organizationId) {
        toast.error('Missing thread ID or organization ID.')
        return
      }

      try {
        await updatePinMessage({
          directMessageId: messageId,
          directMessageThreadId,
          organizationId,
          pinned: false,
        })
        toast.success('Message unpinned')
      } catch (error) {
        console.error('Failed to unpin message:', error)
        toast.error('Failed to unpin message')
      }
    },
    [directMessageThreadId, organizationId, updatePinMessage],
  )

  const handlePinMessage = useCallback(
    async (messageId: string) => {
      if (!directMessageThreadId || !organizationId) {
        toast.error('Missing thread ID or organization ID.')
        return
      }

      try {
        await updatePinMessage({
          directMessageId: messageId,
          directMessageThreadId,
          organizationId,
          pinned: true,
        })
        toast.success('Message pinned')
      } catch (error) {
        console.error('Failed to pin message:', error)
        toast.error('Failed to pin message')
      }
    },
    [directMessageThreadId, organizationId, updatePinMessage],
  )

  return {
    handlePinMessage,
    handleUnpinMessage,
    isLoadingPinnedMessages,
    pinnedMessagesData,
  }
}

interface UsePinOrganizationUserProps {
  organizationId: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const usePinOrganizationUser = ({
  organizationId,
  onSuccess,
  onError,
}: UsePinOrganizationUserProps) => {
  const { mutate: pinOrganizationUser } = usePinOrganizationUserMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutate: unpinOrganizationUser } = useUnpinOrganizationUserMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handlePinUser = useCallback(
    (organizationUserId: string) => {
      pinOrganizationUser(
        { organizationId, organizationUserId },
        {
          onError: (error) => {
            console.error('Failed to pin user:', error)
            onError?.(error)
          },
          onSuccess: () => {
            onSuccess?.()
          },
        },
      )
    },
    [organizationId, pinOrganizationUser, onSuccess, onError],
  )

  const handleUnpinUser = useCallback(
    (organizationUserId: string) => {
      unpinOrganizationUser(
        { organizationUserId },
        {
          onError: (error) => {
            console.error('Failed to unpin user:', error)
            onError?.(error)
          },
          onSuccess: () => {
            onSuccess?.()
          },
        },
      )
    },
    [unpinOrganizationUser, onSuccess, onError],
  )

  const handleTogglePinUser = useCallback(
    (organizationUserId: string, isPinned: boolean) => {
      if (isPinned) {
        handleUnpinUser(organizationUserId)
      } else {
        handlePinUser(organizationUserId)
      }
    },
    [handlePinUser, handleUnpinUser],
  )

  return {
    handlePinUser,
    handleTogglePinUser,
    handleUnpinUser,
  }
}
