import { useAuth0 } from '@auth0/auth0-react'
import { DirectMessage } from '@zunou-graphql/core/graphql'
import { useCreateDirectMessageMutation } from '@zunou-queries/core/hooks/useCreateDirectMessageMutation'
import { useDeleteDirectMessageMutation } from '@zunou-queries/core/hooks/useDeleteDirectMessageMutation'
import { useGetOrCreateDirectMessageThreadMutation } from '@zunou-queries/core/hooks/useGetOrCreateDirectMessageThreadMutation'
import { useMarkDirectMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkDirectMessagesAsReadMutation'
import { useUnreadDirectMessages } from '@zunou-queries/core/hooks/useUnreadDirectMessagesQuery'
import { useUpdateDirectMessageMutation } from '@zunou-queries/core/hooks/useUpdateDirectMessageMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import Echo from 'laravel-echo'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { zodResolver } from '~/libs/zod'
import {
  DirectMessageInput,
  directMessageSchema,
} from '~/schemas/DirectMessageSchema'

interface UseDirectMessageProps {
  memberId: string
  organizationId: string
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
> & {
  sender: Pick<DirectMessage['sender'], 'id' | 'name' | 'email' | 'gravatar'>
}

const initialFormState = {
  file: null,
  message: '',
}

export const useDirectMessage = ({
  memberId,
  organizationId,
}: UseDirectMessageProps) => {
  const [messages, setMessages] = useState<PartialDirectMessage[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editingMessage, setEditingMessage] =
    useState<PartialDirectMessage | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const paginatorInfoRef = useRef<{ currentPage: number; lastPage: number }>({
    currentPage: 1,
    lastPage: 1,
  })

  const {
    handleSubmit,
    control,
    register,
    formState: { isValid },
    reset,
  } = useForm<DirectMessageInput>({
    defaultValues: initialFormState,
    mode: 'onChange',
    resolver: zodResolver(directMessageSchema),
  })

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

  const { mutateAsync: updateMessage } = useUpdateDirectMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutate: markDirectMessagesAsRead } =
    useMarkDirectMessagesAsReadMutation({
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
      if (!memberId || !organizationId) return
      try {
        const { getOrCreateDirectMessageThread: thread } =
          await getOrCreateThread({
            organizationId,
            page,
            receiverId: memberId,
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
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    },
    [memberId, organizationId, getOrCreateThread],
  )

  // Initial load
  useEffect(() => {
    if (memberId && organizationId) {
      fetchMessages(1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, organizationId])

  // Load more (older) messages
  const loadMore = useCallback(async () => {
    if (isLoadingMore) return
    if (currentPage >= totalPages) return
    setIsLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const { getOrCreateDirectMessageThread: thread } =
        await getOrCreateThread({
          organizationId,
          page: nextPage,
          receiverId: memberId,
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
    memberId,
  ])

  // Refresh messages (reload first page)
  const refreshMessages = useCallback(async () => {
    await fetchMessages(1, false)
  }, [fetchMessages])

  const handleNewMessage = useCallback((message: PartialDirectMessage) => {
    setMessages((prev) =>
      Array.isArray(prev) ? [message, ...prev] : [message],
    )
  }, [])

  const handleEditMessage = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)
      if (message) {
        setEditingMessage(message)
        reset({ message: message.content })
      }
    },
    [messages, reset],
  )

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

      if (editingMessage?.id === messageId) {
        setEditingMessage(null)
        reset({ message: '' })
      }
    },
    [deleteMessage, organizationId, editingMessage, reset],
  )

  const handleSubmitMessage = async (data: DirectMessageInput) => {
    if (!data.message || !threadId) return

    setIsLoading(true)
    try {
      if (editingMessage) {
        const response = await updateMessage({
          content: data.message,
          directMessageId: editingMessage.id,
          organizationId,
        })

        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? {
                  ...m,
                  content: response.updateDirectMessage.content,
                  isEdited: true,
                }
              : m,
          ),
        )
        setEditingMessage(null)
        reset({ message: '' })
      } else {
        const response = await createMessage({
          content: data.message,
          directMessageThreadId: threadId,
          organizationId,
        })

        setMessages((prev) =>
          Array.isArray(prev)
            ? [response.createDirectMessage as PartialDirectMessage, ...prev]
            : [response.createDirectMessage as PartialDirectMessage],
        )
        reset({ message: '' })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    control,
    currentPage,
    editingMessage,
    handleDeleteMessage,
    handleEditMessage,
    handleNewMessage,
    handleSubmit: handleSubmit(handleSubmitMessage),
    isGetOrCreateThreadLoading,
    isLoading,
    isLoadingMore,
    isValid,
    loadMore,
    markMessagesAsRead,
    messages,
    refreshMessages,
    register,
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
  handleMessageRead: (memberId: string) => void
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

  const handleMessageRead = useCallback((memberId: string) => {
    setMembersWithUnreads((prev) => {
      const newSet = new Set(prev)
      newSet.delete(memberId)
      return newSet
    })
  }, [])

  return {
    handleMessageRead,
    membersWithUnreads,
    refreshUnreadCount,
  }
}
