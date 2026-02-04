import {
  ConnectWithoutContactOutlined,
  Grade,
  StarBorderOutlined,
} from '@mui/icons-material'
import { Chip, IconButton, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { UserPresence } from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { getPresenceColor } from '~/utils/presenceUtils'
import { getFirstLetter } from '~/utils/textUtils'

import { usePinOrganizationUser } from '../hooks'

export const ConversationUserItem = ({
  active,
  gravatar,
  userPresence,
  name,
  onClick,
  unreadMessagesCount = 0,
  userId,
  one_to_one,
  isPinned,
  organizationUserId,
}: {
  active: boolean
  gravatar?: string
  userPresence?: UserPresence
  name: string
  onClick?: () => void
  unreadMessagesCount?: number
  userId?: string
  one_to_one?: string | null
  isPinned?: boolean
  organizationUserId?: string
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const { handleTogglePinUser } = usePinOrganizationUser({
    onError: (error) => {
      console.error('Failed to toggle pin:', error)
      toast.error(`Could not ${isPinned ? 'unstar' : 'star'} member.`)
    },
    onSuccess: () => {
      toast.success(
        `Member ${isPinned ? 'unstarred' : 'starred'} successfully!`,
      )
    },
    organizationId: organizationId || '',
  })

  const handleOneToOneClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!one_to_one || !organizationId) return
    navigate(
      `/manager/${pathFor({
        pathname:
          user?.id === userId ? Routes.PulseDetail : Routes.PulseTeamChat,
        query: {
          organizationId,
          pulseId: one_to_one,
        },
      })}`,
    )
  }

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!organizationUserId) return
    handleTogglePinUser(organizationUserId, isPinned || false)
  }

  return (
    <Stack
      alignItems="center"
      bgcolor={active ? alpha(theme.palette.primary.main, 0.15) : 'transparent'}
      borderRadius={1}
      direction="row"
      justifyContent="space-between"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      px={1}
      py={1}
      spacing={1}
      sx={{
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
        },
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        spacing={1}
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Avatar
          badgeColor={getPresenceColor(userPresence ?? UserPresence.Offline)}
          isDarkMode={false}
          placeholder={getFirstLetter(name)?.toUpperCase()}
          showBadge={true}
          src={gravatar || undefined}
          sx={{ flexShrink: 0, height: 32, width: 32 }}
          variant="circular"
        />
        <Typography
          sx={{
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          variant="body1"
        >
          {name}
        </Typography>
      </Stack>

      <Stack alignItems="center" direction="row" spacing={1}>
        {isHovered && organizationUserId && (
          <>
            <IconButton
              onClick={handleStarClick}
              size="small"
              sx={{
                p: 0.5,
              }}
            >
              {isPinned ? (
                <Grade fontSize="small" />
              ) : (
                <StarBorderOutlined fontSize="small" />
              )}
            </IconButton>
          </>
        )}
        {unreadMessagesCount > 0 && (
          <Chip
            label={unreadMessagesCount}
            size="small"
            sx={{
              '& .MuiChip-label': { fontSize: '0.725rem' },
              bgcolor: 'secondary.main',
              color: 'common.white',
              px: 0.5,
            }}
          />
        )}
        {one_to_one && (
          <IconButton
            onClick={handleOneToOneClick}
            size="small"
            sx={{
              p: 0.5,
            }}
          >
            <ConnectWithoutContactOutlined fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Stack>
  )
}
