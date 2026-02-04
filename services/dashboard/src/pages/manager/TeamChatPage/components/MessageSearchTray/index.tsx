import {
  alpha,
  Box,
  CircularProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useSearchTeamThreadMessages } from '@zunou-queries/core/hooks/useSearchTeamThreadMessages'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { useJumpStore } from '~/store/useJumpStore'
import { useMessageSearchStore } from '~/store/useMessageSearchStore'
import { usePulseStore } from '~/store/usePulseStore'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { ChatMessage } from '../ChatMessage'

export default function MessageSearchTray() {
  const { showResults, query } = useMessageSearchStore()
  const { currentTopic } = usePulseStore()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId?: string }>()

  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSearchTeamThreadMessages({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!query && query.length > 0,
      variables: {
        order,
        organizationId,
        pulseId: pulseId ?? '',
        query: query ?? '',
        topicId: currentTopic?.id
          ? currentTopic.id === 'general'
            ? undefined
            : currentTopic?.id
          : undefined,
      },
    })

  // Infinite scroll trigger
  const { ref, inView } = useInView({
    threshold: 0,
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten all messages from all pages
  const allMessages = useMemo(() => {
    return data?.pages.flatMap((page) => page.data ?? []) ?? []
  }, [data])

  // Get total count from first page
  const totalResults = data?.pages[0]?.paginatorInfo.total ?? 0

  const { setCurrentTopic } = usePulseStore()
  const { setLastJumpedMessageId, setAnchor } = useJumpStore()

  const handleClick = ({
    messageId,
    replyTeamThreadId,
    teamThreadId,
    topicId,
    topicName,
  }: {
    messageId: string
    replyTeamThreadId?: string | undefined
    teamThreadId: string
    topicId?: string | undefined
    topicName?: string | undefined
  }) => {
    const targetMsgEl = document.getElementById(messageId)

    if (targetMsgEl) {
      targetMsgEl.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      })

      setLastJumpedMessageId(messageId)
      return
    }

    // Jump to the message
    setAnchor({
      destination: replyTeamThreadId ? 'MINI_PULSE_CHAT' : 'TEAM_CHAT',
      messageId: messageId,
      replyTeamThreadId: replyTeamThreadId,
      teamThreadId: teamThreadId,
    })

    if (topicId && topicName) {
      setCurrentTopic({
        hasUnread: false,
        id: topicId,
        name: topicName,
      })
    } else {
      setCurrentTopic({
        hasUnread: false,
        id: 'general',
        name: 'General',
      })
    }
  }

  if (!showResults) return null

  return (
    <Stack
      bgcolor="background.paper"
      borderLeft={1}
      height="100%"
      maxWidth={450}
      position="absolute"
      right={0}
      sx={{ borderColor: 'divider' }}
      width="100%"
      zIndex={50}
    >
      {/* Loading state */}
      {isLoading && (
        <Stack alignItems="center" flex={1} gap={2} justifyContent="center">
          <CircularProgress size={28} />
        </Stack>
      )}

      {/* Header */}
      {!isLoading && (
        <Stack
          alignItems="center"
          borderBottom={1}
          borderColor="divider"
          direction="row"
          justifyContent="space-between"
          p={2}
        >
          {query && (
            <Typography color="text.secondary" variant="body1">
              {`${totalResults} result${totalResults > 1 ? 's' : ''} for "${query}"`}
            </Typography>
          )}

          {totalResults > 0 && (
            <Stack alignItems="center" direction="row" spacing={0.5}>
              <Typography
                color="text.secondary"
                fontWeight={500}
                variant="body2"
              >
                Sort by:
              </Typography>
              <Select
                onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  bgcolor: 'background.paper',
                  fontSize: 14,
                  minWidth: 100,
                }}
                value={order}
              >
                <MenuItem sx={{ fontSize: 14 }} value="desc">
                  Latest
                </MenuItem>
                <MenuItem sx={{ fontSize: 14 }} value="asc">
                  Oldest
                </MenuItem>
              </Select>
            </Stack>
          )}
        </Stack>
      )}

      {/* Empty state */}
      {!isLoading && allMessages.length === 0 && query && (
        <Stack
          alignItems="center"
          flex={1}
          gap={1}
          justifyContent="center"
          p={3}
        >
          <Typography color="text.secondary" variant="body1">
            No messages found
          </Typography>
          <Typography color="text.secondary" textAlign="center" variant="body2">
            Try a different search term
          </Typography>
        </Stack>
      )}

      <Stack sx={{ overflowY: 'auto' }}>
        {totalResults > 0 && !isLoading && (
          <Typography color="text.secondary" p={2}>
            # {currentTopic?.name ?? 'General'}
          </Typography>
        )}

        {/* Results */}
        {!isLoading && allMessages.length > 0 && (
          <Stack gap={1} p={2} pt={0}>
            {allMessages.map((message, index) => (
              <Stack
                border={1}
                key={message.id}
                onClick={() =>
                  handleClick({
                    messageId: message.id,
                    replyTeamThreadId: message.replyTeamThreadId ?? undefined,
                    teamThreadId: message.teamThreadId,
                    topicId: message.topic?.id,
                    topicName: message.topic?.name,
                  })
                }
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.05),
                  },
                  borderColor: 'divider',
                  borderRadius: 2,
                  padding: 1,
                }}
              >
                <ChatMessage
                  content={message.content}
                  createdAt={message.createdAt}
                  disableInteraction={true}
                  email={message.user?.email ?? 'Unknown'}
                  files={message.files}
                  gravatar={message.user?.gravatar}
                  groupedReactions={message.groupedReactions}
                  id={message.id}
                  index={index}
                  isDeleted={message.isDeleted}
                  isEdited={message.isEdited}
                  isJumpable={false}
                  isParentReply={message.isParentReply}
                  isPinned={message.isPinned}
                  isRead={message.isRead}
                  key={message.id}
                  messageDate={formatDateAndTime(message.createdAt)}
                  name={message.user?.name ?? 'Unknown'}
                  repliedToMessage={message.repliedToMessage}
                  teamThreadId={message.teamThreadId}
                  threadId={message.teamThreadId}
                  totalMessages={allMessages.length}
                  type="PREVIEW"
                  updatedAt={message.updatedAt}
                  userId={message.userId}
                  withBackground={false}
                />
              </Stack>
            ))}

            {/* Infinite scroll trigger */}
            <Box py={2} ref={ref}>
              {isFetchingNextPage && (
                <Stack alignItems="center">
                  <CircularProgress size={24} />
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
