import { useQueryClient } from '@tanstack/react-query'
import {
  NotificationKind,
  NotificationType,
  TeamMessageType,
} from '@zunou-graphql/core/graphql'
import { useCreateNotificationMutation } from '@zunou-queries/core/hooks/useCreateNotificationMutation'
import { useCreateReplyTeamThreadMutation } from '@zunou-queries/core/hooks/useCreateReplyTeamThreadMutation'
import { useCreateTeamMessageMutation } from '@zunou-queries/core/hooks/useCreateTeamMessageMutation'
import { useCreateTeamThreadMutation } from '@zunou-queries/core/hooks/useCreateTeamThreadMutation'
import { useJumpTeamThreadMessageQuery } from '@zunou-queries/core/hooks/useGetJumpTeamThreadQuery'
import { useGetPinnedTeamMessages } from '@zunou-queries/core/hooks/useGetPinnedTeamMessages'
import {
  type TeamMessage,
  useGetTeamThreadMessages,
} from '@zunou-queries/core/hooks/useGetTeamThreadMessagesQuery'
import { useMarkTeamMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkTeamMessagesAsReadMutation'
import { AttachmentData } from '@zunou-react/components/form/AttachmentItem'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import _ from 'lodash'
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { MentionType } from '~/components/ui/form/SlateInput/custom-types'
import { hasTextContent } from '~/components/ui/form/SlateInput/editor/helpers'
import { useInfiniteScrollWithPosition } from '~/hooks/useInfiniteScrollWithPosition'
import { zodResolver } from '~/libs/zod'
import {
  ThreadMessageInput,
  threadMessageSchema,
} from '~/schemas/ThreadMessageSchema'
import { useJumpStore } from '~/store/useJumpStore'
import { usePulseStore } from '~/store/usePulseStore'

import { useTeamChatActions } from './useTeamChatActions'
import { useTeamChatFileAttachments } from './useTeamChatFileAttachments'

interface UseTeamChatProps {
  organizationId: string
  pulseId?: string
  topicId?: string
  messageContainerRef: RefObject<HTMLDivElement>
  currentReplyThreadId: string | null
  onSetReplyThreadId: (replyThreadId: string) => void
  onOpenMiniPulseChat?: (openMiniPulseChat: boolean) => void
  onOpenMiniPulseChatWithThreadInfo?: (id: string) => void
  replyMessages?: TeamMessage[]
  isMiniPulse?: boolean
}

type TeamMessageWithPending = TeamMessage & { pending?: boolean }

export const useTeamChat = ({
  organizationId,
  pulseId,
  topicId,
  messageContainerRef,
  currentReplyThreadId,
  onSetReplyThreadId,
  onOpenMiniPulseChat,
  onOpenMiniPulseChatWithThreadInfo,
  isMiniPulse = false,
}: UseTeamChatProps) => {
  const { t } = useTranslation()
  const { pulseActions, addActionToPulse, currentTopic } = usePulseStore()
  const { user } = useAuthContext()
  const [showSideTray, setShowSideTray] = useState(false)
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentData | null>(null)
  const [mentions, setMentions] = useState<MentionType[]>([])
  const [searchParams, setSearchParams] = useSearchParams()

  const jumpToIdFromQuery = searchParams.get('id')

  const hasInitializedChat = useRef(false)

  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const { handleSubmit, register, reset, control, setValue, watch } =
    useForm<ThreadMessageInput>({
      defaultValues: {
        files: null,
      },
      mode: 'onChange',
      resolver: zodResolver(threadMessageSchema),
    })

  const message = watch('message')
  const isValidContent =
    // allow sending mentions as message even without text
    (hasTextContent(message) || mentions.length > 0) &&
    // Make sure no attachment is pending
    (isMiniPulse
      ? (pulseAction?.miniPulseChatAttachments ?? []).filter(
          (att) => att.loading,
        ).length === 0
      : (pulseAction?.teamChatAttachments ?? []).filter((att) => att.loading)
          .length === 0)

  const updateTeamChatInputInStore = ({
    id,
    message,
  }: {
    id: string
    message: string
  }) => {
    addActionToPulse({ id, updates: { teamChatInput: message } })
  }

  const clearReplyingToInStore = ({
    pulseId,
  }: {
    pulseId: string | undefined
  }) => {
    if (!pulseId) {
      toast.error(t('pulse_id_missing', { ns: 'topics' }))
      return
    }

    if (isMiniPulse)
      addActionToPulse({
        id: pulseId,
        updates: {
          replyingToMiniPulseChat: null,
        },
      })
    else
      addActionToPulse({
        id: pulseId,
        updates: {
          replyingToTeamChat: null,
        },
      })
  }

  const debouncedUpdateTeamChatInputInStore = useMemo(
    () => _.debounce(updateTeamChatInputInStore, 500),
    [addActionToPulse],
  )

  // Set initial value for team chat input from global store
  useEffect(() => {
    if (!pulseAction || hasInitializedChat.current || isMiniPulse) return

    setValue('message', pulseAction?.teamChatInput ?? '')

    hasInitializedChat.current = true
  }, [pulseAction])

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateTeamChatInputInStore.cancel()
    }
  }, [debouncedUpdateTeamChatInputInStore])

  useEffect(() => {
    if (pulseId && !isMiniPulse && hasInitializedChat.current) {
      debouncedUpdateTeamChatInputInStore({ id: pulseId, message })
    }
  }, [message, isMiniPulse, debouncedUpdateTeamChatInputInStore])

  const { anchor, setAnchor } = useJumpStore()

  const queryClient = useQueryClient()

  const [initialPage, setInitialPage] = useState<number | null>(null)

  const jumpTeamThread = useJumpTeamThreadMessageQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(anchor?.messageId && anchor.destination === 'TEAM_CHAT'),
    variables: {
      messageId: anchor?.messageId,
      organizationId,
      pulseId: pulseId || '',
      topicId: topicId,
    },
  })

  const {
    data: messageData,
    hasPreviousPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading: isLoadingMessages,
    isRefetching,
    fetchNextPage,
    fetchPreviousPage,
    isFetching: isFetchingMessages,
    refetch: refetchMessages,
  } = useGetTeamThreadMessages({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    initialPage: initialPage,
    variables: {
      organizationId,
      pulseId: pulseId || '',
      topicId: currentTopic
        ? currentTopic.id !== 'general'
          ? currentTopic.id
          : undefined
        : undefined,
    },
  })

  useEffect(() => {
    setInitialPage(null)
  }, [currentTopic])

  const hasLoadedLatestPage = messageData?.pageParams.some((page) => page === 1)

  useEffect(() => {
    if (jumpTeamThread.isLoading || anchor?.destination !== 'TEAM_CHAT') return

    if (!anchor) {
      queryClient.removeQueries({
        queryKey: ['teamThreadMessages', pulseId, currentTopic?.id],
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
      queryKey: ['teamThreadMessages', pulseId, currentTopic?.id],
    })

    // 2. Set page (this changes queryKey and triggers fetch)
    setInitialPage(targetPage)
  }, [anchor?.messageId, jumpTeamThread.data, currentTopic?.id])

  // Separate effect to handle cleanup AFTER data loads
  useEffect(() => {
    if (!anchor || !messageData || initialPage === null) return

    // Check if we have data for the target page
    const hasLoadedTargetPage = messageData.pages.some(
      (page) => page.paginatorInfo.currentPage === initialPage,
    )

    if (hasLoadedTargetPage) {
      // Data loaded successfully, now we can clear
      const timeout = setTimeout(() => {
        setAnchor(null)
        setInitialPage(null)
      }, 1000) // Give time for scroll to complete

      return () => clearTimeout(timeout)
    }
  }, [anchor, messageData, initialPage])

  const { mutate: markTeamMessagesAsRead } = useMarkTeamMessagesAsReadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const messages: TeamMessageWithPending[] = useMemo(() => {
    return messageData?.pages.flatMap((page) => page.data) ?? []
  }, [messageData])

  const teamThreadId = messageData?.pages[0]?.teamThreadId ?? null

  useEffect(() => {
    if (!jumpToIdFromQuery || teamThreadId) return

    setAnchor({
      destination: 'TEAM_CHAT',
      messageId: jumpToIdFromQuery,
      teamThreadId,
    })

    setSearchParams({}, { replace: true })
  }, [jumpToIdFromQuery, teamThreadId])

  const {
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    uploads,
    isUploadingFiles,
  } = useTeamChatFileAttachments({
    pulseAction,
    pulseId,
    type: isMiniPulse ? 'MINI_PULSE_CHAT' : 'TEAM_CHAT',
  })

  // Use infinite scroll hook
  const { handleLoadOlder, handleLoadNewer, scrollToBottom, scrollToTop } =
    useInfiniteScrollWithPosition({
      containerRef: messageContainerRef,
      threshold: 100,
    })

  // State for scroll management
  const [hasScrolledOnLoad, setHasScrolledOnLoad] = useState(false)

  const handleScrollToBottom = useCallback(
    (smooth = true) => {
      scrollToBottom(smooth ? 'smooth' : 'auto')
    },
    [scrollToBottom],
  )

  // Wrapper for loading older messages (top of list)
  const handleLoadOlderMessages = useCallback(
    async (inView: boolean) => {
      await handleLoadOlder(inView, {
        hasMore: !!hasNextPage,
        isFetching: isFetchingNextPage,
        maintainPosition: true,
        onLoad: fetchNextPage,
      })
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, handleLoadOlder],
  )

  // Wrapper for loading newer messages (bottom of list)
  const handleLoadNewerMessages = useCallback(
    async (inView: boolean) => {
      await handleLoadNewer(inView, {
        hasMore: !!hasPreviousPage,
        isFetching: isFetchingPreviousPage,
        maintainPosition: false,
        onLoad: fetchPreviousPage,
      })
    },
    [
      hasPreviousPage,
      isFetchingPreviousPage,
      fetchPreviousPage,
      handleLoadNewer,
    ],
  )

  // Auto-scroll to bottom when new messages arrive
  // useEffect(() => {
  //   if (!anchor && messages.length > 0 && !isFetchingMessages) {
  //     scrollToBottom('smooth')
  //   }
  // }, [anchor, messages, isFetchingMessages, scrollToBottom])

  // Initial scroll to bottom after first message load
  useEffect(() => {
    if (
      !hasScrolledOnLoad &&
      messages.length > 0 &&
      !isFetchingMessages &&
      messageContainerRef.current
    ) {
      scrollToBottom('auto')
      setHasScrolledOnLoad(true)
    }
  }, [messages, hasScrolledOnLoad, isFetchingMessages, scrollToBottom])

  // // Scroll to bottom on topic change
  useEffect(() => {
    if (
      messageContainerRef.current &&
      !isLoadingMessages &&
      !isRefetching &&
      !jumpTeamThread.isFetching &&
      !jumpTeamThread.isLoading &&
      !anchor &&
      !isMiniPulse
    ) {
      scrollToBottom('auto')
    }
  }, [isLoadingMessages, anchor])

  const {
    handleDeleteMessage,
    handlePinMessage,
    handleUnpinMessage,
    isDeleting,
  } = useTeamChatActions({
    currentReplyThreadId,
    pulseId,
    refetchMessages,
  })

  // Pinned messages query
  const { data: pinnedMessagesData } = useGetPinnedTeamMessages({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      teamThreadId: teamThreadId ?? '',
    },
  })

  const { mutateAsync: createTeamThread } = useCreateTeamThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    isPending: isPendingCompletionCreation,
    mutateAsync: createTeamMessage,
  } = useCreateTeamMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutateAsync: createReplyTeamThread } =
    useCreateReplyTeamThreadMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutate: createNotification } = useCreateNotificationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleMentionSelect = (mention: MentionType) => {
    setMentions((prev) => [...prev, mention])
  }

  const handleCreateReplyThread = useCallback(
    async (content: string) => {
      if (!user?.id || !teamThreadId) return

      try {
        const response = await createReplyTeamThread({
          content,
          organizationId,
          pulseId: pulseId ?? '',
          teamThreadId,
          topicId: topicId ?? undefined,
          userId: user.id,
        })

        const newReplyThreadId =
          response?.createReplyTeamThread?.replyTeamThreadId
        if (newReplyThreadId) {
          onSetReplyThreadId(newReplyThreadId)
          if (onOpenMiniPulseChatWithThreadInfo) {
            onOpenMiniPulseChatWithThreadInfo(newReplyThreadId)
          }
        }
        return newReplyThreadId
      } catch (error) {
        console.error('Error creating reply thread:', error)
        return undefined
      }
    },
    [
      user?.id,
      teamThreadId,
      createReplyTeamThread,
      pulseId,
      topicId,
      onSetReplyThreadId,
      onOpenMiniPulseChatWithThreadInfo,
    ],
  )

  const [shouldJumpToPresent, setShouldJumpToPresent] = useState(false)

  const jumpToPresent = () => {
    setAnchor(null)
    setInitialPage(null)
    setShouldJumpToPresent(true)
  }

  useEffect(() => {
    if (shouldJumpToPresent && !isFetchingMessages) {
      handleScrollToBottom()
      setShouldJumpToPresent(false)
    }
  }, [shouldJumpToPresent, isFetchingMessages, handleScrollToBottom])

  const handleMainChatSubmit = useCallback(
    async ({ message }: ThreadMessageInput) => {
      if (!pulseId || !organizationId) {
        toast.error(t('team_chat_not_initialized'))
        return
      }

      if (!message) return

      try {
        jumpToPresent()

        const files = (pulseAction?.teamChatAttachments ?? []).map((att) => ({
          fileKey: att.fileKey ?? '',
          fileName: att.fileName,
          type: att.fileType,
        }))

        const repliedToMessageId = pulseAction?.replyingToTeamChat?.id

        if (pulseId) {
          debouncedUpdateTeamChatInputInStore.cancel()
          updateTeamChatInputInStore({ id: pulseId, message: '' })
          clearReplyingToInStore({ pulseId })
          addActionToPulse({
            id: pulseId,
            updates: {
              teamChatAttachments: [],
            },
          })
        }

        reset({ files: null, message: '' })

        let threadId = teamThreadId
        if (!threadId) {
          const {
            createTeamThread: { id },
          } = await createTeamThread({ organizationId, pulseId })
          threadId = id
        }

        if (!threadId) {
          throw new Error(
            t('failed_to_create_or_get_team_thread', { ns: 'topics' }),
          )
        }

        const shouldCreateReplyThread = message.toLowerCase().includes('@pulse')

        if (shouldCreateReplyThread) {
          const replyThreadId = await handleCreateReplyThread(message)
          if (replyThreadId) {
            onSetReplyThreadId(replyThreadId)
            onOpenMiniPulseChat?.(true)
          }
          return
        }

        const hasAlertMention = mentions.some(
          (mention) => mention.name === 'alert',
        )
        await createTeamMessage({
          content: message,
          files,
          pulseId,
          repliedToMessageId,
          teamThreadId: threadId,
          topicId: topicId,
          userId: user?.id ?? '',
          ...(hasAlertMention && {
            metadata: {
              type: TeamMessageType.Alert,
            },
          }),
        })

        if (mentions.length > 0) {
          // handles '@everyone' and '@alert' mentions
          if (
            mentions.some(
              (mention) =>
                mention.name === 'everyone' || mention.name === 'alert',
            )
          ) {
            createNotification({
              description: message,
              kind: NotificationKind.ChatMention,
              notifyPulseMembers: true,
              pulseId,
              type: NotificationType.Users,
            })
          } else {
            // handles '@here' mentions
            if (mentions.some((mention) => mention.name === 'here')) {
              createNotification({
                description: message,
                kind: NotificationKind.ChatMention,
                notifyActiveMembers: true,
                pulseId,
                type: NotificationType.Users,
              })
            }

            // only create notification for individual pulse members not including special mentions
            const uniqueMentions = Array.from(
              new Map(mentions.map((m) => [m.id, m])).values(),
            ).filter(
              (member) => !['pulse', 'here', 'alert'].includes(member.name),
            )

            await Promise.all(
              uniqueMentions.map((member) =>
                createNotification({
                  description: message,
                  kind: NotificationKind.ChatMention,
                  notifiableId: member.id,
                  pulseId,
                  type: NotificationType.Users,
                }),
              ),
            )
          }

          setMentions([])
        }

        handleScrollToBottom(true)
      } catch (error: unknown) {
        console.error(error)

        // Extract the GraphQL error message
        const errorMessage = (() => {
          if (error && typeof error === 'object') {
            const err = error as {
              response?: {
                errors?: { message?: string }[]
              }
              message?: string
            }

            return (
              err.response?.errors?.[0]?.message ||
              err.message ||
              t('failed_to_send_message', { ns: 'topics' })
            )
          }
          return t('failed_to_send_message', { ns: 'topics' })
        })()

        toast.error(errorMessage)

        setValue('message', message)

        if (pulseId) {
          updateTeamChatInputInStore({ id: pulseId, message })
        }
      }
    },
    [
      pulseId,
      organizationId,
      teamThreadId,
      createTeamThread,
      createTeamMessage,
      handleCreateReplyThread,
      user?.id,
      mentions,
      reset,
      setValue,
      handleScrollToBottom,
      onSetReplyThreadId,
      onOpenMiniPulseChat,
      updateTeamChatInputInStore,
      debouncedUpdateTeamChatInputInStore,
      pulseAction,
      addActionToPulse,
      createNotification,
      clearReplyingToInStore,
      t,
    ],
  )

  const handleReplySubmit = useCallback(
    async ({ message }: ThreadMessageInput) => {
      if (
        !pulseId ||
        !organizationId ||
        !teamThreadId ||
        !currentReplyThreadId
      ) {
        toast.error(t('reply_thread_not_initialized'))
        return
      }

      if (!message) return

      try {
        const files = (pulseAction?.miniPulseChatAttachments ?? []).map(
          (att) => ({
            fileKey: att.fileKey ?? '',
            fileName: att.fileName,
            type: att.fileType,
          }),
        )

        const repliedToMessageId = pulseAction?.replyingToMiniPulseChat?.id

        reset({ files: null, message: '' })
        clearReplyingToInStore({ pulseId })
        addActionToPulse({
          id: pulseId,
          updates: {
            miniPulseChatAttachments: [],
          },
        })

        await createTeamMessage({
          content: message.toString(),
          files,
          pulseId,
          repliedToMessageId,
          replyTeamThreadId: currentReplyThreadId,
          teamThreadId,
          topicId: topicId,
          userId: user?.id ?? '',
        })
      } catch (error) {
        toast.error(t('failed_to_send_reply'))
      }
    },
    [
      pulseId,
      organizationId,
      teamThreadId,
      currentReplyThreadId,
      createTeamMessage,
      user?.id,
      reset,
      handleScrollToBottom,
      pulseAction,
      t,
    ],
  )

  const handleAttachmentClick = useCallback((attachment: AttachmentData) => {
    setSelectedAttachment(attachment)
    setShowSideTray(true)
  }, [])

  const handleSideTrayClose = () => {
    setShowSideTray(false)
    setSelectedAttachment(null)
  }

  const handleSetReplyThreadId = useCallback(
    (replyThreadId: string) => {
      onSetReplyThreadId(replyThreadId)
    },
    [onSetReplyThreadId],
  )

  return {
    clearReplyingToInStore,
    control,
    currentReplyThreadId,
    handleAttachmentClick,
    handleCreateReplyThread,
    handleDeleteMessage,
    handleFileUpload,
    handleImageUpload,
    handleLoadNewerMessages,
    handleLoadOlderMessages,
    handleMainChatSubmit: handleSubmit(handleMainChatSubmit),
    handleMentionSelect,
    handlePinMessage,
    handleRemoveFile,
    handleReplySubmit: handleSubmit(handleReplySubmit),
    handleScrollToBottom,
    handleSetReplyThreadId,
    handleSideTrayClose,
    handleUnpinMessage,
    hasLoadedLatestPage,
    hasNextPage,
    hasPreviousPage,
    initialPage,
    isDeleting,
    isFetchingMessages,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isJumpTeamThreadLoading: jumpTeamThread.isLoading,
    isJumpTeamThreadRefetching: jumpTeamThread.isRefetching,
    isLoadingMessages,
    isPendingCompletionCreation,
    isRefetching,
    isUploadingFiles,
    isValidContent,
    jumpToPresent,
    markTeamMessagesAsRead,
    message,
    messages,
    pinnedMessagesData,
    pulseAction,
    refetchMessages,
    register,
    reset,
    scrollToTop,
    // Added bonus: now available if needed
    selectedAttachment,
    setMentions,
    setValue,
    showSideTray,
    teamThreadId,
    uploads,
    user,
  }
}
