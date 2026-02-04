import { Stack, Typography } from '@mui/material'
import { TeamMessage } from '@zunou-graphql/core/graphql'
import { useEffect, useMemo } from 'react'

import { EditingProvider } from '~/context/MessageListContext'
import { useJumpStore } from '~/store/useJumpStore'
import { usePulseStore } from '~/store/usePulseStore'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { ChatMessage, ChatType } from '../ChatMessage'
import { WelcomeMessage } from './WelcomeMessage'

export type TeamMessageUI = TeamMessage & {
  messageDate: string
  isToday?: boolean
  pending?: boolean
}

interface ChatMessageListProps {
  messages: TeamMessage[]
  onSetReplyThreadId: (replyThreadId: string) => void
  onReply?: (message: { id: string; name: string; content: string }) => void
  onTopicSelect?: (topic: {
    id: string
    name: string
    unreadCount?: number
  }) => void
  handleDeleteMessage?: (messageId: string) => Promise<void>
  isDeleting: boolean
  onEditMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
  onReaction?: (messageId: string, reaction: string) => void
  organizationId?: string
  onUpdateComplete?: () => void
  isMiniPulseChatOpen: boolean
  showWelcomeMessage: boolean
  topicName?: string
  // jumpTo?: string
  // jumpToSmooth?: boolean
  isLoading?: boolean
  initialPage?: number | null
  onBackToPresent?: () => void
  type?: ChatType
  threadId?: string
  readyToJump?: boolean
}

export const ChatMessageList = ({
  messages,
  onSetReplyThreadId,
  onReply,
  onTopicSelect,
  handleDeleteMessage,
  isDeleting,
  onEditMessage,
  onPinMessage,
  onReaction,
  organizationId,
  onUpdateComplete,
  isMiniPulseChatOpen,
  showWelcomeMessage = false,
  topicName,
  isLoading = false,
  initialPage = null,
  onBackToPresent,
  type = 'TEAM_CHAT',
  threadId,
  readyToJump,
}: ChatMessageListProps) => {
  const { anchor, scrollToMessageId, setLastJumpedMessageId } = useJumpStore()

  const { currentTopic } = usePulseStore()

  const today = new Date().toISOString().split('T')[0]

  const messagesWithDates: TeamMessageUI[] = useMemo(() => {
    return messages.map((message) => {
      const messageDate = formatDateAndTime(message.createdAt)

      return {
        ...message,
        isToday: messageDate === today,
        messageDate,
      }
    })
  }, [messages, today])

  useEffect(() => {
    if (isLoading || !readyToJump) return

    // If jump anchor's destination is team chat and this message list is of team chat type
    if (anchor?.destination === 'TEAM_CHAT' && type === 'TEAM_CHAT') {
      scrollToMessageId()
    }
  }, [anchor, isLoading, currentTopic?.id, type])

  return (
    <EditingProvider>
      <Stack
        alignItems="center"
        onClick={() => setLastJumpedMessageId(null)}
        position="relative"
        sx={{
          flex: 1,
        }}
        width="100%"
      >
        {showWelcomeMessage && <WelcomeMessage topicName={topicName} />}
        <Stack
          direction="column-reverse"
          gap={2}
          justifyContent="flex-start"
          mt="auto"
          width="100%"
        >
          {messagesWithDates.map((message, index) => {
            // Extract type from message if it exists, but our prop should override
            const { type: _messageType, ...messageWithoutType } =
              message as TeamMessageUI & { type?: ChatType }

            return (
              <ChatMessage
                key={`${message.id}-${index}`}
                {...messageWithoutType}
                content={message.content}
                email={message.user?.email ?? 'Unknown'}
                files={message.files}
                gravatar={message.user?.gravatar}
                groupedReactions={message.groupedReactions}
                handleDeleteMessage={handleDeleteMessage}
                id={message.id}
                index={index}
                isDeleted={message.isDeleted}
                isDeleting={isDeleting}
                isEdited={message.isEdited}
                isMiniPulseChatOpen={isMiniPulseChatOpen}
                isParentReply={message.isParentReply}
                isPending={message?.pending}
                isPinned={message.isPinned}
                isToday={message.isToday}
                messageDate={message.messageDate}
                metadata={
                  message.metadata &&
                  (typeof message.metadata.status === 'string' ||
                    message.metadata.type)
                    ? {
                        excerpt: message.metadata.excerpt ?? undefined,
                        status: message.metadata.status ?? '',
                        type: message.metadata.type ?? undefined,
                      }
                    : undefined
                }
                name={message.user?.name || 'Unknown'}
                onEditMessage={onEditMessage}
                onPinMessage={onPinMessage}
                onReaction={onReaction}
                onReply={onReply}
                onSetReplyThreadId={onSetReplyThreadId}
                onTopicSelect={onTopicSelect}
                onUpdateComplete={onUpdateComplete}
                organizationId={organizationId}
                repliedToMessage={message.repliedToMessage}
                replyTeamThreadId={message.replyTeamThreadId ?? undefined}
                threadId={threadId || message.teamThreadId}
                title={message.metadata?.excerpt ?? undefined}
                totalMessages={messages.length}
                type={type}
                userId={message.userId}
              />
            )
          })}
        </Stack>

        {initialPage && initialPage !== 1 && (
          <Stack
            alignItems="center"
            bgcolor="common.white"
            borderRadius={9999}
            bottom={16}
            boxShadow={2}
            direction="row"
            justifyContent="center"
            onClick={() => onBackToPresent?.()}
            position="sticky"
            px={3}
            py={1.5}
            spacing={1}
            sx={{
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
              },
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
            }}
            zIndex={999}
          >
            <Typography color="text.secondary" fontWeight={500} variant="body2">
              You&apos;re Viewing Older Messages.
            </Typography>
            <Typography color="primary.main" fontWeight={500} variant="body2">
              Jump To Present
            </Typography>
          </Stack>
        )}
      </Stack>
    </EditingProvider>
  )
}
