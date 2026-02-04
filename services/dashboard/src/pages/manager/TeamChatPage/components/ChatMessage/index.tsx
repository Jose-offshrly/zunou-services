import { alpha, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { TeamMessageType } from '@zunou-graphql/core/graphql'
import zunouIcon from '@zunou-react/assets/images/zunou-icon.png'
import { AttachmentData } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo, useState } from 'react'

import { MessageContent as MessageContentPulseChat } from '~/components/domain/threads/MessageListV2/components/MessageContent'
import { useContentParser } from '~/components/domain/threads/MessageListV2/hooks/useContentParser'
import { useEditing } from '~/context/MessageListContext'
import { ReplyThreadStatus } from '~/context/TeamChatContext'
import { useJumpStore } from '~/store/useJumpStore'
import { useMiniPulseChat } from '~/store/useMiniPulseChat'
import { isJsonObject as isJsonObjectUtil } from '~/utils/json'

import { ChatReplyCard } from '../ChatReplyCard'
import { MessageActions } from '../MessageAction'
import { MessageContent } from '../MessageContent'
import type { TopicReference } from '../MessageContentUI'
import { MessageContentUI } from '../MessageContentUI'
import { TeamMessageUI } from '../MessageList'
import AttachmentTray from './AttachmentTray'
import Header from './Header'
import ReactionTray from './ReactionTray'
import ReplyBubble from './ReplyBubble'

export type ChatType =
  | 'DIRECT_MESSAGE'
  | 'TEAM_CHAT'
  | 'MINI_PULSE_CHAT'
  | 'PREVIEW'

interface ChatMessageProps extends TeamMessageUI {
  index: number
  lastMessageElementRef?: (node: HTMLDivElement | null) => void
  totalMessages: number
  name: string
  gravatar?: string | null
  onSetReplyThreadId?: (replyThreadId: string) => void
  onReply?: (message: { id: string; name: string; content: string }) => void
  onTopicSelect?: (topic: {
    id: string
    name: string
    unreadCount?: number
  }) => void
  title?: string
  isParentReply: boolean
  userId: string
  handleDeleteMessage?: (messageId: string) => Promise<void>
  isDeleting?: boolean
  onEditMessage?: (messageId: string) => void
  onPinMessage?: (messageId: string) => void
  onReaction?: (messageId: string, reaction: string) => void
  organizationId?: string
  onUpdateComplete?: () => void
  isMiniPulseChatOpen?: boolean
  metadata?: {
    status: string
    excerpt?: string
    type?: TeamMessageType
  }
  isPending?: boolean
  isFlipped?: boolean
  type: ChatType
  withBackground?: boolean
  email: string
  threadId: string
  onAttachmentClick?: (attachment: AttachmentData) => void
  disableInteraction?: boolean
  isJumpable?: boolean
}

