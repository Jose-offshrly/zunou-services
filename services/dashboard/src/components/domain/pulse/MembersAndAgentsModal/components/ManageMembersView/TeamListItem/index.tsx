import { AssignmentInd, DeleteOutline } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { PulseMember, PulseMemberRole } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { RoleSelector } from '~/components/domain/pulse/SetupSettingsModal/RoleSelector'
import { ConfirmationDialog } from '~/components/ui/shared/ConfirmationDialog'
import { useAccessControl } from '~/hooks/useAccessControl'
import { usePulseStore } from '~/store/usePulseStore'
import { toTitleCase } from '~/utils/toTitleCase'

interface TeamListItemProps {
  member: PulseMember
  onRoleChange: (userId: string, role: PulseMemberRole) => void
  onDelete: (member: PulseMember) => void
}

export const TeamListItem = ({
  member,
  onRoleChange,
  onDelete,
}: TeamListItemProps) => {
  const { t } = useTranslation(['common', 'pulse'])
  const { id: memberId, role: memberRole, user, userId } = member
  const { user: currentUser } = useAuthContext()

  const {
    pulseMembership,
    permissions: pulsePermissions,
    pulseMembers,
  } = usePulseStore()
  const { checkAccess } = useAccessControl()

  const { grant: hasDeleteAccess } = checkAccess(
    ['delete:pulse'],
    pulsePermissions,
  )
  const { grant: hasUpdateAccess } = checkAccess(
    ['update:pulse-member'],
    pulsePermissions,
  )

  const isOnlyMember = pulseMembers.length === 1
  const isSelf = currentUser?.id === userId
  const isOwner = memberRole === PulseMemberRole.Owner

  const canDelete =
    (hasDeleteAccess || isSelf) && !(isSelf && isOnlyMember) && !isOwner

  const pulseMemberRoles = useMemo(() => {
    return Object.values(PulseMemberRole)
      .filter((role) => {
        if (role === PulseMemberRole.Guest) return false

        if (pulseMembership?.role === PulseMemberRole.Owner) {
          return true
        }

        if (memberRole === PulseMemberRole.Owner) {
          return [PulseMemberRole.Owner].includes(role)
        }

        return [PulseMemberRole.Admin, PulseMemberRole.Staff].includes(role)
      })
      .map((role) => ({ label: role, value: role }))
  }, [pulseMembership?.role, memberRole])

  const [selectedRole, setSelectedRole] = useState<PulseMemberRole | null>(null)

  return (
    <Stack key={memberId}>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        paddingY={1}
      >
        <Stack direction="row" spacing={2}>
          <Typography>{user.name}</Typography>
          {memberRole === PulseMemberRole.Guest && (
            <AssignmentInd sx={{ color: theme.palette.common.gold }} />
          )}
        </Stack>
        <Stack alignItems="center" direction="row" spacing={2}>
          {memberRole !== PulseMemberRole.Guest ? (
            <RoleSelector
              disabled={
                !hasUpdateAccess || memberRole === PulseMemberRole.Owner
              }
              onChange={(newRole: PulseMemberRole) => setSelectedRole(newRole)}
              options={pulseMemberRoles}
              value={memberRole}
            />
          ) : (
            <Stack
              alignItems="center"
              display="flex"
              justifyContent="center"
              width={90}
            >
              <Typography color="text.primary" variant="body2">
                {toTitleCase(memberRole)}
              </Typography>
            </Stack>
          )}
          <Box width={40}>
            {!isOwner && (
              <IconButton
                color="error"
                disabled={!canDelete}
                onClick={() => onDelete(member)}
              >
                <DeleteOutline />
              </IconButton>
            )}
          </Box>
        </Stack>
      </Stack>
      {selectedRole && (
        <ConfirmationDialog
          isOpen={!!selectedRole}
          message={
            <Stack spacing={2}>
              <Typography color="text.secondary">
                {t('role_update_confirmation', { ns: 'pulse' })}
              </Typography>

              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <Box width={100}>
                    <Typography fontWeight="bold" variant="body1">
                      {t('email')}
                    </Typography>
                  </Box>
                  <Typography color="text.secondary">{user.email}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Box width={100}>
                    <Typography fontWeight="bold" variant="body1">
                      {t('role')}
                    </Typography>
                  </Box>
                  <Typography color="text.secondary">{selectedRole}</Typography>
                </Stack>
              </Stack>
            </Stack>
          }
          onClose={() => setSelectedRole(null)}
          onSubmit={() => onRoleChange(userId, selectedRole)}
          submitText={t('update')}
          title={t('role_selection', { ns: 'pulse' })}
        />
      )}
    </Stack>
  )
}
