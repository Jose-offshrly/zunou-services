import { Error as ErrorIcon } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'

import CheckIcon from '~/assets/check-icon.png'

interface GuestInviteStatusProps {
  status: 'success' | 'error'
  email: string
  onProceed: () => void
}

export const GuestInviteStatus = ({
  status,
  email,
  onProceed,
}: GuestInviteStatusProps) => {
  const isSuccess = status === 'success'

  return (
    <Stack alignItems="center" p={4} spacing={3}>
      {isSuccess ? (
        <img alt="Check" src={CheckIcon} style={{ height: 64, width: 64 }} />
      ) : (
        <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 64 }} />
      )}
      {isSuccess ? (
        <Stack>
          <Typography color="text.secondary" textAlign="center">
            Invitation has been sent to{' '}
            <span style={{ color: theme.palette.primary.main }}>{email}</span>
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            successfully via email.
          </Typography>
        </Stack>
      ) : (
        <Stack>
          <Typography color="text.secondary" textAlign="center">
            Unable to send guest invitation to{' '}
            <span style={{ color: theme.palette.error.main }}>{email}</span>.
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            Please try again.
          </Typography>
        </Stack>
      )}
      <Button onClick={onProceed} sx={{ minWidth: 120 }} variant="contained">
        {isSuccess ? 'Proceed' : 'Try Again'}
      </Button>
    </Stack>
  )
}
