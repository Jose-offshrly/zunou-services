import { Box, Stack, Typography } from '@mui/material'
import { TeamMessage } from '@zunou-graphql/core/graphql'
import zunouIcon from '@zunou-react/assets/images/zunou-icon.png'
import Avatar from '@zunou-react/components/utility/Avatar'
import { theme } from '@zunou-react/services/Theme'
import { useMemo } from 'react'
import { Descendant } from 'slate'

import { useJumpStore } from '~/store/useJumpStore'
import { usePulseStore } from '~/store/usePulseStore'
import { isJsonObject } from '~/utils/json'
import { serializeToHTML } from '~/utils/textUtils'

import { MessageContentUI, ParsedContentUI } from '../MessageContentUI'
import { ChatType } from '.'

interface Props {
  message: TeamMessage
  type: ChatType
}

export default function ReplyBubble({ message, type }: Props) {
  const { setCurrentTopic } = usePulseStore()
  const { setAnchor, setLastJumpedMessageId } = useJumpStore()
  const displayContent = message.isDeleted
    ? 'Message has been deleted.'
    : message.content

  const gravatar = message.user?.gravatar
  const name = message.user?.name ?? 'Unknown'

  const handleReplyClick = (event: React.MouseEvent) => {
    event.stopPropagation()

    if (type === 'PREVIEW') return

    const targetMsgEl = document.getElementById(message.id)

    if (targetMsgEl) {
      targetMsgEl.scrollIntoView({
        behavior: 'instant',
        block: 'center',
      })

      setLastJumpedMessageId(message.id)
      return
    }

    setAnchor({
      destination: message.replyTeamThreadId ? 'MINI_PULSE_CHAT' : 'TEAM_CHAT',
      messageId: message.id,
      replyTeamThreadId: message.replyTeamThreadId,
      teamThreadId: message.teamThreadId,
    })

    if (message.topic && message.topic.id && message.topic.name) {
      setCurrentTopic({
        hasUnread: false,
        id: message.topic.id,
        name: message.topic.name,
      })
    } else {
      setCurrentTopic({
        hasUnread: false,
        id: 'general',
        name: 'General',
      })
    }
  }

  const isMessageContentUI = useMemo(() => {
    try {
      const isJsonObj = isJsonObject(message.content ?? '')

      if (!isJsonObj || !message.content) return false

      const parsed: Descendant[] | ParsedContentUI = JSON.parse(message.content)

      // Message with UI - check if it has the MessageContentUI structure
      if (
        parsed &&
        typeof parsed === 'object' &&
        'message' in parsed &&
        'ui' in parsed
      ) {
        return true
      }
    } catch (error) {
      return false
    }
  }, [message])

  return (
    <Stack
      bgcolor="common.white"
      borderLeft={4}
      gap={1}
      onClick={handleReplyClick}
      sx={{
        '&:hover': {
          opacity: type === 'PREVIEW' ? 1 : 0.8,
        },
        borderBottomRightRadius: 7,
        borderColor: 'common.blue',
        borderRadius: 1,
        borderTopRightRadius: 7,
        cursor: 'pointer',
        minWidth: 0,
      }}
    >
      <Stack
        border={type === 'MINI_PULSE_CHAT' || type === 'PREVIEW' ? 1 : 0}
        borderLeft={0}
        padding={1.5}
        sx={{
          borderBottomLeftRadius: 0,
          borderColor: 'divider',
          borderRadius: 1,
          borderTopLeftRadius: 0,
          gap: 1,
        }}
      >
        <Stack alignItems="center" direction="row" flexShrink={0} gap={1}>
          <Avatar
            alt={name}
            placeholder={name}
            size="extraSmall"
            src={
              name.toLowerCase() === 'pulse' ? zunouIcon : gravatar || undefined
            }
            sx={{
              bgcolor: !gravatar ? theme.palette.primary.main : undefined,
            }}
          />

          <Typography
            fontSize="small"
            fontWeight={600}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {message.user?.name ?? 'Unknown'}
          </Typography>
        </Stack>

        {isMessageContentUI ? (
          <MessageContentUI
            content={message.content ?? ''}
            hasPadding={false}
            isDeleted={message.isDeleted}
            showBorder={false}
            shrink={true}
          />
        ) : (
          <Box
            dangerouslySetInnerHTML={{
              __html: (() => {
                try {
                  const parsed: Descendant[] = JSON.parse(displayContent ?? '')

                  if (Array.isArray(parsed)) {
                    return serializeToHTML(parsed)
                  }
                } catch (_err) {
                  // Not JSON → fallback to legacy HTML
                }
                return displayContent ?? ''
              })(),
            }}
            sx={{
              '& p': { margin: 0 },
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              color: message.isDeleted ? 'text.secondary' : 'inherit',
              display: '-webkit-box',
              flex: 1,
              fontSize: 'small',
              fontStyle: message.isDeleted ? 'italic' : 'normal',
              minWidth: 0,

              overflow: 'hidden',
              overflowWrap: 'break-word',
              padding: '0 !important',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
            }}
          />
        )}
      </Stack>
    </Stack>
  )
}
