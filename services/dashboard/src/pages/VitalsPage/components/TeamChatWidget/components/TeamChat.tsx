import { Circle } from '@mui/icons-material'
import { Typography, useTheme } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { TeamMessage, UserPresence } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'

import { useVitalsContext } from '~/context/VitalsContext'
import { formatTimeAgo } from '~/utils/formatTimeAgo'
import { getPresenceColor } from '~/utils/presenceUtils'

export interface TeamChatProps {
  id: string
  pulseName: string
  messages: TeamMessage[]
  readLaterHandler: (pulseId: string) => void
  redirectHandler: (pulseId: string) => void
}

const TeamChat = ({
  id,
  pulseName,
  messages,
  readLaterHandler,
  redirectHandler,
}: TeamChatProps) => {
  const { setting } = useVitalsContext()

  const muiTheme = useTheme()

  const isDarkMode = setting.theme === 'dark'

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const activeMessage = sortedMessages[0]

  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    // Initial calculation
    setTimeAgo(formatTimeAgo(new Date(activeMessage.createdAt)))

    // Set up interval to update the time display every minute
    const intervalId = setInterval(() => {
      setTimeAgo(formatTimeAgo(new Date(activeMessage.createdAt)))
    }, 60000) // Update every minute

    return () => clearInterval(intervalId)
  }, [activeMessage?.createdAt])

  return (
    <Stack gap={1}>
      <Stack
        onClick={() => redirectHandler(id)}
        sx={{
          '&:hover': {
            backgroundColor: isDarkMode
              ? alpha(muiTheme.palette.primary.main, 0.1)
              : alpha(muiTheme.palette.secondary.main, 0.1),
          },
          borderRadius: 1,
          cursor: 'pointer',
          gap: 1,
          p: 1,
          pb: 0,
        }}
      >
        {/* Header */}
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Stack alignItems="center" direction="row" gap={1}>
            <Typography fontWeight="bold" variant="caption">
              {pulseName}
            </Typography>
            <Circle
              sx={{
                fontSize: 5,
              }}
            />
            <Typography color="text.secondary" fontSize="small">
              {timeAgo}
            </Typography>
          </Stack>

          <Stack
            sx={{
              alignItems: 'center',
              bgcolor: theme.palette.error.light,
              borderRadius: 9999,
              color: theme.palette.common.white,
              fontSize: 12,
              fontWeight: 'bold',
              height: 20,
              justifyContent: 'center',
              width: 20,
            }}
          >
            {sortedMessages.length}
          </Stack>
        </Stack>

        {/* Main - showing the active message */}
        <Stack alignItems="center" direction="row" gap={1} pb={2}>
          <Avatar
            badgeColor={getPresenceColor(
              activeMessage.user?.presence ?? UserPresence.Offline,
            )}
            placeholder={activeMessage.user?.name}
            showBadge={true}
            src={activeMessage.user?.gravatar}
            variant="circular"
          />

          <Stack
            sx={{
              overflow: 'hidden',
            }}
          >
            <Typography variant="body2">
              {activeMessage.user?.name || 'Unknown User'}
            </Typography>

            <Typography
              color={theme.palette.text.secondary}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              variant="caption"
            >
              {activeMessage.content?.replace(/<[^>]*>?/gm, '')}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      {/* Footer */}
      <Stack
        alignItems="center"
        borderColor={theme.palette.divider}
        direction="row"
        justifyContent="center"
      >
        <Button
          fullWidth={true}
          onClick={() => readLaterHandler(id)}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...(isDarkMode && {
              '&.Mui-disabled': {
                bgcolor: 'grey.800',
                border: 'none',
                color: '#aaa',
                opacity: 1,
              },
            }),
          }}
          variant="outlined"
        >
          Read Later
        </Button>
      </Stack>
    </Stack>
  )
}

export default TeamChat
