import { DeleteOutlined, EditOutlined } from '@mui/icons-material'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { AttachmentData, AttachmentItem } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useTriggerWords } from '@zunou-react/utils/chatUtils'
import { formatMessage } from '@zunou-react/utils/messageUtils'
import { useCallback, useState } from 'react'

import PulseLogo from '../../assets/images/zunou-icon.png'
import Avatar from '../utility/Avatar'

interface Meeting {
  id: string
  title: string
  startTime: string
  endTime: string
  attendees: string[]
}

export interface ParsedContent {
  summary?: string
  content?: AttachmentData[]
  meetings?: Meeting[]
}

export interface ContentParser {
  parseContent: (
    content: string | null,
  ) => (ParsedContent & { meetings?: Meeting[] }) | null
}

export interface MessageUser {
  id?: string
  name?: string
  gravatar?: string | null
}

export interface MessageData {
  isEdited: boolean
  isDeleted: boolean
  id: string
  content: string
  messageDate: string
  showHeader: boolean
  user: MessageUser
}

interface ChatBubblesProps {
  message: MessageData
  isToday: boolean
  index: number
  totalMessages: number
  lastMessageElementRef?: (node: HTMLDivElement | null) => void
  onAttachmentClick?: (attachment: AttachmentData) => void
  onEditMessage?: (messageId: string) => void
  onDeleteMessage?: (messageId: string) => void
  utilities: {
    contentParser: ContentParser
    LoadingSkeletonComponent: React.ComponentType<{
      height: number
      width: number
      sx: Record<string, unknown>
    }>
  }
  isPending?: boolean
}

interface ChatBubbleContentProps {
  name: string
  isUser: boolean
  messageDate: string
  isToday: boolean
  content: string
  parsedContent: (ParsedContent & { meetings?: Meeting[] }) | null
  onAttachmentClick?: (attachment: AttachmentData) => void
  showHeader: boolean
  onEditMessage?: (messageId: string) => void
  onDeleteMessage?: (messageId: string) => void
  messageId: string
  isDeleted: boolean
  isEdited: boolean
  isActionsVisible: boolean
}

