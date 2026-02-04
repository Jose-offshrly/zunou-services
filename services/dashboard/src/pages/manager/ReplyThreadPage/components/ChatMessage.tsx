import { DeleteOutlined, EditOutlined } from '@mui/icons-material'
import { alpha, Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TeamMessageType } from '@zunou-graphql/core/graphql'
import { AttachmentData, IconButton } from '@zunou-react/components/form'
import { ContentParser } from '@zunou-react/components/layout/ChatBubbles'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useState } from 'react'

import PulseLogo from '~/assets/zunou-icon.png'
import { ParsedContentWithMeetings } from '~/components/domain/threads/MessageListV2/hooks/useContentParser'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

import { MessageContent as MessageContentPulseChat } from '../../../../components/domain/threads/MessageListV2/components/MessageContent'
import { MessageContent } from '../../TeamChatPage/components/MessageContent'
import { TeamMessageUI } from '../../TeamChatPage/components/MessageList'

interface ChatMessageProps extends TeamMessageUI {
  index: number
  lastMessageElementRef?: (node: HTMLDivElement | null) => void
  totalMessages: number
  name: string
  gravatar?: string | null
  title?: string
  userId: string
  handleDeleteMessage?: () => void
  handleUpdateMessage?: () => void
  isDeleting?: boolean
  metadata?: {
    status: string
    excerpt?: string
    type: TeamMessageType
  }
  isPending?: boolean
  showHeader?: boolean
  utilities?: {
    contentParser: ContentParser
    LoadingSkeletonComponent: React.ComponentType<{
      height: number
      width: number
      sx: Record<string, unknown>
    }>
    triggerWordsFormatter: (params: {
      text?: string
      triggers?: string[]
    }) => string
  }
  onAttachmentClick?: (attachment: AttachmentData) => void
  disableInteraction?: boolean
  threadId: string
  replyTeamThreadId: string
}

export const ChatMessage = ({
  id,
  content,
  messageDate,
  isToday = false,
  index,
  lastMessageElementRef,
  totalMessages,
  name,
  gravatar,
  userId,
  handleDeleteMessage,
  handleUpdateMessage,
  isDeleted,
  isEdited = false,
  isPending = false,
  showHeader = true,
  utilities,
  disableInteraction = true,
  onAttachmentClick,
  threadId,
  replyTeamThreadId,
  metadata,
}: ChatMessageProps) => {
  const theme = useTheme()
  const { user } = useAuthContext()

  const [isActionsVisible, setIsActionsVisible] = useState(false)

  const isUser = userId === user?.id
  const isPulse = name === 'pulse'

  const chatGravatar = isPulse ? PulseLogo : gravatar

  const showActions =
    isUser && !isDeleted && isActionsVisible && !content?.includes('@pulse')

  const parsedContent = utilities?.contentParser.parseContent(content ?? '')

  return (
    <Stack
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      direction="row"
      display={gravatar ? 'display' : 'none'}
      justifySelf="flex-end"
      key={id}
      onMouseEnter={() => setIsActionsVisible(true)}
      onMouseLeave={() => setIsActionsVisible(false)}
      position="relative"
      ref={index + 1 === totalMessages ? lastMessageElementRef : null}
      sx={{
        borderRadius: 2,
        opacity: isPending ? 0.5 : 1,
        px: 1,
        width: '100%',
      }}
    >
      <Stack
        direction={isUser ? 'row-reverse' : 'row'}
        spacing={2}
        width="100%"
      >
        {gravatar ? (
          <Avatar
            alt={name}
            placeholder={name}
            size="medium"
            src={chatGravatar || undefined}
            sx={{
              bgcolor: !gravatar ? theme.palette.primary.main : undefined,
            }}
            variant="rounded"
          />
        ) : (
          <LoadingSkeleton
            height={48}
            sx={{ minHeight: 48, minWidth: 48 }}
            width={48}
          />
        )}

        <Stack
          borderRadius={2}
          gap={1}
          justifyContent="flex-start"
          maxWidth="70%"
          minWidth="auto"
          width={'90%'}
        >
          {showHeader && (
            <Stack
              direction={isUser ? 'row-reverse' : 'row'}
              spacing={1}
              width="100%"
            >
              <Typography fontWeight={600} variant="body2">
                {isPulse ? 'Pulse' : name}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {isToday ? 'Today' : messageDate}
              </Typography>
            </Stack>
          )}

          <Stack
            border={isPulse ? 1 : undefined}
            sx={{
              bgcolor: isPulse
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
              borderColor: isPulse
                ? alpha(theme.palette.primary.main, 0.5)
                : undefined,
              borderRadius: isUser
                ? '16px 0px 16px 16px'
                : '0px 16px 16px 16px',
              maxWidth: '600px',
              minWidth: 240,
              p: 2,
              position: 'relative',
            }}
          >
            {showActions && (
              <Box
                sx={{
                  borderRadius: 1,
                  display: 'flex',
                  left: -92,
                  position: 'absolute',
                  top: 8,
                }}
              >
                <IconButton
                  onClick={handleUpdateMessage}
                  size="small"
                  sx={{
                    '&:hover': {
                      border: `1px solid ${theme.palette.primary.main}`,
                    },
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    color: 'text.primary',
                    mr: 1,
                    padding: 1,
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleDeleteMessage}
                  size="small"
                  sx={{
                    '&:hover': {
                      border: `1px solid ${theme.palette.primary.main}`,
                    },
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    color: 'error.main',
                    mr: 1,
                    padding: 1,
                  }}
                >
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Box>
            )}

            {isPulse ? (
              <MessageContentPulseChat
                disableInteraction={disableInteraction}
                isMiniPulseChat={true}
                onAttachmentClick={onAttachmentClick}
                parsedContent={parsedContent as ParsedContentWithMeetings}
                replyTeamThreadId={replyTeamThreadId}
                threadId={threadId}
              />
            ) : (
              <MessageContent
                content={content ?? ''}
                id={id}
                isAlertMessage={metadata?.type === TeamMessageType.Alert}
                isDeleted={isDeleted}
                isEdited={isEdited}
              />
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
