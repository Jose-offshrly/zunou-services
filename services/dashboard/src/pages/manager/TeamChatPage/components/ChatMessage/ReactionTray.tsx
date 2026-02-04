import { alpha, Stack, Tooltip, Typography } from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'
import { useToggleDirectMessageReactionMutation } from '@zunou-queries/core/hooks/useToggleDirectMessageReaction'
import { useToggleTeamMessageReactionMutation } from '@zunou-queries/core/hooks/useToggleTeamMessageReaction'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import toast from 'react-hot-toast'

import { usePulseStore } from '~/store/usePulseStore'

import EmojiPickerButton from '../MessageAction/EmojiPickerButton'

interface Reaction {
  reaction: string
  count: number
  users?: User[]
}

interface ReactionTrayProps {
  reactions: Reaction[]
  messageId: string
  replyTeamThreadId?: string
  type?: 'TEAM_CHAT' | 'DIRECT_MESSAGE' | 'MINI_PULSE_CHAT'
  threadId?: string
  organizationId?: string
  onReaction?: (messageId: string, reaction: string) => void
}

const REACTION_TRAY_ID = 'REACTION_TRAY_'

export const getReactionTrayId = (messageId: string) =>
  `${REACTION_TRAY_ID}${messageId}`

export default function ReactionTray({
  reactions,
  messageId,
  replyTeamThreadId,
  type = 'TEAM_CHAT',
  threadId,
  organizationId,
  onReaction,
}: ReactionTrayProps) {
  const { pulseMembership, pulse } = usePulseStore()
  const { user } = useAuthContext()

  const toggleTeamMessageReaction = useToggleTeamMessageReactionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const toggleDirectMessageReaction = useToggleDirectMessageReactionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const userId = type === 'DIRECT_MESSAGE' ? user?.id : pulseMembership?.user.id

  const didUserReact = (userId: string | undefined, users: User[]) => {
    if (!userId) return false

    const target = users.find((user) => user.id === userId)

    return Boolean(target)
  }

  const formatUserNames = (users: User[] | undefined) => {
    if (!users || users.length === 0) return ''

    return (
      <Stack component="span" gap={0.5}>
        {users.map((user) => (
          <Typography component="span" fontSize="small" key={user.id}>
            {user.id === userId ? `${user.name} (You)` : user.name}
          </Typography>
        ))}
      </Stack>
    )
  }

  const handleReaction = (reaction: string) => {
    if (type === 'DIRECT_MESSAGE') {
      if (onReaction) {
        onReaction(messageId, reaction)
        return
      }

      if (!threadId || !organizationId) {
        toast.error('Missing thread ID or organization ID.')
        return
      }

      try {
        toggleDirectMessageReaction.mutate({
          directMessageId: messageId,
          organizationId,
          reaction,
          threadId,
        })
      } catch (error) {
        console.error('Failed to toggle reaction:', error)
        toast.error('Failed to add reaction')
      }
      return
    }

    // Team message reaction
    if (!pulse?.id) {
      toast.error('Missing pulse ID.')
      return
    }

    try {
      toggleTeamMessageReaction.mutate({
        pulseId: pulse.id,
        reaction,
        replyTeamThreadId,
        teamMessageId: messageId,
      })
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
      toast.error('Failed to add reaction')
    }
  }

  // Sort reactions alphabetically by Unicode value
  const sortedReactions = [...reactions].sort((a, b) =>
    a.reaction.localeCompare(b.reaction),
  )

  if (reactions.length <= 0) return null

  return (
    <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1} mt={1}>
      {sortedReactions.map((reaction, index) => {
        return (
          <Tooltip
            disableInteractive={true}
            key={`${reaction.reaction}-${index}`}
            placement="top"
            title={formatUserNames(reaction.users)}
          >
            <Stack
              component="button"
              onClick={() => handleReaction(reaction.reaction)}
              sx={(theme) => ({
                '&:hover': {
                  backgroundColor: didUserReact(userId, reaction.users ?? [])
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.primary.light, 0.2),
                  transform: 'scale(1.05)',
                },
                alignItems: 'center',
                backgroundColor: didUserReact(userId, reaction.users ?? [])
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.primary.light, 0.05),
                border: 1,
                borderColor: didUserReact(userId, reaction.users ?? [])
                  ? alpha(theme.palette.primary.main, 0.4)
                  : alpha(theme.palette.primary.light, 0.2),
                borderRadius: 9999,
                cursor: 'pointer',
                flexDirection: 'row',
                gap: 1,
                px: 1,
                transition: 'all 0.2s',
              })}
            >
              <Typography fontSize={14}>{reaction.reaction}</Typography>
              <Typography fontSize={12}>{reaction.count}</Typography>
            </Stack>
          </Tooltip>
        )
      })}

      <Stack width="fit-content">
        <EmojiPickerButton
          iconSx={{ fontSize: 16 }}
          onEmojiClick={(reaction) => handleReaction(reaction.emoji)}
          size="small"
          sx={{ borderRadius: 9999 }}
        />
      </Stack>
    </Stack>
  )
}