const ChatBubbleContent = ({
  name,
  content,
  isUser,
  messageDate,
  isToday,
  parsedContent,
  onAttachmentClick,
  showHeader,
  onEditMessage,
  onDeleteMessage,
  isDeleted,
  isActionsVisible,
  messageId,
  isEdited,
}: ChatBubbleContentProps) => {
  const theme = useTheme()
  const handleAttachmentClick = useCallback(
    (item: AttachmentData) => {
      onAttachmentClick?.(item)
    },
    [onAttachmentClick],
  )
  const showActions =
    isUser &&
    !isDeleted &&
    isActionsVisible &&
    parsedContent?.summary &&
    !parsedContent.summary.includes('@pulse')

  const Content = () => {
    return (
      <>
        {isDeleted ? (
          <Typography
            color="text.secondary"
            sx={{ fontStyle: 'italic' }}
            variant="body2"
          >
            This message is deleted
          </Typography>
        ) : (
          <div style={{ display: 'inline-block', width: '100%' }}>
            <Box
              className="ql-editor"
              component="div"
              dangerouslySetInnerHTML={{
                __html: useTriggerWords({
                  text: formatMessage(content ?? ''),
                }),
              }}
              sx={{
                '& p': { margin: 0 },
                color: isDeleted ? theme.palette.text.secondary : 'inherit',
                display: 'inline',
                fontStyle: isDeleted ? 'italic' : 'normal',
                padding: '0 !important',
                wordBreak: 'break-word',
              }}
            />

            {isEdited && !isDeleted && (
              <Typography
                color="text.secondary"
                component="span"
                fontSize="12px"
                sx={{
                  display: 'inline',
                  fontStyle: 'italic',
                  marginLeft: '4px',
                }}
              >
                (edited)
              </Typography>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <Stack
      borderRadius={2}
      gap={1}
      justifyContent="flex-start"
      maxWidth="calc(85% - 64px)"
      sx={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}
    >
      {showHeader && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
          width="100%"
        >
          <Typography fontWeight={600} variant="body2">
            {name}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {isToday ? 'Today' : messageDate}
          </Typography>
        </Stack>
      )}
      <Stack
        border={name !== 'pulse' ? 1 : 0}
        borderColor={
          name !== 'pulse' ? alpha(theme.palette.primary.main, 0.5) : undefined
        }
        sx={{
          bgcolor:
            name === 'pulse'
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.primary.main, 0.05),
          borderRadius: isUser ? '16px 0px 16px 16px' : '0px 16px 16px 16px',
          maxWidth: '600px',
          minWidth: 240,
          padding: 2,
          position: 'relative',
          ...(isUser && { mr: showHeader ? 0 : '40px' }),
          width: '100%',
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
              onClick={() => onEditMessage?.(messageId)}
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
              onClick={() => onDeleteMessage?.(messageId)}
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
        <Typography
          component="div"
          sx={{
            '& p': { margin: 0 },
            margin: 0,
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
          variant="body2"
        >
          <Content />
        </Typography>
        {parsedContent?.content?.map((item: AttachmentData, index: number) => (
          <AttachmentItem
            handleClick={() => handleAttachmentClick(item)}
            index={index}
            item={item}
            key={`attachment-${index}`}
          />
        ))}
      </Stack>
    </Stack>
  )
}

export const ChatBubbles = ({
  message,
  isToday,
  index,
  totalMessages,
  lastMessageElementRef,
  onAttachmentClick,
  onEditMessage,
  onDeleteMessage,
  utilities,
  isPending = false,
}: ChatBubblesProps) => {
  const { user: currentUser } = useAuthContext()
  const [isActionsVisible, setIsActionsVisible] = useState(false)

  const { contentParser, LoadingSkeletonComponent } = utilities
  const parsedContent = contentParser.parseContent(message.content)

  const isUser = currentUser?.id === message.user.id
  const name =
    message.user.name === 'pulse' ? 'Pulse' : message.user.name || 'Unknown'
  const gravatar =
    message.user.name === 'pulse' ? PulseLogo : message.user.gravatar

  return (
    <Stack
      alignSelf={isUser ? 'flex-start' : 'flex-end'}
      direction="row"
      display={gravatar ? 'flex' : 'none'}
      justifySelf={isUser ? 'flex-start' : 'flex-end'}
      key={message.id}
      onMouseEnter={() => setIsActionsVisible(true)}
      onMouseLeave={() => setIsActionsVisible(false)}
      position="relative"
      ref={index + 1 === totalMessages ? lastMessageElementRef : null}
      sx={{
        maxWidth: '1000px',
        opacity: isPending ? 0.5 : 1,
        width: '100%',
      }}
    >
      <Stack
        direction="row"
        flexDirection={isUser ? 'row-reverse' : 'row'}
        gap={isUser ? 2 : 0}
        spacing={2}
        width="100%"
      >
        <Box>
          {message.showHeader && gravatar ? (
            <Avatar alt={name} placeholder={name} src={gravatar} />
          ) : message.showHeader ? (
            <LoadingSkeletonComponent
              height={48}
              sx={{ minHeight: 48, minWidth: 48 }}
              width={48}
            />
          ) : (
            <Box sx={{ height: 40, width: isUser ? 0 : 40 }} />
          )}
        </Box>

        <ChatBubbleContent
          content={message.content}
          isActionsVisible={isActionsVisible && !isPending}
          isDeleted={message.isDeleted}
          isEdited={message.isEdited}
          isToday={isToday}
          isUser={isUser}
          messageDate={message.messageDate}
          messageId={message.id}
          name={name}
          onAttachmentClick={onAttachmentClick}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
          parsedContent={parsedContent}
          showHeader={message.showHeader}
        />
      </Stack>
    </Stack>
  )
}