export const ChatMessage = (props: ChatMessageProps) => {
  const {
    id,
    content,
    messageDate,
    isToday,
    index,
    lastMessageElementRef,
    totalMessages,
    name,
    gravatar,
    replyTeamThreadId,
    onSetReplyThreadId,
    onReply,
    onTopicSelect,
    title,
    isParentReply,
    userId,
    handleDeleteMessage,
    isDeleted,
    isEdited = false,
    onEditMessage,
    onPinMessage,
    onReaction,
    organizationId,
    onUpdateComplete,
    isMiniPulseChatOpen = false,
    metadata,
    isPending = false,
    isPinned = false,
    groupedReactions,
    repliedToMessage,
    files,
    isFlipped = false,
    type,
    withBackground = false,
    email,
    threadId,
    onAttachmentClick,
    disableInteraction,
    isJumpable = true,
  } = props

  const { parseContent } = useContentParser()
  const theme = useTheme()
  const muiTheme = useTheme()
  const { user } = useAuthContext()
  const { currentEditingId } = useEditing()
  const { lastJumpedMessageId, lastJumpedMessageIdMiniPulseChat } =
    useJumpStore()

  const [isHovered, setIsHovered] = useState(false)

  // Derived state
  const isEditing = currentEditingId === id
  const isUser = userId === user?.id
  const isLastMessage = index + 1 === totalMessages
  const isSentByPulse = email?.toLowerCase() === 'pulse@zunou.ai'

  const { setOpenMiniPulseChat } = useMiniPulseChat()

  const isJumpedInto =
    type === 'TEAM_CHAT'
      ? lastJumpedMessageId === id
      : lastJumpedMessageIdMiniPulseChat === id

  const highlightBlue = isJumpedInto && isJumpable
  // || pulseAction?.replyingToTeamChat?.id === id

  // Check if content is a JSON object and of what type
  const {
    isJSONObject,
    type: UIType,
    newTopicContent,
  } = useMemo(() => {
    let jsonObject = false
    let type = null
    let newTopicContent = null

    if (isJsonObjectUtil(content ?? '')) {
      jsonObject = true
      try {
        const parsed = JSON.parse(content ?? '')

        // Determine Type
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed)
        ) {
          type = parsed?.ui?.type
        }

        if (type === 'new_topic') {
          newTopicContent =
            (parsed?.ui?.references?.[0] as TopicReference) || null
        }
      } catch (e) {
        // Not JSON, keep defaults
      }
    }

    return {
      isJSONObject: jsonObject,
      newTopicContent,
      type,
    }
  }, [content])

  // Handlers
  const hasPulse = (text: string): boolean =>
    text.toLowerCase().includes('@pulse')

  // Styling helpers
  const getBackgroundColor = () => {
    if (type === 'PREVIEW') return 'transparent'
    if (highlightBlue) return alpha(muiTheme.palette.common.blue, 0.1)
    if (isEditing) return alpha(muiTheme.palette.secondary.main, 0.05)
    if (isHovered) return alpha(theme.palette.action.hover, 0.05)
    return 'transparent'
  }

  const getBorderRadius = () => {
    if (!highlightBlue) return {}

    if (isFlipped) {
      return {
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
      }
    }

    return {
      borderBottomLeftRadius: 0,
      borderTopLeftRadius: 0,
    }
  }

  const getContentMaxWidth = () => {
    if (isEditing) return '90%'
    if (isMiniPulseChatOpen) return 'calc(50vw - 200px)'
    return '90%'
  }

  const getAvatarSrc = () => {
    if (isJSONObject && UIType === 'new_topic') return undefined
    if (isSentByPulse) return zunouIcon
    return gravatar || undefined
  }

  const shouldShowPulseReply =
    !isDeleted &&
    hasPulse(content ?? '') &&
    replyTeamThreadId &&
    onSetReplyThreadId &&
    setOpenMiniPulseChat

  const containsAtPulse = content?.toLowerCase().includes('@pulse')

  const parsedContent = parseContent(content ?? '')

  if (!gravatar) {
    return null
  }

  return (
    <Stack
      alignSelf={isFlipped ? 'flex-end' : 'flex-start'}
      borderLeft={highlightBlue && !isFlipped ? 3 : 0}
      borderRight={highlightBlue && isFlipped ? 3 : 0}
      direction={isFlipped ? 'row-reverse' : 'row'}
      id={isJumpable ? id : undefined}
      justifySelf={isFlipped ? 'flex-end' : 'flex-start'}
      key={id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      position="relative"
      ref={isLastMessage ? lastMessageElementRef : null}
      sx={{
        backgroundColor: getBackgroundColor(),
        borderColor: highlightBlue ? 'common.blue' : undefined,
        borderRadius: 2,
        opacity: isPending ? 0.5 : 1,
        px: 1,
        py: 1,
        width: '100%',
        ...getBorderRadius(),
      }}
    >
      <Stack
        direction={isFlipped ? 'row-reverse' : 'row'}
        spacing={2}
        width="100%"
      >
        <Avatar
          alt={name}
          placeholder={UIType === 'new_topic' ? '#' : name}
          size={'medium'}
          src={getAvatarSrc()}
          sx={{
            bgcolor:
              UIType === 'new_topic'
                ? '#F47C7C'
                : !gravatar
                  ? theme.palette.primary.main
                  : undefined,
          }}
        />

        <Stack
          alignItems={isFlipped ? 'flex-end' : 'flex-start'}
          borderRadius={2}
          gap={1}
          justifyContent="flex-start"
          maxWidth={getContentMaxWidth()}
          minWidth="auto"
          width={isEditing ? '90%' : undefined}
        >
          <Header
            UIType={UIType}
            isFlipped={isFlipped}
            isSentByPulse={isSentByPulse}
            isToday={isToday}
            messageDate={messageDate}
            name={name}
            newTopicContent={newTopicContent}
          />

          {!isDeleted &&
            !isEditing &&
            !isPending &&
            UIType !== 'new_topic' &&
            type !== 'PREVIEW' && (
              <MessageActions
                allowDelete={isUser && !containsAtPulse}
                allowEdit={isUser && !isParentReply}
                content={content ?? ''}
                gravatar={gravatar}
                handleDeleteMessage={handleDeleteMessage}
                id={id}
                isFlipped={isFlipped}
                isPinned={isPinned}
                isVisible={isHovered}
                messageDate={messageDate}
                name={name}
                onEditMessage={onEditMessage}
                onPinMessage={onPinMessage}
                onReaction={onReaction}
                onReply={onReply}
                organizationId={organizationId}
                replyTeamThreadId={replyTeamThreadId ?? ''}
                setIsHovered={setIsHovered}
                threadId={threadId}
                type={type}
              />
            )}

          {repliedToMessage && (
            <ReplyBubble message={repliedToMessage} type={type} />
          )}

          <Stack
            {...(withBackground && {
              bgcolor: isSentByPulse
                ? alpha(theme.palette.primary.main, 0.1)
                : metadata?.type === TeamMessageType.Alert
                  ? 'transparent'
                  : alpha(theme.palette.primary.main, 0.05),
              border: isSentByPulse ? 1 : 0,
              borderColor: isSentByPulse
                ? alpha(theme.palette.primary.main, 0.2)
                : undefined,
              borderRadius: isFlipped
                ? '16px 0px 16px 16px'
                : '0px 16px 16px 16px',
              p: 2,
            })}
          >
            {isSentByPulse &&
            type === 'MINI_PULSE_CHAT' &&
            replyTeamThreadId ? (
              <MessageContentPulseChat
                disableInteraction={disableInteraction ?? false}
                isMiniPulseChat={true}
                onAttachmentClick={onAttachmentClick}
                parsedContent={parsedContent}
                replyTeamThreadId={replyTeamThreadId}
                threadId={threadId}
              />
            ) : isJSONObject ? (
              <MessageContentUI
                content={content ?? ''}
                isDeleted={isDeleted}
                onTopicSelect={onTopicSelect}
              />
            ) : (
              <MessageContent
                content={content ?? ''}
                files={files ?? []}
                id={id}
                isAlertMessage={metadata?.type === TeamMessageType.Alert}
                isDeleted={isDeleted}
                isEdited={isEdited}
                onUpdateComplete={onUpdateComplete}
                organizationId={organizationId}
                replyTeamThreadId={replyTeamThreadId ?? undefined}
              />
            )}
          </Stack>

          {!isDeleted && (
            <AttachmentTray files={files ?? []} isFlipped={isFlipped} />
          )}

          {shouldShowPulseReply && (
            <ChatReplyCard
              metadata={{
                excerpt: metadata?.excerpt,
                status:
                  typeof metadata?.status === 'string'
                    ? metadata.status
                    : title
                      ? ReplyThreadStatus.COMPLETE
                      : ReplyThreadStatus.PENDING,
              }}
              replyTeamThreadId={replyTeamThreadId}
              timestamp={messageDate}
              title={metadata?.excerpt || title || ''}
            />
          )}

          {!isDeleted && type !== 'PREVIEW' && (
            <ReactionTray
              messageId={id}
              onReaction={onReaction}
              organizationId={organizationId}
              reactions={groupedReactions ?? []}
              replyTeamThreadId={replyTeamThreadId ?? ''}
              threadId={threadId}
              type={type}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
