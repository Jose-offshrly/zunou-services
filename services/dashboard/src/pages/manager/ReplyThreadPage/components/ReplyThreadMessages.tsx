import { CircularProgress, Stack, Typography } from '@mui/material'
import { TeamMessage } from '@zunou-graphql/core/graphql'
import { AttachmentData } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'

import { EditingProvider } from '~/context/MessageListContext'
import { useJumpStore } from '~/store/useJumpStore'

import { ChatMessage } from '../../TeamChatPage/components/ChatMessage'

interface TeamMessageWithPending extends TeamMessage {
  pending?: boolean
  messageDate: string
  showHeader: boolean
}
interface ReplyThreadMessagesProps {
  messages: TeamMessage[]
  lastMessageElementRef?: (node: HTMLDivElement | null) => void
  isLoading?: boolean
  onAttachmentClick?: (attachment: AttachmentData) => void
  replyTeamThreadId: string
  handleDeleteMessage?: (messageId: string) => Promise<void>
  initialPage?: number | null
  onBackToPresent?: () => void
  readyToJump?: boolean
}

export const ReplyThreadMessages = ({
  lastMessageElementRef,
  messages,
  isLoading,
  onAttachmentClick,
  replyTeamThreadId,
  handleDeleteMessage,
  initialPage,
  onBackToPresent,
  readyToJump = false,
}: ReplyThreadMessagesProps) => {
  const { user } = useAuthContext()

  const processedMessages: TeamMessageWithPending[] = useMemo(() => {
    const processedMessages = messages.map((message) => {
      const messageDate = message.createdAt
        ? dayjs(message.createdAt).format('MMM D, YYYY, hh:mm A')
        : ''

      return {
        ...message,
        messageDate,
      }
    })

    return processedMessages.map((message, index) => {
      const prevMessage = processedMessages[index - 1]
      const showHeader =
        !prevMessage ||
        prevMessage.user?.id !== message.user?.id ||
        message.messageDate !== prevMessage.messageDate

      return {
        ...message,
        showHeader,
      }
    })
  }, [messages])

  const latestMessageIndexWithPulse = useMemo(() => {
    for (let i = processedMessages.length - 1; i >= 0; i--) {
      const msg = processedMessages[i]
      if (
        msg.content?.toLowerCase().includes('@pulse') &&
        msg.user?.name !== 'pulse'
      ) {
        return i
      }
    }
    return -1
  }, [processedMessages])

  const { anchor, scrollToMessageId, setLastJumpedMessageIdMiniPulseChat } =
    useJumpStore()

  useEffect(() => {
    if (isLoading || !readyToJump) return

    // If jump anchor's destination is team chat and this message list is of team chat type
    if (anchor?.destination === 'MINI_PULSE_CHAT') {
      scrollToMessageId()
    }
  }, [anchor, isLoading])

  if (isLoading) {
    return (
      <Stack alignItems="center" height="100%" justifyContent="center" py={4}>
        <CircularProgress size={24} />
      </Stack>
    )
  }
  return (
    <EditingProvider>
      <Stack
        alignItems="center"
        onClick={() => setLastJumpedMessageIdMiniPulseChat(null)}
        position="relative"
        sx={{
          flex: 1,
          pb: 2,
        }}
        width="100%"
      >
        <Stack
          gap={2}
          justifyContent="flex-start"
          mt="auto"
          sx={{
            maxWidth: '800px',
            px: 2,
          }}
          width="100%"
        >
          {processedMessages.map((message, index) => (
            <ChatMessage
              content={message.content}
              createdAt={message.createdAt}
              disableInteraction={latestMessageIndexWithPulse != index - 1}
              email={message.user?.email ?? 'Unknown'}
              files={message.files}
              gravatar={message.user?.gravatar}
              groupedReactions={message.groupedReactions}
              handleDeleteMessage={handleDeleteMessage}
              id={message.id}
              index={index}
              isDeleted={message.isDeleted}
              isEdited={message.isEdited}
              isFlipped={message.userId === user?.id}
              isParentReply={message.isParentReply}
              isPending={message.pending}
              isPinned={message.isPinned}
              isRead={message.isRead}
              key={`${message.id}-${index}`}
              lastMessageElementRef={lastMessageElementRef}
              messageDate={message.messageDate}
              metadata={
                message.metadata && message.metadata.type
                  ? {
                      excerpt: message.metadata.excerpt ?? undefined,
                      status: message.metadata.status ?? '',
                      type: message.metadata.type ?? undefined,
                    }
                  : undefined
              }
              name={message.user?.name ?? 'Unknown'}
              onAttachmentClick={onAttachmentClick}
              repliedToMessage={message.repliedToMessage}
              replyTeamThreadId={replyTeamThreadId}
              teamThreadId={replyTeamThreadId}
              threadId={message.teamThreadId}
              totalMessages={messages.length}
              type="MINI_PULSE_CHAT"
              updatedAt={message.updatedAt}
              userId={message.userId}
              withBackground={true}
              // showHeader={message.showHeader}
            />
          ))}
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
