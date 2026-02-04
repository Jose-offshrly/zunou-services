import { Close } from '@mui/icons-material'
import { alpha, Box, Stack, Typography } from '@mui/material'
import { IconButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

interface ChatHeaderProps {
  threadTitle?: string
  currentReplyThreadDate: string | null
  toggleMiniPulseChat: () => void
}

export const ChatHeader = ({
  threadTitle,
  currentReplyThreadDate,
  toggleMiniPulseChat,
}: ChatHeaderProps) => (
  <Stack
    alignItems="center"
    borderBottom={`1px solid ${alpha(theme.palette.primary.main, 0.2)}`}
    direction="row"
    justifyContent="space-between"
    padding={2}
    sx={{
      bgcolor: 'white',
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      zIndex: 2,
    }}
  >
    <Stack justifyContent="space-between" spacing={1}>
      <Typography
        fontSize={14}
        sx={{ alignItems: 'center', display: 'flex', minHeight: '22px' }}
      >
        <Box component="span" sx={{ fontWeight: 'medium', mr: 0.5 }}>
          Title:
        </Box>
        {threadTitle ? threadTitle : <LoadingSkeleton width={100} />}
      </Typography>
      <Typography
        fontSize={14}
        sx={{ alignItems: 'center', display: 'flex', minHeight: '22px' }}
      >
        <Box component="span" sx={{ fontWeight: 'medium', mr: 0.5 }}>
          Date:
        </Box>
        {currentReplyThreadDate ? (
          formatDateAndTime(currentReplyThreadDate)
        ) : (
          <LoadingSkeleton width={100} />
        )}
      </Typography>
    </Stack>
    <IconButton onClick={toggleMiniPulseChat}>
      <Close />
    </IconButton>
  </Stack>
)
