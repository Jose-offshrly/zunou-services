import { Stack, Typography } from '@mui/material'
import { useDeleteOrganizationGroupMutation } from '@zunou-queries/core/hooks/useDeleteOrganizationGroupMutation'
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'

interface DeleteGroupModalProps {
  isOpen: boolean
  onClose: () => void
  id: string
  title: string
  description: string
}

const DeleteGroupModal = ({
  isOpen,
  onClose,
  id,
  title,
  description,
}: DeleteGroupModalProps) => {
  const { t } = useTranslation(['common', 'org'])

  const { mutateAsync: deleteGroup, isPending: isDeleteGroupPending } =
    useDeleteOrganizationGroupMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleDelete = useCallback(() => {
    deleteGroup(
      { id },
      {
        onError: () => toast.error(t('delete_group_error', { ns: 'org' })),
        onSettled: () => onClose(),
        onSuccess: () =>
          toast.success(t('delete_group_success', { ns: 'org' })),
      },
    )
  }, [id])

  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      isSubmitting={isDeleteGroupPending}
      onCancel={onClose}
      onClose={onClose}
      onSubmit={handleDelete}
      submitText={t('delete')}
      title={t('delete_group', { ns: 'org' })}
      type="warning"
    >
      <Stack gap={2}>
        <Typography color="text.secondary" variant="body2">
          {t('delete_group_confirmation', { ns: 'org' })}
        </Typography>
        <Stack border={1} borderColor="divider" borderRadius={1} p={2}>
          <Typography fontWeight="bold">{title}</Typography>
          <Typography>{description}</Typography>
        </Stack>
      </Stack>
    </CustomModalWithSubmit>
  )
}

export default DeleteGroupModal
