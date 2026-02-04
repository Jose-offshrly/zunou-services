import { Portal } from '@mui/base/Portal'
import CloseIcon from '@mui/icons-material/Close'
import { Alert, Snackbar as BaseSnackbar } from '@mui/material'
import { useEffect, useState } from 'react'

import { IconButton } from '../form'

interface Props {
  message: string | undefined
  onClose?: () => void
  severity?: 'error' | 'info' | 'success' | 'warning'
}

export const Snackbar = ({ message, onClose, severity }: Props) => {
  const [dismiss, setDismiss] = useState(true)

  useEffect(() => {
    if (message) {
      setDismiss(false)
    }
  }, [message])

  const onDismiss = () => {
    setDismiss(true)
  }

  const action = (
    <>
      <IconButton
        aria-label="close"
        color="inherit"
        onClick={onDismiss}
        size="small"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  )

  return (
    <Portal>
      <BaseSnackbar
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        onClose={onClose}
        open={!dismiss && !!message}
        sx={{
          maxWidth: 600,
        }}
      >
        <Alert
          action={action}
          onClose={onClose}
          severity={severity}
          variant="filled"
        >
          {message}
        </Alert>
      </BaseSnackbar>
    </Portal>
  )
}
