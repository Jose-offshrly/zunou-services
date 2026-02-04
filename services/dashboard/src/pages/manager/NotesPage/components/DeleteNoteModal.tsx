import { Stack, Typography } from '@mui/material'
import { Note } from '@zunou-graphql/core/graphql'
import { t } from 'i18next'
import { useTranslation } from 'react-i18next'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'

interface DeleteConfirmationModalProps {
  handleClose: () => void
  isOpen: boolean
  title: string
  message: string
  onConfirmDelete: () => void
}

export const DeleteConfirmationModal = ({
  handleClose,
  isOpen,
  title,
  message,
  onConfirmDelete,
}: DeleteConfirmationModalProps) => {
  const { t } = useTranslation(['common', 'notes'])

  const handleDeleteConfirm = () => {
    onConfirmDelete()
    handleClose()
  }

  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={handleDeleteConfirm}
      style={{ maxWidth: 400 }}
      submitText={t('delete')}
      title={title}
      type="warning"
    >
      <Stack alignItems="center" height="100%" justifyContent="center">
        <Typography sx={{ textAlign: 'center' }}>{message}</Typography>
        <Typography sx={{ textAlign: 'center' }}>
          {t('irreversible_action_warning')}
        </Typography>
      </Stack>
    </CustomModalWithSubmit>
  )
}

interface Props {
  handleClose: () => void
  isOpen: boolean
  note: Note | null
  onConfirmDelete: () => void
}

export const DeleteNoteModal = ({
  handleClose,
  isOpen,
  note,
  onConfirmDelete,
}: Props) => {
  if (!note) return null

  return (
    <DeleteConfirmationModal
      handleClose={handleClose}
      isOpen={isOpen}
      message={t('delete_note_confirmation', { ns: 'notes' })}
      onConfirmDelete={onConfirmDelete}
      title={t('delete_note', { ns: 'notes' })}
    />
  )
}
