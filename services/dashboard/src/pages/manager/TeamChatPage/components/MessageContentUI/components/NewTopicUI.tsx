import {
  Avatar,
  AvatarGroup,
  Box,
  Card,
  Chip,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/system'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Descendant } from 'slate'

import { useOrganization } from '~/hooks/useOrganization'
import { formatTimeAgo } from '~/utils/formatTimeAgo'
import { formatUnreadCount } from '~/utils/formatUnreadCount'
import { getFirstLetter, serializeToHTML } from '~/utils/textUtils'

import { useTeamThreadTopic } from '../../../hooks/useTeamThreadTopic'

interface Participant {
  id: string
  name: string
  gravatar?: string
}

interface LatestMessage {
  id: string
  name: string
  gravatar?: string
  content?: string
  created_at: string
}

export interface TopicReference {
  topic_name: string
  topic_message_count: number
  participants: Participant[]
  created_by: string
  latest_messages: LatestMessage[]
}

interface NewTopicUIProps {
  topic: TopicReference
  onTopicSelect?: (topic: {
    id: string
    name: string
    unreadCount?: number
  }) => void
}

const MAX_DISPLAY_PARTICIPANTS = 3
const MAX_DISPLAY_NAMES = 2

const parseMessageContent = (content: string | null | undefined): string => {
  if (!content) return ''

  try {
    const parsed: Descendant[] = JSON.parse(content)
    if (Array.isArray(parsed)) {
      return serializeToHTML(parsed)
    }
  } catch {
    // Not JSON → fallback to legacy HTML
  }

  return content
}

export default function NewTopicUI({ topic, onTopicSelect }: NewTopicUIProps) {
  const theme = useTheme()
  const { user } = useAuthContext()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()

  const { topics } = useTeamThreadTopic({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    organizationId: organizationId || '',
    pulseId: pulseId || '',
  })

  const handleCardClick = useCallback(() => {
    if (!onTopicSelect) return

    const foundTopic = topics.find((t) => t.name === topic.topic_name)
    if (foundTopic) {
      onTopicSelect({
        id: foundTopic.id,
        name: foundTopic.name,
        unreadCount: foundTopic.hasUnread ? 1 : 0,
      })
    }
  }, [topics, topic.topic_name, onTopicSelect])

  const participantList = useMemo(() => {
    const others = topic.participants.filter((p) => p.id !== user?.id)
    const currentUser = topic.participants.find((p) => p.id === user?.id)
    const displayParticipants = currentUser
      ? [currentUser, ...others].slice(0, MAX_DISPLAY_PARTICIPANTS)
      : others.slice(0, MAX_DISPLAY_PARTICIPANTS)

    const otherNamesToShow = others
      .slice(0, MAX_DISPLAY_NAMES)
      .map((p) => p.name)
    const remainingOthersCount = others.length - otherNamesToShow.length

    return {
      displayParticipants,
      otherNamesToShow,
      remainingCount: remainingOthersCount,
    }
  }, [topic.participants, user?.id])

  const participantDisplayText = useMemo(() => {
    if (participantList.otherNamesToShow.length === 0) {
      return participantList.remainingCount > 0
        ? `You and ${participantList.remainingCount} others`
        : 'You'
    }

    const namesText = participantList.otherNamesToShow.join(', ')
    const othersText =
      participantList.remainingCount > 0
        ? ` and ${participantList.remainingCount} others`
        : ''

    return `You, ${namesText}${othersText}`
  }, [participantList])

  const unreadCount = useMemo(() => {
    const foundTopic = topics.find((t) => t.name === topic.topic_name)
    if (foundTopic) {
      return foundTopic.hasUnread ? 1 : 0
    }
    return 0
  }, [topics, topic.topic_name])

  const hasMessages = topic.latest_messages.length > 0

  const cardSx = useMemo(
    () => ({
      borderColor: theme.palette.divider,
      borderRadius: 2,
      boxShadow: 'none',
      cursor: onTopicSelect ? 'pointer' : 'default',
      maxWidth: '70%',
      minWidth: '500px',
      p: 2,
      width: '500px',
      ...(onTopicSelect && {
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }),
    }),
    [theme, onTopicSelect],
  )

  return (
    <Stack position="relative">
      <Box
        sx={{
          pointerEvents: 'none',
          position: 'absolute',
          right: '96.5%',
          top: '40%',
          transform: 'translateY(-50%)',
          zIndex: -1,
        }}
      >
        <svg
          fill="none"
          height="120"
          viewBox="0 0 80 60"
          width="50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 0 L0 70 L60 70"
            fill="none"
            stroke="#dedede"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </Box>
      <Card onClick={handleCardClick} sx={cardSx} variant="outlined">
        {/* Header */}
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          mb={1}
          width="100%"
        >
          <Stack alignItems="flex-start" spacing={1} width="100%">
            {participantList.displayParticipants.length > 1 && (
              <Stack alignItems="center" direction="row" spacing={1}>
                <AvatarGroup
                  max={MAX_DISPLAY_PARTICIPANTS}
                  sx={{
                    '& .MuiAvatar-root': {
                      border: `2px solid ${theme.palette.background.paper}`,
                      fontSize: '11px',
                      height: 24,
                      width: 24,
                    },
                  }}
                >
                  {participantList.displayParticipants.map((participant) => (
                    <Avatar
                      key={participant.id}
                      src={participant.gravatar || undefined}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.common.white,
                      }}
                    >
                      {!participant.gravatar &&
                        getFirstLetter(participant.name || '').toUpperCase()}
                    </Avatar>
                  ))}
                </AvatarGroup>
                <Typography fontWeight={600} variant="subtitle2">
                  {participantDisplayText}
                </Typography>
              </Stack>
            )}

            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography fontWeight={600} variant="subtitle2">
                #{topic.topic_name}
              </Typography>
            </Stack>
          </Stack>

          {unreadCount > 0 && (
            <Chip
              color="secondary"
              label={formatUnreadCount(unreadCount)}
              size="small"
              sx={{
                bgcolor: theme.palette.secondary.main,
                borderRadius: '24px',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                height: 20,
              }}
            />
          )}
        </Stack>

        {/* Latest Messages */}
        {hasMessages ? (
          <Stack spacing={0.5} width="100%">
            {topic.latest_messages.map((msg, index) => (
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
                key={`${msg.created_at}-${index}`}
                spacing={1}
              >
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1}
                  sx={{ minWidth: 0, overflow: 'hidden', width: '100%' }}
                >
                  <Avatar
                    src={msg.gravatar || undefined}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.common.white,
                      flexShrink: 0,
                      height: 24,
                      width: 24,
                    }}
                  >
                    {!msg.gravatar &&
                      getFirstLetter(msg.name || '').toUpperCase()}
                  </Avatar>
                  <Typography
                    component="span"
                    sx={{
                      flexShrink: 0,
                      mr: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {msg.name || 'Unknown'}:
                  </Typography>
                  <Typography
                    color="text.primary"
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                    variant="body2"
                  >
                    <Box
                      dangerouslySetInnerHTML={{
                        __html: parseMessageContent(msg.content),
                      }}
                      sx={{
                        '& p': { margin: 0 },
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 1,
                        color: 'inherit',
                        display: '-webkit-box',
                        fontStyle: 'normal',
                        overflow: 'hidden',
                        padding: '0 !important',
                        wordBreak: 'break-word',
                      }}
                    />
                  </Typography>
                </Stack>
                {msg.created_at && (
                  <Typography
                    color="text.secondary"
                    sx={{ ml: 1, whiteSpace: 'nowrap' }}
                    variant="caption"
                  >
                    {formatTimeAgo(
                      new Date(msg.created_at.replace(' ', 'T') + 'Z'),
                    )}
                    &nbsp;ago
                  </Typography>
                )}
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" mt={1} variant="body2">
            No messages yet — start the conversation!
          </Typography>
        )}
      </Card>
    </Stack>
  )
}
