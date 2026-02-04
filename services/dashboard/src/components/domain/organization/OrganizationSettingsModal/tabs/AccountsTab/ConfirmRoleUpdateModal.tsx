import { Typography } from '@mui/material'
import { OrganizationUserRole } from '@zunou-graphql/core/graphql'
import { useUpdateOrganizationUserRoleMutation } from '@zunou-queries/core/hooks/useUpdateOrganizationUserRoleMutation'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'
import { toTitleCase } from '~/utils/toTitleCase'

interface ConfirmRoleUpdateModalProps {
  selectedUser: {
    userId: string
    newRole: OrganizationUserRole
    oldRole: OrganizationUserRole
  } | null
  isOpen: boolean
  onClose: () => void
  onUserDemote: () => void
}

const ConfirmRoleUpdateModal = ({
  selectedUser,
  isOpen,
  onClose,
  onUserDemote,
}: ConfirmRoleUpdateModalProps) => {
  const { t } = useTranslation(['common', 'settings'])
  const { organizationId } = useOrganization()

  const { mutateAsync: mutateRole, isPending: isUpdatingRole } =
    useUpdateOrganizationUserRoleMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const onSubmitHandler = async () => {
    if (!selectedUser) return

    await mutateRole(
      {
        organizationId,
        role: selectedUser?.newRole,
        userId: selectedUser?.userId,
      },
      { onSuccess: () => toast.success('Successfully updated member role!') },
    )

    onClose()
    onUserDemote()
  }

  if (!selectedUser) return null

  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      isSubmitting={isUpdatingRole}
      onCancel={onClose}
      onClose={onClose}
      onSubmit={onSubmitHandler}
      submitText={t('confirm')}
      title={t('role_change_confirmation', { ns: 'settings' })}
    >
      <Typography>
        {t('role_demote_confirmation', { ns: 'settings' })}{' '}
        <Typography component="span" fontWeight="bold">
          {toTitleCase(selectedUser.newRole)}
        </Typography>
        ?{' '}
        <Typography>{t('access_loss_warning', { ns: 'settings' })}</Typography>
      </Typography>
    </CustomModalWithSubmit>
  )
}

export default ConfirmRoleUpdateModal
