import { Circle } from '@mui/icons-material'
import { Typography, useTheme } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { UserPresence } from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'

import { useVitalsContext } from '~/context/VitalsContext'
import { getPresenceColor } from '~/utils/presenceUtils'

interface DirectMessageProps {
  id: string
  name: string
  content: string
  timestamp: Date
  handleMessageClick: (messageId: string) => void
  latestMessageSenderId: string
  profile?: string | null
  isRead?: boolean
  presence?: UserPresence
}

const DirectMessage = ({
  id,
  name,
  content,
  timestamp,
  latestMessageSenderId,
  handleMessageClick,
  profile = '',
  isRead = false,
  presence = UserPresence.Offline,
}: DirectMessageProps) => {
  const { user } = useAuthContext()
  const { setting } = useVitalsContext()
  const muiTheme = useTheme()

  const isDarkMode = setting.theme === 'dark'

  const formatTime = (date: Date): string => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date >= today) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (date >= yesterday) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
    }
  }

  return (
    <Stack
      alignItems="start"
      direction="row"
      onClick={() => handleMessageClick(id)}
      padding={2}
      spacing={2}
      sx={{
        '&:hover': {
          backgroundColor: isDarkMode
            ? alpha(muiTheme.palette.primary.main, 0.1)
            : alpha(muiTheme.palette.secondary.main, 0.1),
        },
        color: isDarkMode ? 'grey.300' : 'inherit',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <Avatar
        badgeColor={getPresenceColor(presence)}
        isDarkMode={isDarkMode}
        placeholder={getFirstLetter(name)?.toUpperCase()}
        showBadge={true}
        src={profile}
        variant="circular"
      />
      <Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            fontWeight={500}
            sx={{
              color: isDarkMode ? 'grey.100' : 'text.primary',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            variant="body2"
          >
            {name}
          </Typography>

          {!isRead && (
            <Circle
              sx={{
                color: muiTheme.palette.secondary.main,
                fontSize: 10,
              }}
            />
          )}
        </Stack>

        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={1}
          sx={{ width: '100%' }}
        >
          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            justifyContent="space-between"
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            <Typography
              sx={{
                color: isDarkMode ? 'grey.400' : 'text.secondary',
                maxWidth: '60%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              variant="caption"
            >
              {`${user?.id === latestMessageSenderId ? 'You:' : ''} ${content}`}
            </Typography>

            <Stack
              alignItems="center"
              direction="row"
              gap={2}
              justifyContent="end"
              width="40%"
            >
              <Circle
                sx={{
                  color: 'divider',
                  fontSize: 7,
                }}
              />

              <Typography
                sx={{
                  color: isDarkMode ? 'grey.400' : 'text.secondary',
                }}
                variant="caption"
              >
                {formatTime(timestamp)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}

export default DirectMessage
