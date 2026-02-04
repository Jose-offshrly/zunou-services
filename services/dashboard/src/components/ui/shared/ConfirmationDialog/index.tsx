import { Typography } from '@mui/material'
import { ReactNode } from 'react'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'

interface ConfirmationDialog {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  title: string
  submitText?: string
  isLoading?: boolean
  message?: string | ReactNode
}

export const ConfirmationDialog = ({
  isLoading,
  isOpen,
  message,
  title,
  submitText,
  onClose,
  onSubmit,
}: ConfirmationDialog) => {
  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      isSubmitting={isLoading}
      maxWidth={400}
      onCancel={onClose}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={submitText}
      title={title}
    >
      <Typography textAlign="start" variant="body2">
        {message ?? 'Are you sure?'}
      </Typography>
    </CustomModalWithSubmit>
  )
}
