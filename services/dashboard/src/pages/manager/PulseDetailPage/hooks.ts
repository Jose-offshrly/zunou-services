import { useQueryClient } from '@tanstack/react-query'
import {
  PulseCategory,
  ThreadType,
  TopicEntityType,
} from '@zunou-graphql/core/graphql'
import { useCreateCompletionMutation } from '@zunou-queries/core/hooks/useCreateCompletionMutation'
import { useCreateThreadMutation } from '@zunou-queries/core/hooks/useCreateThreadMutation'
import { useDeleteSavedMessageMutation } from '@zunou-queries/core/hooks/useDeleteSavedMessageMutation'
import { useGetMessagesQuery } from '@zunou-queries/core/hooks/useGetMessagesQuery'
import { useGetTopics } from '@zunou-queries/core/hooks/useGetTopicsQuery'
import { useSaveMessageMutation } from '@zunou-queries/core/hooks/useSaveMessageMutation'
import { AttachmentData } from '@zunou-react/components/form/AttachmentItem'
import { ContentType } from '@zunou-react/components/form/FormattedContent'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { UserRoleType } from '@zunou-react/types/role'
import dayjs from 'dayjs'
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
import { useLocation, useParams } from 'react-router-dom'

import { DEFAULT_TOPIC } from '~/components/domain/chatHeader'
import { SummaryOption } from '~/components/domain/threads/MessageListV2/aiMessages/KeyPointsMessage'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { zodResolver } from '~/libs/zod'
import {
  ThreadMessageInput,
  threadMessageSchema,
} from '~/schemas/ThreadMessageSchema'
import { ShowPulseWelcomeState, usePulseStore } from '~/store/usePulseStore'
import { useTopicStore } from '~/store/useTopicStore'

import { useInsights } from './useInsights'

const scrollToBottom = (
  containerRef: RefObject<HTMLDivElement>,
  smooth = true,
) => {
  if (containerRef.current) {
    containerRef.current.scrollTo({
      behavior: smooth ? 'smooth' : 'auto',
      top: containerRef.current.scrollHeight,
    })
  }
}

export const CLOSE_WELCOME_MESSAGE_KEY = 'closeWelcomeMessage'

const threadTypeMap: Record<UserRoleType, ThreadType> = {
  [UserRoleEnum.MANAGER]: ThreadType.Admin,
  [UserRoleEnum.EMPLOYEE]: ThreadType.User,
  [UserRoleEnum.GUEST]: ThreadType.Guest,
}

