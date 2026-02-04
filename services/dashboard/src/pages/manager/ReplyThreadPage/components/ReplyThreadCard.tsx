import { Avatar, Box, CircularProgress, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import pulseLogo from '~/assets/pulse-logo.png'
import { ReplyThreadStatus } from '~/context/TeamChatContext'

interface ReplyThreadCardProps {
  metadata: { status: string; excerpt?: string }
  onClick?: () => void
  showLineElbow?: boolean
  timestamp: string
  disabled?: boolean
}

export const ReplyThreadCard = ({
  metadata,
  onClick,
  showLineElbow = true,
  timestamp,
  disabled = false,
}: ReplyThreadCardProps) => {
  const isPending =
    (metadata.status as ReplyThreadStatus) === ReplyThreadStatus.PENDING
  const title =
    (metadata.status as ReplyThreadStatus) === ReplyThreadStatus.COMPLETE
      ? metadata.excerpt
      : ''
  return (
    <Stack
      direction="column"
      sx={{ alignItems: 'flex-start', ml: -6, mt: 0, position: 'relative' }}
    >
      {showLineElbow && (
        <Box sx={{ left: 0, position: 'absolute', top: 0, zIndex: 0 }}>
          <svg fill="none" height="50" viewBox="0 0 80 60" width="80">
            <path
              d="M0 0 L0 25 L60 25"
              fill="none"
              stroke="#dedede"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </Box>
      )}
      <Stack
        alignItems="center"
        direction="row"
        onClick={!disabled && onClick ? onClick : undefined}
        sx={{
          bgcolor: 'white',
          border: '1px solid',
          borderColor: (theme) =>
            alpha(theme.palette.primary.main, disabled ? 0.05 : 0.1),
          borderRadius: 1,
          cursor: disabled ? 'default' : 'pointer',
          maxWidth: '600px',
          ml: 8,
          mr: 0,
          opacity: disabled ? 0.7 : 1,
          p: 1,
          position: 'relative',
          width: 'fit-content',
          zIndex: 1,
        }}
      >
        <Avatar
          alt="assistant"
          src={pulseLogo}
          sx={{ height: 24, mr: 1.5, width: 24 }}
        />
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          sx={{ minWidth: '10px' }}
        >
          {isPending ? (
            <>
              <CircularProgress size={12} />
            </>
          ) : (
            <Typography color="primary" fontSize={14} fontWeight="bold">
              {title}
            </Typography>
          )}
          <Typography color="text.secondary" fontSize={14} sx={{ ml: 1.5 }}>
            {timestamp}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  )
}
