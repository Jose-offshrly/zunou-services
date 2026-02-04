import { ForumOutlined } from '@mui/icons-material'
import { CircularProgress, Stack, Typography } from '@mui/material'
import { AttachmentData } from '@zunou-react/components/form'
import {
  ChatBubbles,
  ContentParser,
} from '@zunou-react/components/layout/ChatBubbles'
import { useEffect, useMemo, useRef } from 'react'
import { InView } from 'react-intersection-observer'

import { useContentParser } from '~/components/domain/threads/MessageListV2/hooks/useContentParser'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { DirectMessageSkeleton } from './DirectMessageSkeleton'
import { PartialDirectMessage } from './hooks'

interface DirectMessageListProps {
  messages: PartialDirectMessage[]
  lastMessageElementRef?: (node: HTMLDivElement | null) => void
  onAttachmentClick?: (attachment: AttachmentData) => void
  isLoading?: boolean
  onEditMessage?: (messageId: string) => void
  onDeleteMessage?: (messageId: string) => void
  loadMore?: () => void
  isLoadingMore?: boolean
  showLoadMore?: boolean
}

export const DirectMessageList = ({
  isLoading,
  lastMessageElementRef,
  messages,
  onAttachmentClick,
  onEditMessage,
  onDeleteMessage,
  loadMore,
  isLoadingMore,
  showLoadMore,
}: DirectMessageListProps) => {
  const today = new Date().toISOString().split('T')[0]
  const messageContainerRef = useRef<HTMLDivElement>(null)

  const prevMessagesRef = useRef<PartialDirectMessage[]>([])
  const prevHeightRef = useRef<number>(0)

  const { parseContent } = useContentParser()

  useEffect(() => {
    const container = messageContainerRef.current
    if (!container) return
    const newHeight = container.scrollHeight

    const prevMessages = prevMessagesRef.current
    const prevLength = prevMessages.length
    const currLength = messages.length

    // Detect if a new message was added at the top (assuming newest at top)
    const newMessageAdded =
      currLength > prevLength && messages[0]?.id !== prevMessages[0]?.id

    if (prevHeightRef.current > 0) {
      // "Load more" logic
      const heightDelta = newHeight - prevHeightRef.current
      container.scrollTop = container.scrollTop + heightDelta
      prevHeightRef.current = 0
    } else if (newMessageAdded) {
      // Only scroll to bottom if a new message is added
      container.scrollTop = newHeight
    }

    // Update the ref for next render
    prevMessagesRef.current = messages
  }, [messages])

  const handleInViewChange = (inView: boolean) => {
    if (!inView || isLoadingMore || !loadMore) return
    const container = messageContainerRef.current
    if (container) {
      prevHeightRef.current = container.scrollHeight
    }
    loadMore()
  }

  const messagesWithDates = useMemo(() => {
    const processedMessages = messages.map((message) => {
      const messageDate = formatDateAndTime(message.createdAt)
      return {
        content: message.content,
        deletedAt: message.deletedAt,
        id: message.id,
        isDeleted: Boolean(message.deletedAt),
        isEdited: message.isEdited,
        messageDate,
        user: {
          gravatar: message.sender?.gravatar,
          id: message.sender?.id,
          name: message.sender?.name,
        },
      }
    })

    return processedMessages.map((message, index) => {
      const nextMessage = processedMessages[index + 1]
      const showHeader =
        !nextMessage ||
        nextMessage.user.id !== message.user.id ||
        message.messageDate !== nextMessage.messageDate
      return {
        ...message,
        showHeader,
      }
    })
  }, [messages])

  return (
    <Stack
      ref={messageContainerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflowX: 'hidden',
        overflowY: 'auto',
        width: '100%',
      }}
    >
      <Stack
        direction="column-reverse"
        justifyContent="flex-start"
        py={2}
        spacing={2}
        sx={{
          alignSelf: 'center',
          flex: '1 1 auto',
          maxWidth: '800px',
          minHeight: 'fit-content',
          px: 2,
          width: '100%',
        }}
      >
        {isLoading ? (
          <DirectMessageSkeleton />
        ) : messages.length === 0 ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            minHeight="200px"
            spacing={2}
            sx={{
              flex: '1 1 auto',
            }}
          >
            <ForumOutlined sx={{ color: 'text.secondary', fontSize: 48 }} />
            <Typography color="text.secondary" variant="caption">
              No messages yet. Start a conversation now.
            </Typography>
          </Stack>
        ) : (
          messagesWithDates.map((message, index) => (
            <ChatBubbles
              index={index}
              isToday={message.messageDate === today}
              key={message.id}
              lastMessageElementRef={lastMessageElementRef}
              message={message}
              onAttachmentClick={onAttachmentClick}
              onDeleteMessage={() => onDeleteMessage?.(message.id)}
              onEditMessage={() => onEditMessage?.(message.id)}
              totalMessages={messages.length}
              utilities={{
                LoadingSkeletonComponent: LoadingSkeleton,
                contentParser: { parseContent } as ContentParser,
              }}
            />
          ))
        )}

        {showLoadMore && loadMore && (
          <InView
            onChange={handleInViewChange}
            skip={!!isLoadingMore}
            threshold={0.1}
            triggerOnce={false}
          >
            {({ ref }) => (
              <div
                ref={ref}
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  flexShrink: 0,
                  justifyContent: 'center',
                  minHeight: 32,
                }}
              >
                {isLoadingMore && <CircularProgress size={20} />}
              </div>
            )}
          </InView>
        )}
      </Stack>
    </Stack>
  )
}
