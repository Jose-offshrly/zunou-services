import { withAuthenticationRequired } from '@auth0/auth0-react'
import { Box, Stack, Typography } from '@mui/material'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type {
  TeamMessage,
  TeamMessagePaginator,
} from '@zunou-graphql/core/graphql'
import { Form } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { debounce } from 'lodash'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { InView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'
import { ReactEditor } from 'slate-react'

import { SlateInput } from '~/components/ui/form/SlateInput'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { TeamMessageSentData, usePusherContext } from '~/context/PusherContext'
import { ReplyThreadStatus } from '~/context/TeamChatContext'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { useDataSourceSidebar } from '~/store/useDataSourceSidebar'
import { useJumpStore } from '~/store/useJumpStore'
import { useMiniPulseChat } from '~/store/useMiniPulseChat'
import { SelectedTopic, usePulseStore } from '~/store/usePulseStore'

import { ChatMessageList } from './components/MessageList'
import MessageSearchTray from './components/MessageSearchTray'
import { MiniPulseChat } from './components/MiniPulseChat'
import ReplyingToPreview from './components/ReplyingToPreview'
import { TeamChatHeader } from './components/TeamChatHeader/TeamChatHeader'
import { TopicsModal } from './components/TopicsModal/TopicsModal'
import { useTeamChat } from './hooks/useTeamChat'

const TeamChatPage = () => {
  const { user: authUser } = useAuthContext()
  const {
    pulse,
    pulseMembers,
    pulseActions,
    addActionToPulse,
    currentTopic,
    setCurrentTopic,
  } = usePulseStore()
  const { setIsCollapsed } = useDataSourceSidebar()
  const { organizationId, pulseId } = useParams<{
    organizationId: string
    pulseId: string
  }>()

  const { setAnchor, setLastJumpedMessageId, lastJumpedMessageId } =
    useJumpStore()
  const {
    openMiniPulseChat,
    setOpenMiniPulseChat,
    currentReplyThreadId,
    setCurrentReplyThreadId,
    currentReplyThreadDate,
    setCurrentReplyThreadDate,
    threadTitle,
    setThreadTitle,
  } = useMiniPulseChat()

  const [openTopicsModal, setOpenTopicsModal] = useState(false)

  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const messageContainerRef = useRef<HTMLDivElement>(null)

  const queryClient = useQueryClient()
  const slateEditorRef = useRef<ReactEditor | null>(null)
  const prevTopicIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (pulseId) {
      setCurrentTopic({ hasUnread: false, id: 'general', name: 'General' })
    }
  }, [pulseId, setCurrentTopic])

  useEffect(() => {
    // Temporarily collapse data source sidebar when mini pulse chat opens (skip localStorage persistence)
    if (openMiniPulseChat) setIsCollapsed(true)
  }, [openMiniPulseChat])

  const handleOpenMiniPulseChatWithThreadInfo = useCallback(
    (threadId: string, title?: string, date?: string) => {
      setCurrentReplyThreadId(threadId)
      setThreadTitle(title ?? null)
      setCurrentReplyThreadDate(date ?? null)
      setOpenMiniPulseChat(false)
      return true
    },
    [
      setCurrentReplyThreadId,
      setThreadTitle,
      setCurrentReplyThreadDate,
      setOpenMiniPulseChat,
    ],
  )

  const topicId = currentTopic?.id === 'general' ? undefined : currentTopic?.id

  const {
    handleMainChatSubmit,
    messages,
    control,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoadingMessages,
    isValidContent,
    handleLoadOlderMessages,
    handleLoadNewerMessages,
    refetchMessages,
    handleSetReplyThreadId,
    handleDeleteMessage,
    setMentions,
    isDeleting,
    isPendingCompletionCreation,
    markTeamMessagesAsRead,
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    reset,
    pinnedMessagesData,
    handleUnpinMessage,
    clearReplyingToInStore,
    initialPage,
    jumpToPresent,
    hasLoadedLatestPage,
    isJumpTeamThreadLoading,
    isJumpTeamThreadRefetching,
    isRefetching,
  } = useTeamChat({
    currentReplyThreadId,
    messageContainerRef,
    onOpenMiniPulseChatWithThreadInfo: handleOpenMiniPulseChatWithThreadInfo,
    onSetReplyThreadId: setCurrentReplyThreadId,
    organizationId: organizationId!,
    pulseId,
    topicId,
  })

  // Scroll to bottom when topic changes
  useLayoutEffect(() => {
    const currentTopicId = topicId
    const prevTopicId = prevTopicIdRef.current

    if (
      currentTopicId !== prevTopicId &&
      messages.length > 0 &&
      messageContainerRef.current
    ) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight
    }

    prevTopicIdRef.current = currentTopicId
  }, [topicId, messages.length])

  const debouncedRefetch = useRef(
    debounce(refetchMessages, 300, { leading: true, trailing: true }),
  ).current

  const handleNewMessage = useCallback(
    (eventName: string, payload: TeamMessageSentData) => {
      if (
        eventName === '.team-message-sent' &&
        payload?.replyTeamThreadId &&
        payload?.metadata
      ) {
        queryClient.setQueryData(
          [
            'teamThreadMessages',
            pulseId,
            topicId,
            ...(initialPage ? [initialPage] : []),
          ],
          (old: InfiniteData<TeamMessagePaginator> | undefined) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page: TeamMessagePaginator) => ({
                ...page,
                data: page.data.map((msg: TeamMessage) =>
                  msg.replyTeamThreadId === payload.replyTeamThreadId
                    ? { ...msg, metadata: payload.metadata }
                    : msg,
                ),
              })),
            }
          },
        )
      }
      debouncedRefetch()
    },
    [debouncedRefetch, pulseId, queryClient],
  )

  const { typingUsers, handleTyping } = usePusherContext().usePusherChat({
    channelName: pulseId ? `team.thread.${pulseId}` : '',
    messageEventNames: [
      '.team-message-sent',
      '.team-message-updated',
      '.team-message-deleted',
      '.ai-reply-generation-started',
    ],
    onMessageEvent: handleNewMessage,
    typingEventName: 'team-user-typing',
  })

  // Refetch messages on reaction sent by other users
  usePusherChannel({
    channelName: authUser && `team-message-reactions.${authUser.id}`,
    eventName: '.team-message-reacted',
    onEvent: () => refetchMessages(),
  })

  // Topics
  const handleTopicChange = useCallback(
    (topic: SelectedTopic) => {
      if (!pulseId) return

      setAnchor(null)
      setLastJumpedMessageId(null)

      setCurrentTopic(topic)
    },
    [pulseId],
  )

  const handleGeneralClick = useCallback(() => {
    if (!pulseId) return

    setCurrentTopic({ hasUnread: false, id: 'general', name: 'General' })
  }, [pulseId, addActionToPulse])

  const handleTopicSelect = useCallback(
    (topic: { id: string; name: string; unreadCount?: number }) => {
      if (!pulseId) return
      setCurrentTopic({
        hasUnread: (topic.unreadCount ?? 0) > 0,
        id: topic.id,
        name: topic.name,
      })
    },
    [pulseId, addActionToPulse],
  )

  useEffect(() => {
    const teamThreadId = pulse?.team_thread?.id

    if (!teamThreadId) return

    markTeamMessagesAsRead({
      organizationId,
      pulseId,
      threadId: teamThreadId,
      topicId: currentTopic?.id === 'general' ? undefined : currentTopic?.id,
    })
  }, [pulse, currentTopic])

  const parentReplyMessage = messages.find(
    (msg) => msg.replyTeamThreadId === currentReplyThreadId,
  )

  useEffect(() => {
    if (
      currentReplyThreadId &&
      parentReplyMessage &&
      (parentReplyMessage.metadata?.status as ReplyThreadStatus) ===
        ReplyThreadStatus.COMPLETE &&
      !openMiniPulseChat
    ) {
      setOpenMiniPulseChat(true)
    }
  }, [currentReplyThreadId, parentReplyMessage, openMiniPulseChat])

  const teamThreadId = pulse?.team_thread?.id

  // Focus on Slate editor when replying to team chat
  useEffect(() => {
    if (pulseAction?.replyingToTeamChat && slateEditorRef.current) {
      setTimeout(() => {
        if (slateEditorRef.current) {
          ReactEditor.focus(slateEditorRef.current)
        }
      }, 0)
    }
  }, [pulseAction?.replyingToTeamChat])

  const handleTopicCreated = useCallback(() => {
    if (slateEditorRef.current) {
      setTimeout(() => {
        if (slateEditorRef.current) {
          ReactEditor.focus(slateEditorRef.current)
        }
      }, 0)
    }
  }, [])

  const specialMentions = [
    {
      id: 'everyone',
      name: 'everyone',
    },
    {
      id: 'here',
      name: 'here',
    },
  ]

  const pulseAndAlertMentions = [
    {
      id: 'alert',
      name: 'alert',
    },
    {
      id: 'pulse',
      name: 'pulse',
    },
  ]

  // show special mentions only if pulse members are more than 2
  const mentionSuggestions = [
    ...pulseAndAlertMentions,
    ...(pulseMembers.length > 2 ? specialMentions : []),
    ...pulseMembers
      .filter((member) => member.user.id !== authUser?.id)
      .map((m) => ({ id: m.userId, name: m.user.name })),
  ]

  return (
    <Stack direction="column" height="100%" width="100%">
      <TeamChatHeader
        currentTopic={currentTopic}
        onGeneralClick={handleGeneralClick}
        onSeeAllTopics={() => setOpenTopicsModal(true)}
        onTopicChange={handleTopicChange}
        onTopicCreated={handleTopicCreated}
        onUnpinMessage={handleUnpinMessage}
        pinnedMessagesData={pinnedMessagesData}
        recentTopics={[]}
        teamThreadId={teamThreadId}
      />
      <Stack direction="row" flex={1} position="relative" width="100%">
        <Stack
          direction="row"
          flex={1}
          height="100%"
          p={2}
          px={8}
          spacing={openMiniPulseChat ? 4 : 0}
        >
          <Stack
            flex={1}
            height="100%"
            position="relative"
            spacing={1}
            width="100%"
          >
            <Box
              ref={messageContainerRef}
              sx={{
                '&::-webkit-scrollbar': { width: '0px' },
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                height: 0,
                overflowY: 'auto',
              }}
            >
              {hasNextPage && !isLoadingMessages && (
                <InView
                  onChange={handleLoadOlderMessages}
                  threshold={0.1}
                  triggerOnce={false}
                >
                  {({ ref }) => (
                    <div
                      ref={ref}
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        minHeight: 32,
                      }}
                    >
                      {isFetchingNextPage && messages.length > 0 && (
                        <LoadingSpinner />
                      )}
                    </div>
                  )}
                </InView>
              )}

              {!isLoadingMessages && (
                <ChatMessageList
                  handleDeleteMessage={handleDeleteMessage}
                  initialPage={
                    hasLoadedLatestPage || !lastJumpedMessageId
                      ? null
                      : initialPage
                  }
                  isDeleting={isDeleting}
                  isLoading={
                    isLoadingMessages ||
                    isJumpTeamThreadLoading ||
                    isJumpTeamThreadRefetching
                  }
                  isMiniPulseChatOpen={openMiniPulseChat}
                  messages={messages}
                  onBackToPresent={jumpToPresent}
                  onSetReplyThreadId={handleSetReplyThreadId}
                  onTopicSelect={handleTopicSelect}
                  readyToJump={
                    isLoadingMessages &&
                    isRefetching &&
                    isJumpTeamThreadLoading &&
                    isJumpTeamThreadRefetching
                  }
                  showWelcomeMessage={!hasNextPage && !isLoadingMessages}
                  topicName={
                    currentTopic && currentTopic.id !== 'general'
                      ? currentTopic.name
                      : undefined
                  }
                />
              )}
              {/* Load newer messages at the bottom */}
              {hasPreviousPage && !isLoadingMessages && (
                <InView
                  onChange={handleLoadNewerMessages}
                  threshold={0.1}
                  triggerOnce={false}
                >
                  {({ ref }) => (
                    <div
                      ref={ref}
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        minHeight: 32,
                      }}
                    >
                      {isFetchingPreviousPage && messages.length > 0 && (
                        <LoadingSpinner />
                      )}
                    </div>
                  )}
                </InView>
              )}
              {isLoadingMessages && (
                <Stack
                  alignItems="center"
                  height="100%"
                  justifyContent="center"
                  width="100%"
                >
                  <LoadingSpinner />
                </Stack>
              )}
            </Box>
            <Stack direction="row" spacing={2}>
              {typingUsers.size > 0 && (
                <Typography color="text.secondary" variant="caption">
                  {typingUsers.size === 1
                    ? `${Array.from(typingUsers)[0]} is typing...`
                    : typingUsers.size === 2
                      ? `${Array.from(typingUsers).join(' and ')} are typing...`
                      : typingUsers.size <= 3
                        ? `${Array.from(typingUsers).slice(0, -1).join(', ')} and ${Array.from(typingUsers).slice(-1)[0]} are typing...`
                        : 'Several users are typing...'}
                </Typography>
              )}
            </Stack>
            <Form
              maxWidth="xl"
              onSubmit={(e) => {
                e.preventDefault()
                handleMainChatSubmit()
              }}
              sx={{ padding: 0, width: '100%' }}
            >
              <Stack>
                {pulseAction?.replyingToTeamChat && (
                  <ReplyingToPreview
                    clear={clearReplyingToInStore}
                    replyingTo={pulseAction.replyingToTeamChat}
                  />
                )}
                <SlateInput
                  attachmentFiles={pulseAction?.teamChatAttachments ?? []}
                  control={control}
                  disableAddMenu={
                    (pulseAction?.teamChatAttachments ?? []).length === 5
                  }
                  disableAddMenuTooltip="Upload limit reached. You can attach up to 5 files only."
                  disabledSubmit={!isValidContent}
                  editorRef={slateEditorRef}
                  isLoading={isPendingCompletionCreation}
                  mentionSuggestions={mentionSuggestions}
                  name="message"
                  onCancel={reset}
                  onFileUpload={handleFileUpload}
                  onImageUpload={handleImageUpload}
                  onRemoveFile={handleRemoveFile}
                  onSubmit={handleMainChatSubmit}
                  onTyping={handleTyping}
                  setMentions={setMentions}
                  showAddMenu={true}
                  sx={{
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                    borderTopLeftRadius: pulseAction?.replyingToTeamChat
                      ? 0
                      : 12,
                    borderTopRightRadius: pulseAction?.replyingToTeamChat
                      ? 0
                      : 12,
                  }}
                  type="TEAM_CHAT"
                />
              </Stack>
            </Form>
          </Stack>
          {openMiniPulseChat && (
            <Stack width="50%">
              <MiniPulseChat
                currentReplyThreadDate={currentReplyThreadDate}
                openMiniPulseChat={openMiniPulseChat}
                replyTeamThreadId={currentReplyThreadId}
                setCurrentReplyThreadId={setCurrentReplyThreadId}
                setOpenMiniPulseChat={(open) => {
                  setOpenMiniPulseChat(open)
                  if (!open) setCurrentReplyThreadId(null)
                }}
                threadTitle={threadTitle ?? undefined}
              />
            </Stack>
          )}
        </Stack>

        <MessageSearchTray />
      </Stack>
      <TopicsModal
        isOpen={openTopicsModal}
        onClose={() => setOpenTopicsModal(false)}
        onCreateNewTopic={() => {
          console.log('Create new topic clicked')
        }}
        onTopicCreated={handleTopicCreated}
        onTopicSelect={handleTopicSelect}
        topics={[]}
      />
    </Stack>
  )
}

export default withAuthenticationRequired(TeamChatPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
