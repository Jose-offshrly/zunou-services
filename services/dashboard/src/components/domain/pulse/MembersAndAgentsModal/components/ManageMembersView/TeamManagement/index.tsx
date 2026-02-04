import {
  AssignmentInd,
  ChevronLeft,
  FilterAltOutlined,
} from '@mui/icons-material'
import {
  Divider,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { PulseCategory, PulseMemberRole } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { toTitleCase } from '~/utils/toTitleCase'

import { TeamListItem } from '../TeamListItem'
import { useHooks } from './hooks'

interface TeamManagementProps {
  onInvite: () => void
  onBack: () => void
}

export const TeamManagement = ({ onInvite, onBack }: TeamManagementProps) => {
  const {
    handleRoleChange,
    handleDeleteClick,
    handleConfirmDelete,
    handleCancelDelete,
    hasInvitePermission,
    isProcessing,
    filteredMembers,
    filters,
    hasGuestRole,
    pulse,
    pulseMembers,
    memberToDelete,
    showDeleteModal,
    setFilters,
    t,
  } = useHooks()

  const { user: currentUser } = useAuthContext()

  return (
    <Stack px={2} spacing={2}>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Stack spacing={1}>
          <Button
            color="inherit"
            onClick={onBack}
            startIcon={<ChevronLeft fontSize="small" />}
            sx={{
              alignSelf: 'flex-start',
            }}
          >
            {t('back')}
          </Button>
          <Stack direction="row" spacing={2}>
            <Typography fontWeight="bold" variant="h6">
              {t('manage_pulse_members', { ns: 'pulse' })}
            </Typography>
            {hasGuestRole && (
              <AssignmentInd
                sx={{
                  color: theme.palette.common.gold,
                }}
              />
            )}
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {t('manage_pulse_members_description', { ns: 'pulse' })}
          </Typography>
        </Stack>
        {pulse?.category === PulseCategory.Team && hasInvitePermission && (
          <Button
            disableElevation={true}
            onClick={onInvite}
            type="button"
            variant="outlined"
          >
            {t('invite')}
          </Button>
        )}
      </Stack>
      {isProcessing ? (
        <LoadingSkeleton height={32} variant="rounded" />
      ) : pulseMembers.length === 0 ? (
        <Typography>{t('no_members_found')}</Typography>
      ) : (
        <>
          <Stack direction="row" spacing={2}>
            <TextField
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder={t('search_member')}
              size="small"
              sx={{ flexGrow: 1 }}
              value={filters.searchQuery}
            />
            <Stack alignItems="center" direction="row" spacing={2}>
              <FilterAltOutlined />
              <Typography>{t('filter')}</Typography>
            </Stack>
            <Select
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  roleFilter: e.target.value as PulseMemberRole | 'ALL',
                }))
              }
              size="small"
              sx={{ minWidth: 120 }}
              value={filters.roleFilter}
            >
              <MenuItem value="ALL">All</MenuItem>
              {Object.values(PulseMemberRole).map((role) => (
                <MenuItem key={role} value={role}>
                  {toTitleCase(role)}
                </MenuItem>
              ))}
            </Select>
          </Stack>
          {filteredMembers.length === 0 ? (
            <Typography>{t('no_members_found', { ns: 'pulse' })}</Typography>
          ) : (
            <Stack divider={<Divider />} spacing={0.5}>
              {filteredMembers.map((member) => (
                <TeamListItem
                  key={member.id}
                  member={member}
                  onDelete={() => handleDeleteClick(member)}
                  onRoleChange={handleRoleChange}
                />
              ))}
            </Stack>
          )}
        </>
      )}

      <CustomModalWithSubmit
        isOpen={showDeleteModal}
        onCancel={handleCancelDelete}
        onClose={handleCancelDelete}
        onSubmit={handleConfirmDelete}
        submitText={t('delete')}
        title={t('delete_member', { ns: 'pulse' })}
        type="warning"
      >
        <Stack spacing={2}>
          <Stack alignItems="center" justifyContent="center">
            <Typography color="text.primary">
              {currentUser?.id === memberToDelete?.userId
                ? t('delete_self_confirmation', { ns: 'pulse' })
                : t('delete_member_confirmation', { ns: 'pulse' })}
            </Typography>
            <Typography color="text.secondary">
              {currentUser?.id === memberToDelete?.userId
                ? t('delete_self_confirmation_description', { ns: 'pulse' })
                : t('delete_member_confirmation_description', { ns: 'pulse' })}
            </Typography>
          </Stack>
        </Stack>
      </CustomModalWithSubmit>
    </Stack>
  )
}
