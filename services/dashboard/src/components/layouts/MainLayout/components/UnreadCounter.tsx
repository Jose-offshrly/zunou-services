import { Circle } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'

import { formatUnreadCount } from '~/utils/formatUnreadCount'

interface Props {
  unread?: number
}

export default function UnreadCounter({ unread = 0 }: Props) {
  if (unread === 0) return null

  if (unread === 1)
    return (
      <Circle
        sx={{
          color: 'secondary.main',
          height: 9,
          width: 9,
        }}
      />
    )

  return (
    <Stack
      sx={{
        alignItems: 'center',

        bgcolor: 'secondary.main',

        // aspectRatio: '1 / 1',
        // minWidth: 16,
        // minHeight: 16,
        borderRadius: 9999,

        justifyContent: 'center',

        px: 0.7,
        py: 0.2,
      }}
    >
      <Typography
        color="common.white"
        fontWeight={500}
        sx={{
          fontSize: 10,
        }}
      >
        {formatUnreadCount(unread)}
      </Typography>
    </Stack>
  )
}
