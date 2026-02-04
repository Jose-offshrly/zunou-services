import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'

interface DeleteTaskConfirmationModal {
  isLoading: boolean
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

export const DeleteTaskListConfirmationModal = ({
  isLoading,
  isOpen,
  onClose,
  onSubmit,
}: DeleteTaskConfirmationModal) => {
  const { t } = useTranslation(['common', 'tasks'])

  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      isSubmitting={isLoading}
      onCancel={onClose}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={t('delete')}
      title={t('delete_task_list', { ns: 'tasks' })}
      type="warning"
    >
      <Stack spacing={2}>
        <Typography
          sx={{ color: 'text.secondary' }}
          textAlign="start"
          variant="body2"
        >
          {t('delete_task_list_confirmation', { ns: 'tasks' })}
        </Typography>
      </Stack>
    </CustomModalWithSubmit>
  )
}
