import { Stack, Typography } from '@mui/material'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'

interface DeleteDataSourceConfirmationModalProps {
  name: string
  metadata: string
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export const DeleteDataSourceConfirmationModal = ({
  name,
  metadata,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: DeleteDataSourceConfirmationModalProps) => {
  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      isSubmitting={isSubmitting}
      onCancel={onClose}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={'Delete'}
      title={'Delete Data Source'}
      type="warning"
    >
      <Stack spacing={2}>
        <Typography
          sx={{ color: 'text.secondary' }}
          textAlign="start"
          variant="body2"
        >
          Are you sure you want to delete this data source? This cannot be
          undone.
        </Typography>
        <Stack
          borderRadius={1}
          padding={2}
          sx={{ border: 1, borderColor: 'divider' }}
        >
          <Stack>
            <Typography
              fontSize={14}
              fontWeight="500"
              sx={{ color: (theme) => theme.palette.text.primary }}
            >
              {name}
            </Typography>

            <Typography
              fontSize={12}
              sx={{ color: (theme) => theme.palette.text.secondary }}
            >
              {metadata}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </CustomModalWithSubmit>
  )
}