export const useHooks = () => {
  // const [searchParams] = useSearchParams()

  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()
  const { user, userRole } = useAuthContext()
  const location = useLocation() as { state?: { scrollToBottom?: boolean } }
  const {
    activeThreadId,
    pulseWelcomeState,
    setPulseWelcomeState,
    setPulseDelayedLoader,
    setIsPulseRefreshDisabled,
    pulseDelayedLoader,
    pulseActions,
    addActionToPulse,
    pulseCategory,
    isPulseRefreshDisabled,
    setActiveThreadId,

    setPulseChatMode,
    pulseChatMode,
  } = usePulseStore()

  const queryClient = useQueryClient()

  // const hasSetInitialTopic = useRef(false)

  const { currentPulseTopic, setCurrentPulseTopic } = useTopicStore()

  const [showSideTray, setShowSideTray] = useState(false)
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentData | null>(null)
  const [attachmentType, setAttachmentType] = useState<ContentType | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isFirstLoadRef = useRef<boolean>(true)
  const canLoadMoreRef = useRef<boolean>(false)

  const topics = useGetTopics({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled:
      Boolean(organizationId && pulseId) &&
      pulseCategory === PulseCategory.Personal,
    variables: {
      organizationId,
      pulseId,
      type: TopicEntityType.Thread,
    },
  })

  // const getTopic = useGetTopic({
  //   coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  //   enabled: Boolean(searchParams.get('topicId')),
  //   variables: {
  //     topicId: searchParams.get('topicId'),
  //   },
  // })

  // useEffect(() => {
  //   if (
  //     pulseCategory !== PulseCategory.Personal ||
  //     hasSetInitialTopic.current
  //   ) {
  //     return
  //   }

  //   const topicIdFromQuery = searchParams.get('topicId')

  //   if (!topicIdFromQuery) {
  //     setCurrentPulseTopic(DEFAULT_TOPIC)
  //     hasSetInitialTopic.current = true
  //     return
  //   }

  //   if (getTopic.isLoading) {
  //     return
  //   }

  //   if (getTopic.data?.topic) {
  //     const selectedTopic = getTopic.data.topic

  //     setCurrentPulseTopic({
  //       hasUnread: false,
  //       id: selectedTopic.id,
  //       name: selectedTopic.name,
  //       threadId: selectedTopic.thread?.id,
  //     })

  //     hasSetInitialTopic.current = true
  //     return
  //   }

  //   if (!getTopic.isLoading && !getTopic.data?.topic) {
  //     setCurrentPulseTopic(DEFAULT_TOPIC)
  //     hasSetInitialTopic.current = true
  //   }
  // }, [
  //   searchParams,
  //   getTopic.data,
  //   getTopic.isLoading,
  //   setCurrentPulseTopic,
  //   pulseCategory,
  // ])

  const timezone = user?.timezone ?? 'UTC'

  const welcomeMsgState = useMemo(() => {
    return (
      pulseWelcomeState.find((state) => state.pulseId === pulseId)?.state ??
      null
    )
  }, [pulseWelcomeState, pulseId])

  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const initialMessage = useMemo(
    () => pulseAction?.pulseChatInput ?? '',
    [pulseAction],
  )

  const updatePulseChatInputInStore = useCallback(
    ({ id, message }: { id: string; message: string }) =>
      addActionToPulse({ id, updates: { pulseChatInput: message } }),
    [addActionToPulse],
  )

  const debouncedUpdatePulseChatInputInStore = useMemo(
    () => _.debounce(updatePulseChatInputInStore, 300),
    [updatePulseChatInputInStore],
  )

  useEffect(() => {
    return () => {
      debouncedUpdatePulseChatInputInStore.cancel()
    }
  }, [debouncedUpdatePulseChatInputInStore])

  const {
    formState: { isValid },
    handleSubmit,
    register,
    reset,
    control,
    watch,
    setValue,
  } = useForm<ThreadMessageInput>({
    defaultValues: {
      files: null,
      message: '',
    },
    mode: 'onChange',
    resolver: zodResolver(threadMessageSchema),
  })

  const message = watch('message')

  useEffect(() => {
    setValue('message', initialMessage)
  }, [initialMessage, setValue])

  useEffect(() => {
    if (pulseId) {
      setValue('message', initialMessage)
    }
  }, [pulseId, initialMessage, setValue])

  useEffect(() => {
    if (pulseId) debouncedUpdatePulseChatInputInStore({ id: pulseId, message })
  }, [message, pulseId, debouncedUpdatePulseChatInputInStore])

  const { mutateAsync: deleteSavedMessage } = useDeleteSavedMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleDeleteSavedMessage = async (id: string) => {
    try {
      if (!id) {
        throw new Error('No saved message ID found')
      }
      await deleteSavedMessage({ savedMessageId: id })
      toast.success('Successfully removed saved message!')
    } catch (err) {
      toast.error('Failed to delete saved message')
      console.error('Deleting saved message failed: ', err)
    }
  }

  const threadId =
    currentPulseTopic &&
    currentPulseTopic.id !== 'general' &&
    currentPulseTopic.threadId
      ? currentPulseTopic.threadId
      : activeThreadId

  const {
    data: messageData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading: isLoadingMessages,
    isRefetching,
    refetch: refetchMessageData,
  } = useGetMessagesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!activeThreadId,
    variables: {
      organizationId,
      threadId,
    },
  })

  const messages = useMemo(
    () => messageData?.pages.flatMap((page) => page.data) ?? [],
    [messageData],
  )

  const { showOnboardingMessage, setShowOnboardingMessage, insightsLength } =
    useInsights({
      hasMessages: message.length > 0,
      isLoadingMessages,
    })

  useEffect(() => {
    if (messages.length > 0) setIsPulseRefreshDisabled(false)
    else setIsPulseRefreshDisabled(true)
  }, [messages, setIsPulseRefreshDisabled])

  const prevHasMessagesRef = useRef<boolean>(false)

  useEffect(() => {
    if (!activeThreadId || isLoadingMessages || isRefetching) return

    const hasMessages =
      messageData?.pages?.some((page) => page.data && page.data.length > 0) ??
      false

    const prevHasMessages = prevHasMessagesRef.current

    if (
      !hasMessages &&
      prevHasMessages &&
      welcomeMsgState === ShowPulseWelcomeState.Hidden
    ) {
      setPulseWelcomeState((currentState) =>
        currentState.map((pulse) =>
          pulse.pulseId === pulseId
            ? { ...pulse, state: ShowPulseWelcomeState.Show }
            : pulse,
        ),
      )
    }

    prevHasMessagesRef.current = hasMessages
  }, [
    activeThreadId,
    isLoadingMessages,
    isRefetching,
    messageData,
    pulseId,
    welcomeMsgState,
    setPulseWelcomeState,
  ])

  const latestMessage = useMemo(() => {
    return messages[messages.length - 1] || null
  }, [messages])

  const { mutateAsync: saveMessage } = useSaveMessageMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const {
    isPending: isPendingCompletionCreation,
    mutateAsync: createCompletion,
  } = useCreateCompletionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  useEffect(() => {
    handleSideTrayClose()
  }, [userRole])

  // Initial scroll to bottom on first load
  useEffect(() => {
    if (
      isFirstLoadRef.current &&
      messages.length > 0 &&
      !isLoadingMessages &&
      containerRef.current
    ) {
      scrollToBottom(containerRef, false)
      isFirstLoadRef.current = false

      // Enable load more after a short delay to prevent immediate triggering
      setTimeout(() => {
        canLoadMoreRef.current = true
      }, 500)
    }
  }, [messages.length, isLoadingMessages])

  // Reset canLoadMore when thread changes
  useEffect(() => {
    canLoadMoreRef.current = false
    isFirstLoadRef.current = true
  }, [threadId])

  // Reset scroll refs and scroll to bottom when topic changes
  useEffect(() => {
    // Reset refs for the new topic
    canLoadMoreRef.current = false
    isFirstLoadRef.current = true

    // Scroll to bottom once messages are loaded
    if (
      currentPulseTopic &&
      messages.length > 0 &&
      !isLoadingMessages &&
      !isRefetching
    ) {
      scrollToBottom(containerRef, false)
      isFirstLoadRef.current = false

      // Re-enable load more after scroll
      setTimeout(() => {
        canLoadMoreRef.current = true
      }, 500)
    }
  }, [currentPulseTopic?.id, messages.length, isLoadingMessages, isRefetching])

  // Scroll to bottom when switching to CHAT mode
  useEffect(() => {
    if (
      pulseChatMode === 'CHAT' &&
      messages.length > 0 &&
      !isLoadingMessages &&
      !isRefetching
    ) {
      scrollToBottom(containerRef, false)
    }
  }, [pulseChatMode, messages.length, isLoadingMessages, isRefetching])

  // Handle AI message updates via Pusher
  usePusherChannel({
    channelName: threadId && `thread.${threadId}`,
    eventName: '.ai-message',
    onEvent: async () => {
      await refetchMessageData()
      setPulseDelayedLoader({ isShowing: false, message: null })

      // Smooth scroll on AI reply
      requestAnimationFrame(() => {
        scrollToBottom(containerRef, true)
      })
    },
  })

  usePusherChannel({
    channelName: pulseId && `pulse-chat.${pulseId}`,
    eventName: '.message.delayed',
    onEvent: ({ message }: { message: string }) => {
      setPulseDelayedLoader({ isShowing: true, message })
    },
  })

  const handleReturnToPulseChat = useCallback(() => {
    if (!pulseId) return

    setPulseWelcomeState((prev) =>
      prev.map((state) =>
        state.pulseId === pulseId
          ? {
              ...state,
              showRevertThread: false,
              state: ShowPulseWelcomeState.Hidden,
            }
          : state,
      ),
    )
  }, [pulseId, setPulseWelcomeState])

  useEffect(() => {
    const closeWelcomeMessage = sessionStorage.getItem(
      CLOSE_WELCOME_MESSAGE_KEY,
    )

    if (closeWelcomeMessage && closeWelcomeMessage === 'true') {
      handleReturnToPulseChat()
      sessionStorage.removeItem(CLOSE_WELCOME_MESSAGE_KEY)
    }
  }, [handleReturnToPulseChat])

  const onSubmit = useCallback(
    async (data: ThreadMessageInput) => {
      setPulseChatMode('CHAT')

      const { message } = data

      if (!pulseId) throw new Error('No pulse ID available')
      if (!threadId) throw new Error('No thread ID available')

      try {
        setShowOnboardingMessage(false)

        debouncedUpdatePulseChatInputInStore.cancel()
        updatePulseChatInputInStore({ id: pulseId, message: '' })

        reset({ files: null, message: '' })
        handleReturnToPulseChat()

        await createCompletion({
          message,
          organizationId,
          threadId,
          topicId:
            currentPulseTopic.id !== DEFAULT_TOPIC.id
              ? currentPulseTopic.id
              : undefined,
        })

        // Smooth scroll after sending message
        requestAnimationFrame(() => {
          scrollToBottom(containerRef, true)
        })
      } catch (error) {
        toast.error('Failed to send message')
        setValue('message', message)
        if (pulseId) {
          updatePulseChatInputInStore({ id: pulseId, message })
        }
      }
    },
    [
      pulseId,
      threadId,
      debouncedUpdatePulseChatInputInStore,
      updatePulseChatInputInStore,
      reset,
      handleReturnToPulseChat,
      createCompletion,
      organizationId,
      currentPulseTopic.id,
      setValue,
      setPulseChatMode,
    ],
  )

  const handleSummarySubmit = async (message: string, summary_id?: string) => {
    if (!threadId) throw new Error('No thread ID available')

    try {
      const jsonMetadata = JSON.stringify({ summary_id })

      await createCompletion({
        message,
        metadata: jsonMetadata,
        organizationId,
        threadId,
      })
    } catch (error) {
      console.error('Error creating completion:', error)
    }
  }

  const handleSaveMessage = async (id: string) => {
    if (!activeThreadId) {
      console.error('Cannot save message: No active thread ID.')
      return
    }

    if (!pulseId) {
      console.error('Cannot save message: Pulse ID is missing.')
      return
    }

    try {
      await saveMessage({
        messageId: id,
        organizationId,
        pulseId,
        threadId: activeThreadId,
      })
      toast.success('Successfully saved message!')
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const { mutateAsync: createThread } = useCreateThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const createNewThread = useCallback(async () => {
    if (!userRole) {
      throw new Error('Cannot create thread: User Role is required')
    }

    if (!pulseId) {
      throw new Error('Cannot create thread: Pulse ID is required')
    }

    await createThread(
      {
        name: 'New Chat',
        organizationId,
        pulseId,
        type: threadTypeMap[userRole],
      },
      {
        onSuccess: (res) => {
          setActiveThreadId(res.createThread.id)

          queryClient.invalidateQueries({
            queryKey: [
              'activeThread',
              pulseId,
              organizationId,
              threadTypeMap[userRole],
            ],
          })

          queryClient.removeQueries({
            queryKey: ['previousThread', pulseId, organizationId],
          })
        },
      },
    )

    const targetPulse = pulseWelcomeState.find(
      (pulse) => pulse.pulseId === pulseId,
    )

    if (!targetPulse) return

    const initialData = targetPulse.initialData

    if (!initialData) return

    const currentTime = dayjs().tz(timezone)
    const twentyFourHoursAgo = currentTime.subtract(24, 'hours')

    // The date of these are already in the correct timezone
    const meetings = initialData?.meetings ?? []
    const tasks = initialData?.tasks ?? []
    const dataSources = initialData?.dataSources ?? []

    // Filter meetings by date field (last 24 hours)
    const recentMeetings = meetings.filter((meeting) => {
      const meetingDate = dayjs.tz(meeting.date, timezone)
      return meetingDate.isAfter(twentyFourHoursAgo)
    })

    // Filter tasks by createdAt field (last 24 hours)
    const recentTasks = tasks.filter((task) => {
      const taskDate = dayjs.tz(task.createdAt, timezone)
      return taskDate.isAfter(twentyFourHoursAgo)
    })

    // Filter dataSources by createdAt field (last 24 hours)
    const recentDataSources = dataSources.filter((dataSource) => {
      const dataSourceDate = dayjs.tz(dataSource.createdAt, timezone)
      return dataSourceDate.isAfter(twentyFourHoursAgo)
    })

    // Create new initialData object instead of mutating the original
    const updatedInitialData = {
      ...initialData,
      dataSources: recentDataSources,
      meetings: recentMeetings,
      tasks: recentTasks,
    }

    // Pulse's welcome state should already be set in pulse layout, update it to first time.
    setPulseWelcomeState(
      pulseWelcomeState.map((pulse) =>
        pulse.pulseId === pulseId
          ? {
              ...pulse,
              initialData: updatedInitialData,
              showRevertThread: true,
              state: ShowPulseWelcomeState.Show,
            }
          : pulse,
      ),
    )
  }, [
    userRole,
    pulseId,
    organizationId,
    createThread,
    threadTypeMap,
    queryClient,
    pulseWelcomeState,
    timezone,
    setPulseWelcomeState,
  ])

  const handleAttachmentClick = (
    attachment: AttachmentData,
    type?: ContentType,
  ) => {
    setSelectedAttachment(attachment)
    setShowSideTray(true)

    if (type) setAttachmentType(type)
    else setAttachmentType(null)
  }

  const handleSideTrayClose = () => {
    setShowSideTray(false)
    setSelectedAttachment(null)
  }

  const handleSummaryOptionSelect = (option: SummaryOption) => {
    if (option.prompt) {
      handleSummarySubmit(option.prompt, option.summary_id)
    }
  }

  const handleLoadMoreMessages = async (inView: boolean) => {
    // Don't load more if we're still doing initial setup or already fetching
    if (
      !canLoadMoreRef.current ||
      !inView ||
      isFetchingNextPage ||
      !hasNextPage
    ) {
      return
    }

    const container = containerRef.current
    if (container) {
      // Capture current scroll position
      const prevScrollHeight = container.scrollHeight
      const prevScrollTop = container.scrollTop

      await fetchNextPage()

      // Restore scroll position after new messages load
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight
          const heightDifference = newScrollHeight - prevScrollHeight
          container.scrollTop = prevScrollTop + heightDifference
        }
      })
    }
  }

  const triggerScrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      scrollToBottom(containerRef, smooth)
    })
  }

  // Handle scroll to bottom from location state
  useEffect(() => {
    if (
      location.state?.scrollToBottom &&
      messages.length > 0 &&
      !isLoadingMessages
    ) {
      triggerScrollToBottom(false)
    }
  }, [location.state?.scrollToBottom, messages.length, isLoadingMessages])

  return {
    activeThreadId,
    attachmentType,
    containerRef,
    control,
    createNewThread,
    currentPulseTopic,
    handleAttachmentClick,
    handleDeleteSavedMessage,
    handleLoadMoreMessages,
    handleReturnToPulseChat,
    handleSaveMessage,
    handleSideTrayClose,
    handleSubmit,
    handleSummaryOptionSelect,
    hasNextPage,
    insightsLength,
    isFetchingNextPage,
    isLoadingMessages,
    isPendingCompletionCreation,

    isPulseRefreshDisabled,

    // isSelectedTopicLoading: getTopic.isLoading,
    isValid,
    latestMessage,
    messages,
    onSubmit,
    organizationId,
    pulseCategory,
    pulseChatMode,
    pulseDelayedLoader,
    pulseId,
    register,
    selectedAttachment,
    setCurrentPulseTopic,
    setPulseChatMode,
    setPulseDelayedLoader,
    showOnboardingMessage,
    showSideTray,
    threadId,
    timezone,
    topics,
    triggerScrollToBottom,
    user,
    welcomeMsgState,
  }
}
