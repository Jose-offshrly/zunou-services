import { Close, PushPinOutlined } from '@mui/icons-material'
import {
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { File } from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { theme } from '@zunou-react/services/Theme'
import React, { useCallback, useMemo, useState } from 'react'
import { Descendant } from 'slate'

import { ParsedContentUI } from '~/pages/manager/TeamChatPage/components/MessageContentUI'
import { useJumpStore } from '~/store/useJumpStore'
import { useMiniPulseChat } from '~/store/useMiniPulseChat'
import { usePulseStore } from '~/store/usePulseStore'
import { isJsonObject } from '~/utils/json'

import PinContent from './PinContent'

export interface PinnedMessage {
  id: string
  gravatar: string
  name: string
  dateCreated: string
  message: string
  isDeleted: boolean
  fileAttachments: File[]
  isSentByPulse: boolean
  replyTeamThreadId?: string | null
  topic?: {
    id: string | null
    name: string | null
  } | null
  teamThreadId?: string | null
  title?: string
}

interface PinnedMessagesDropdownProps<T = unknown> {
  anchorEl: HTMLElement | null
  open: boolean
  pinnedMessagesData?: T
  isLoading?: boolean
  transformData: (data: T | undefined) => PinnedMessage[]
  onClose?: () => void
  onMessageClick?: (message: PinnedMessage) => void
  onUnpinMessage?: (messageId: string) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

export const PinnedMessagesDropdown = <T,>({
  anchorEl,
  open,
  pinnedMessagesData,
  isLoading = false,
  transformData,
  onClose,
  onMessageClick,
  onUnpinMessage,
  onMouseDown,
}: PinnedMessagesDropdownProps<T>) => {
  const {
    setCurrentReplyThreadId,
    setThreadTitle,
    setCurrentReplyThreadDate,
    setOpenMiniPulseChat,
    openMiniPulseChat,
    currentReplyThreadId,
  } = useMiniPulseChat()
  const { setAnchor, setLastJumpedMessageId } = useJumpStore()
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const { setCurrentTopic } = usePulseStore()

  const pinnedMessages = useMemo<PinnedMessage[]>(() => {
    return transformData(pinnedMessagesData)
  }, [pinnedMessagesData, transformData])

  const handleMessageClick = useCallback(
    (message: PinnedMessage) => {
      // Mini Pulse Chat
      if (message.replyTeamThreadId) {
        if (
          openMiniPulseChat ||
          currentReplyThreadId !== message.replyTeamThreadId
        ) {
          setCurrentReplyThreadId(message.replyTeamThreadId)
          setThreadTitle(message?.title ?? 'Unknown')
          setCurrentReplyThreadDate(message.dateCreated)
          setOpenMiniPulseChat(true)
        }

        setAnchor({
          destination: 'MINI_PULSE_CHAT',
          messageId: message.id,
          replyTeamThreadId: message.replyTeamThreadId,
          teamThreadId: message.teamThreadId,
        })

        onMessageClick?.(message)
        onClose?.()
        return
      }

      // Team Chat
      const targetMsgEl = document.getElementById(message.id)

      if (targetMsgEl) {
        targetMsgEl.scrollIntoView({
          behavior: 'instant',
          block: 'center',
        })

        setLastJumpedMessageId(message.id)
        onMessageClick?.(message)
        onClose?.()

        return
      }

      setAnchor({
        destination: 'TEAM_CHAT',
        messageId: message.id,
        teamThreadId: message.teamThreadId,
      })

      // Navigate to topic first
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

      onMessageClick?.(message)
      onClose?.()
    },
    [onMessageClick, setAnchor, onClose],
  )

  const handleUnpinClick = useCallback(
    (message: PinnedMessage, event: React.MouseEvent) => {
      event.stopPropagation()
      onUnpinMessage?.(message.id)
    },
    [onUnpinMessage],
  )

  const handleMouseEnter = useCallback((messageId: string) => {
    setHoveredMessageId(messageId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredMessageId(null)
  }, [])

  const isMessageContentUI = useCallback((content: string): boolean => {
    try {
      if (!isJsonObject(content) || !content) return false

      const parsed: Descendant[] | ParsedContentUI = JSON.parse(content)

      return (
        parsed !== null &&
        typeof parsed === 'object' &&
        'message' in parsed &&
        'ui' in parsed
      )
    } catch {
      return false
    }
  }, [])

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'bottom',
      }}
      autoFocus={false}
      onClose={onClose}
      onMouseDown={onMouseDown}
      open={open}
      slotProps={{
        paper: {
          style: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            minWidth: 400,
            overflow: 'visible',
            padding: 0,
          },
        },
      }}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
    >
      <Stack
        sx={{
          backgroundColor: theme.palette.common.white,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          maxWidth: 500,
          minWidth: 300,
          padding: 0,
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          spacing={1}
          sx={(theme) => ({
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            padding: '16px 20px 12px',
          })}
        >
          <PushPinOutlined
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 'medium',
            }}
          />
          <Typography
            sx={{
              color: theme.palette.text.primary,
              fontSize: 'medium',
            }}
          >
            Pinned Messages
          </Typography>
        </Stack>

        {/* Messages List */}
        <Stack sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {isLoading ? (
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: '14px',
                }}
              >
                Loading pinned messages...
              </Typography>
            </Stack>
          ) : pinnedMessages.length === 0 ? (
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <PushPinOutlined
                sx={{
                  color: theme.palette.primary.main,
                  fontSize: '48px',
                  opacity: 0.3,
                }}
              />
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '14px',
                }}
              >
                This chat doesn{"'"}t have any pinned messages yet.
              </Typography>
            </Stack>
          ) : (
            <List sx={{ padding: 0 }}>
              {pinnedMessages.map((message, index) => {
                const hasUIContent = isMessageContentUI(message.message)

                return (
                  <React.Fragment key={message.id}>
                    <ListItem
                      key={message.id}
                      onClick={() => handleMessageClick(message)}
                      onMouseEnter={() => handleMouseEnter(message.id)}
                      onMouseLeave={handleMouseLeave}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                        alignItems: 'flex-start',
                        cursor: 'pointer',
                        gap: 1.5,
                        padding: '12px 20px',
                        position: 'relative',
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: '40px', mt: 0.5 }}>
                        <Avatar
                          alt={message.name}
                          placeholder={message.name}
                          size="medium"
                          src={message.gravatar}
                          sx={{
                            bgcolor: !message.gravatar
                              ? theme.palette.primary.main
                              : undefined,
                          }}
                        />
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <Stack>
                            <Typography
                              fontSize="small"
                              fontWeight="bold"
                              sx={{
                                color: theme.palette.text.secondary,
                              }}
                            >
                              # {message.topic?.name ?? 'General'}
                            </Typography>
                            <Stack
                              alignItems="center"
                              direction="row"
                              spacing={1}
                            >
                              <Typography
                                sx={{
                                  color: theme.palette.text.primary,
                                  fontSize: 'medium',
                                  fontWeight: theme.typography.fontWeightBold,
                                }}
                              >
                                {message.name}
                              </Typography>
                              <Typography
                                sx={{
                                  color: theme.palette.text.secondary,
                                  fontSize: 'small',
                                }}
                              >
                                {message.dateCreated}
                              </Typography>
                            </Stack>
                          </Stack>
                        }
                        secondary={
                          <PinContent
                            hasUIContent={hasUIContent}
                            message={message}
                          />
                        }
                      />

                      {/* Hover Actions - Only Unpin Button */}
                      {hoveredMessageId === message.id && (
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: 'center',
                            gap: 1,
                            position: 'absolute',
                            right: '12px',
                            top: '12px',
                          }}
                        >
                          <Tooltip placement="top" title="Unpin">
                            <IconButton
                              onClick={(e) => handleUnpinClick(message, e)}
                              size="small"
                            >
                              <Close sx={{ fontSize: '16px' }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </ListItem>
                    {index < pinnedMessages.length - 1 && <Divider />}
                  </React.Fragment>
                )
              })}
            </List>
          )}
        </Stack>
      </Stack>
    </Menu>
  )
}
