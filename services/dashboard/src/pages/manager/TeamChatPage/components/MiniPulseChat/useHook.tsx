import {
  NotificationKind,
  NotificationType,
  TeamMessageType,
} from '@zunou-graphql/core/graphql'
import { useCreateNotificationMutation } from '@zunou-queries/core/hooks/useCreateNotificationMutation'
import { useCreateTeamMessageMutation } from '@zunou-queries/core/hooks/useCreateTeamMessageMutation'
import { type TeamMessage } from '@zunou-queries/core/hooks/useGetTeamThreadMessagesQuery'
import { useMarkTeamMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkTeamMessagesAsReadMutation'
import { AttachmentData } from '@zunou-react/components/form/AttachmentItem'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { ReactEditor } from 'slate-react'

import { MentionType } from '~/components/ui/form/SlateInput/custom-types'
import { hasTextContent } from '~/components/ui/form/SlateInput/editor/helpers'
import { usePusherContext } from '~/context/PusherContext'
import { useInfiniteScrollWithPosition } from '~/hooks/useInfiniteScrollWithPosition'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { zodResolver } from '~/libs/zod'
import {
  ThreadMessageInput,
  threadMessageSchema,
} from '~/schemas/ThreadMessageSchema'
import { useJumpStore } from '~/store/useJumpStore'
import { usePulseStore } from '~/store/usePulseStore'

import { useReplyThreadMessages } from '../../hooks/useReplyThreadMessages'
import { useTeamChatActions } from '../../hooks/useTeamChatActions'
import { useTeamChatFileAttachments } from '../../hooks/useTeamChatFileAttachments'

interface UseMiniPulseChatProps {
  organizationId: string
  pulseId?: string
  topicId?: string
  currentReplyThreadId: string | null
  currentReplyThreadDate: string | null
  threadTitle: string | undefined
  onSetReplyThreadId: (replyThreadId: string) => void
  onOpenMiniPulseChatWithThreadInfo?: (id: string) => void
  replyMessages?: TeamMessage[]
  isMiniPulse?: boolean
  onCloseMiniPulseChat: () => void
}

interface DeleteMessageState {
  id: string
  content: string
  gravatar?: string | null
  name: string
  date: string
}

const DEBOUNCE_DELAY = 500
const REFETCH_DELAY = 300
const CORE_URL = import.meta.env.VITE_CORE_GRAPHQL_URL

export const useMiniPulseChat = ({
  organizationId,
  pulseId,
  topicId,
  currentReplyThreadId,
  currentReplyThreadDate,
  threadTitle,
  onSetReplyThreadId,
  isMiniPulse = false,
  onCloseMiniPulseChat,
}: UseMiniPulseChatProps) => {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const { pulseActions, addActionToPulse, pulseMembers } = usePulseStore()
  const {
    setLastJumpedMessageIdMiniPulseChat,
    lastJumpedMessageIdMiniPulseChat,
    setAnchor,
  } = useJumpStore()

  // Refs
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const slateEditorRef = useRef<ReactEditor | null>(null)
  const hasInitializedChat = useRef(false)

  // Local state
  const [showSideTray, setShowSideTray] = useState(false)
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentData | null>(null)
  const [mentions, setMentions] = useState<MentionType[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] =
    useState<DeleteMessageState | null>(null)
  const [isAiGeneratingReply, setIsAiGeneratingReply] = useState(false)

  // Form setup
  const { handleSubmit, register, reset, control, setValue, watch } =
    useForm<ThreadMessageInput>({
      defaultValues: { files: null },
      mode: 'onChange',
      resolver: zodResolver(threadMessageSchema),
    })

  const message = watch('message')

  // Computed values
  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const attachments = isMiniPulse
    ? pulseAction?.miniPulseChatAttachments ?? []
    : pulseAction?.teamChatAttachments ?? []

  const isValidContent =
    hasTextContent(message) &&
    attachments.filter((att) => att.loading).length === 0

  const specialMentions = [
    { id: 'everyone', name: 'everyone' },
    { id: 'here', name: 'here' },
  ]

  const pulseAndAlertMentions = [
    { id: 'alert', name: 'alert' },
    { id: 'pulse', name: 'pulse' },
  ]

  const mentionSuggestions = useMemo(
    () => [
      ...specialMentions,
      ...pulseAndAlertMentions,
      ...pulseMembers
        .filter((member) => member.user.id !== user?.id)
        .map((m) => ({ id: m.userId, name: m.user.name })),
    ],
    [pulseMembers, user?.id],
  )

  // Infinite scroll
  const { handleLoadOlder, handleLoadNewer, scrollToBottom } =
    useInfiniteScrollWithPosition({
      containerRef: messageContainerRef,
      threshold: 100,
    })

  const { mutate: markTeamMessagesAsRead } = useMarkTeamMessagesAsReadMutation({
    coreUrl: CORE_URL,
  })

  const { mutate: createNotification } = useCreateNotificationMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    isPending: isPendingCompletionCreation,
    mutateAsync: createTeamMessage,
  } = useCreateTeamMessageMutation({
    coreUrl: CORE_URL,
  })

  // Reply thread messages hook
  const {
    messages,
    handleLoadOldMessages,
    handleLoadNewMessages,
    isLoading: isLoadingMessages,
    threadCreationDate,
    editingMessage,
    setEditingMessage,
    handleSubmitEditMessage,
    threadTitle: threadTitleFromReplyMessages,
    hasNextPage,
    isFetchingNextPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    initialPage,
    setInitialPage,
    hasLoadedLatestPage,
    isFetching: isFetchingMessages,
    refetch: refetchMessages,
    isRefetching,
    isJumpThreadLoading,
    isJumpThreadRefetching,
  } = useReplyThreadMessages({
    coreUrl: CORE_URL,
    replyTeamThreadId: currentReplyThreadId || undefined,
  })

  const teamThreadId = messages[0]?.teamThreadId ?? null

  // File attachments hook
  const {
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    isUploadingFiles,
  } = useTeamChatFileAttachments({
    pulseAction,
    pulseId,
    type: 'MINI_PULSE_CHAT',
  })

  // Team chat actions hook
  const {
    handleDeleteMessage: deleteMessage,
    handlePinMessage,
    isDeleting,
  } = useTeamChatActions({
    currentReplyThreadId,
    pulseId,
    refetchMessages,
  })

  // Debounced refetch handler
  const debouncedRefetch = useRef(
    _.debounce(
      () => {
        refetchMessages?.()
      },
      REFETCH_DELAY,
      { leading: true, trailing: true },
    ),
  ).current

  // Pusher chat integration
  const { typingUsers, handleTyping } = usePusherContext().usePusherChat({
    channelName:
      pulseId && currentReplyThreadId
        ? `reply.team.thread.${pulseId}.${currentReplyThreadId}`
        : '',
    messageEventNames: [
      '.ai-reply-generation-started',
      '.ai-reply-completed',
      '.reply-team-message-sent',
    ],
    onMessageEvent: (eventName: string, _payload: unknown) => {
      if (eventName === '.ai-reply-generation-started') {
        setIsAiGeneratingReply(true)
      } else if (eventName === '.reply-team-message-sent') {
        debouncedRefetch()
      } else if (eventName === '.ai-reply-completed') {
        debouncedRefetch()
        setIsAiGeneratingReply(false)
      }
    },
    typingEventName: 'reply-team-user-typing',
  })

  // Typing indicator text
  const typingIndicatorText = useMemo(() => {
    const userCount = typingUsers.size
    const userArray = Array.from(typingUsers)

    if (userCount === 0 && !isAiGeneratingReply) return ''
    if (userCount === 0 && isAiGeneratingReply) return 'AI is generating...'

    let text = ''
    if (userCount === 1) {
      text = `${userArray[0]} is typing`
    } else if (userCount === 2) {
      text = `${userArray.join(' and ')} are typing`
    } else if (userCount <= 3) {
      text = `${userArray.slice(0, -1).join(', ')} and ${userArray.slice(-1)[0]} are typing`
    } else {
      text = 'Several users are typing'
    }

    return isAiGeneratingReply
      ? `${text} and AI is generating...`
      : `${text}...`
  }, [typingUsers, isAiGeneratingReply])

  // Store update functions
  const updateTeamChatInputInStore = useCallback(
    ({ id, message }: { id: string; message: string }) => {
      addActionToPulse({ id, updates: { teamChatInput: message } })
    },
    [addActionToPulse],
  )

  const clearReplyingToInStore = useCallback(
    ({ pulseId }: { pulseId: string | undefined }) => {
      if (!pulseId) {
        toast.error(t('pulse_id_missing', { ns: 'topics' }))
        return
      }

      const updateKey = isMiniPulse
        ? 'replyingToMiniPulseChat'
        : 'replyingToTeamChat'
      addActionToPulse({
        id: pulseId,
        updates: { [updateKey]: null },
      })
    },
    [isMiniPulse, addActionToPulse],
  )

  // Debounced store update
  const debouncedUpdateTeamChatInputInStore = useMemo(
    () => _.debounce(updateTeamChatInputInStore, DEBOUNCE_DELAY),
    [updateTeamChatInputInStore],
  )

  // Handlers
  const handleMentionSelect = useCallback((mention: MentionType) => {
    setMentions((prev) => [...prev, mention])
  }, [])

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
        const files = attachments.map((att) => ({
          fileKey: att.fileKey ?? '',
          fileName: att.fileName,
          type: att.fileType,
        }))

        const repliedToMessageId = isMiniPulse
          ? pulseAction?.replyingToMiniPulseChat?.id
          : pulseAction?.replyingToTeamChat?.id

        // Clear form and state
        reset({ files: null, message: '' })
        clearReplyingToInStore({ pulseId })
        addActionToPulse({
          id: pulseId,
          updates: {
            [isMiniPulse ? 'miniPulseChatAttachments' : 'teamChatAttachments']:
              [],
          },
        })

        const hasAlertMention = mentions.some(
          (mention) => mention.name === 'alert',
        )
        await createTeamMessage({
          content: message.toString(),
          files,
          pulseId,
          repliedToMessageId,
          replyTeamThreadId: currentReplyThreadId,
          teamThreadId,
          topicId: topicId,
          userId: user?.id ?? '',
          ...(hasAlertMention && {
            metadata: {
              type: TeamMessageType.Alert,
            },
          }),
        })

        // handle notification sending for each mention
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
      mentions,
      reset,
      attachments,
      pulseAction,
      isMiniPulse,
      clearReplyingToInStore,
      addActionToPulse,
      topicId,
      t,
    ],
  )

  const handleAttachmentClick = useCallback((attachment: AttachmentData) => {
    setSelectedAttachment(attachment)
    setShowSideTray(true)
  }, [])

  const handleSideTrayClose = useCallback(() => {
    setShowSideTray(false)
    setSelectedAttachment(null)
  }, [])

  const handleSetReplyThreadId = useCallback(
    (replyThreadId: string) => {
      onSetReplyThreadId(replyThreadId)
    },
    [onSetReplyThreadId],
  )

  const handleDeleteMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (id: string) => {
      const messageToDelete = messages.find((msg) => msg.id === id)
      if (messageToDelete) {
        setMessageToDelete({
          content: messageToDelete.content || '',
          date: messageToDelete.createdAt || '',
          gravatar: messageToDelete.user?.gravatar,
          id: messageToDelete.id,
          name: messageToDelete.user?.name || '',
        })
        setIsDeleteModalOpen(true)
      }
    },
    [messages],
  )

  const handleConfirmDelete = useCallback(() => {
    if (messageToDelete) {
      deleteMessage(messageToDelete.id)
      setIsDeleteModalOpen(false)
      setMessageToDelete(null)
    }
  }, [messageToDelete, deleteMessage])

  const clearDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false)
    setMessageToDelete(null)
  }, [])

  // Form submission handler for <Form> component
  const handleFormSubmit = useCallback(() => {
    if (isAiGeneratingReply) return

    if (editingMessage) {
      handleSubmitEditMessage(editingMessage.id, message)
    } else {
      handleSubmit(handleReplySubmit)()
    }

    reset({ files: null, message: '' })
    setAnchor(null)
    setInitialPage(null)
    scrollToBottom()
  }, [
    isAiGeneratingReply,
    editingMessage,
    handleSubmitEditMessage,
    message,
    handleSubmit,
    handleReplySubmit,
    reset,
    setAnchor,
    setInitialPage,
    scrollToBottom,
  ])

  // SlateInput submission handler (no event parameter)
  const handleSlateInputSubmit = useCallback(() => {
    if (isAiGeneratingReply) return

    if (editingMessage) {
      handleSubmitEditMessage(editingMessage.id, message)
    } else {
      handleSubmit(handleReplySubmit)()
    }

    reset({ files: null, message: '' })
    setAnchor(null)
    setInitialPage(null)
    scrollToBottom()
  }, [
    isAiGeneratingReply,
    editingMessage,
    handleSubmitEditMessage,
    message,
    handleSubmit,
    handleReplySubmit,
    reset,
    setAnchor,
    setInitialPage,
    scrollToBottom,
  ])

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null)
    reset({ message: '' })
  }, [setEditingMessage, reset])

  const handleCloseMiniPulseChat = useCallback(() => {
    clearReplyingToInStore({ pulseId })
    onCloseMiniPulseChat()
  }, [clearReplyingToInStore, pulseId, onCloseMiniPulseChat])

  const handleClearReplyingTo = useCallback(() => {
    clearReplyingToInStore({ pulseId })
  }, [clearReplyingToInStore, pulseId])

  // Scroll handlers
  const handleLoadOldMessagesWithScroll = useCallback(
    (inView: boolean) => {
      handleLoadOlder(inView, {
        hasMore: hasNextPage,
        isFetching: isFetchingNextPage,
        maintainPosition: true,
        onLoad: () => handleLoadOldMessages(inView),
      })
    },
    [handleLoadOlder, hasNextPage, isFetchingNextPage, handleLoadOldMessages],
  )

  const handleLoadNewMessagesWithScroll = useCallback(
    (inView: boolean) => {
      handleLoadNewer(inView, {
        hasMore: hasPreviousPage,
        isFetching: isFetchingPreviousPage,
        maintainPosition: true,
        onLoad: () => handleLoadNewMessages(inView),
      })
    },
    [
      handleLoadNewer,
      hasPreviousPage,
      isFetchingPreviousPage,
      handleLoadNewMessages,
    ],
  )

  const handleBackToPresent = useCallback(() => {
    setAnchor(null)
    setInitialPage(null)
    scrollToBottom()
  }, [setAnchor, setInitialPage, scrollToBottom])

  // Computed display values
  const displayThreadTitle = threadTitle || threadTitleFromReplyMessages
  const displayThreadDate = threadCreationDate || currentReplyThreadDate

  // SlateInput border radius styling
  const slateInputBorderRadius = useMemo(
    () => ({
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      borderTopLeftRadius: pulseAction?.replyingToMiniPulseChat ? 0 : 12,
      borderTopRightRadius: pulseAction?.replyingToMiniPulseChat ? 0 : 12,
    }),
    [pulseAction?.replyingToMiniPulseChat],
  )

  // Effects
  useEffect(() => {
    if (!pulseAction || hasInitializedChat.current || isMiniPulse) return

    setValue('message', pulseAction?.teamChatInput ?? '')
    hasInitializedChat.current = true
  }, [pulseAction, isMiniPulse, setValue])

  useEffect(() => {
    return () => {
      debouncedUpdateTeamChatInputInStore.cancel()
    }
  }, [debouncedUpdateTeamChatInputInStore])

  useEffect(() => {
    if (pulseId && !isMiniPulse && hasInitializedChat.current) {
      debouncedUpdateTeamChatInputInStore({ id: pulseId, message })
    }
  }, [message, isMiniPulse, debouncedUpdateTeamChatInputInStore, pulseId])

  useEffect(() => {
    if (editingMessage) {
      setValue('message', editingMessage.content ?? '')
    }
  }, [editingMessage, setValue])

  useEffect(() => {
    clearReplyingToInStore({ pulseId })
    setValue('message', '')
  }, [currentReplyThreadId, clearReplyingToInStore, pulseId, setValue])

  const hasInitialScrollRef = useRef(false)

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (
      !initialPage &&
      messageContainerRef.current &&
      !hasInitialScrollRef.current &&
      messages.length > 0
    ) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight
      hasInitialScrollRef.current = true
    }
  }, [messages.length, initialPage, messageContainerRef])

  // Refetch messages on reaction sent by other users
  usePusherChannel({
    channelName: user && `team-message-reactions.${user.id}`,
    eventName: '.team-message-reacted',
    onEvent: () => refetchMessages(),
  })

  return {
    clearDeleteModal,
    clearReplyingToInStore,
    control,
    currentReplyThreadId,
    displayThreadDate,
    displayThreadTitle,
    editingMessage,
    handleAttachmentClick,
    handleBackToPresent,
    handleCancelEdit,
    handleClearReplyingTo,
    handleCloseMiniPulseChat,
    handleConfirmDelete,
    handleDeleteMessage,
    handleFileUpload,
    handleFormSubmit,
    handleImageUpload,
    handleLoadNewMessagesWithScroll,
    handleLoadOldMessagesWithScroll,
    handleMentionSelect,
    handlePinMessage,
    handleRemoveFile,
    handleSetReplyThreadId,
    handleSideTrayClose,
    handleSlateInputSubmit,
    handleTyping,
    hasLoadedLatestPage,
    hasNextPage,
    hasPreviousPage,
    initialPage,
    isDeleteModalOpen,
    isDeleting,
    isFetchingMessages,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isJumpThreadLoading,
    isJumpThreadRefetching,
    isLoadingMessages,
    isPendingCompletionCreation,
    isRefetchingMessages: isRefetching,
    isUploadingFiles,
    isValidContent,
    lastJumpedMessageId: lastJumpedMessageIdMiniPulseChat,
    markTeamMessagesAsRead,
    mentionSuggestions,
    mentions,
    message,
    messageContainerRef,
    messageToDelete,
    messages,
    pulseAction,
    refetchMessages,
    register,
    reset,
    selectedAttachment,
    setEditingMessage,
    setInitialPage,
    setLastJumpedMessageId: setLastJumpedMessageIdMiniPulseChat,
    setMentions,
    setValue,
    showSideTray,
    slateEditorRef,
    slateInputBorderRadius,
    threadCreationDate,
    threadTitle: threadTitleFromReplyMessages,
    typingIndicatorText,
    user,
  }
}
