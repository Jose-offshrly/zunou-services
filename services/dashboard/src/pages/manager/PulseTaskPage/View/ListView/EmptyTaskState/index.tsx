import { Stack, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import { useAccessControl } from '~/hooks/useAccessControl'
import { usePulseStore } from '~/store/usePulseStore'
import { PulsePermissionEnum, PulsePermissionMap } from '~/types/permissions'

import { TaskActionCard } from '../TaskActionCard'

interface EmptyTaskStateProps {
  onOpenCreateTaskListSection: () => void
  onOpenCreateTaskSection: () => void
  onOpenCreateTaskModal: () => void
  onOpenCreateTaskListModal: () => void
}

export const EmptyTaskState = ({
  onOpenCreateTaskListSection: _onOpenCreateTaskListSection,
  onOpenCreateTaskSection: _onOpenCreateTaskSection,
  onOpenCreateTaskModal,
  onOpenCreateTaskListModal,
}: EmptyTaskStateProps) => {
  const { t } = useTranslation(['common', 'tasks'])

  const { checkAccess } = useAccessControl()
  const { pulseMembership } = usePulseStore()

  const rolePermissions = pulseMembership?.role
    ? PulsePermissionMap[pulseMembership.role]
    : []

  const { grant: hasCreateAccess } = checkAccess(
    [
      PulsePermissionEnum.CREATE_PULSE_TASK,
      PulsePermissionEnum.CREATE_PULSE_TASK_LIST,
    ],
    rolePermissions,
  )

  return (
    <Stack
      alignItems="center"
      height="100%"
      justifyContent="center"
      spacing={2}
    >
      {hasCreateAccess ? (
        <>
          <Typography color="text.secondary">
            {t('task_prompt_outro', { ns: 'tasks' })}
          </Typography>
          <Stack direction="row" spacing={2}>
            <TaskActionCard
              description="Create a new milestone item"
              onClick={onOpenCreateTaskModal}
              title="Milestone Items"
            />
            <TaskActionCard
              description="Create a new milestone"
              onClick={onOpenCreateTaskListModal}
              title="Milestone"
            />
          </Stack>
        </>
      ) : (
        <Stack alignItems="center" justifyContent="center" spacing={1}>
          <Typography color="text.primary" fontSize={32} fontWeight={600}>
            {t('empty_task', { ns: 'tasks' })}
          </Typography>
          <Typography color="text.primary">
            {t('task_prompt_intro', { ns: 'tasks' })}
            <span
              style={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
            >
              {' '}
              {t('pulse')} {t('owner')}/{t('admin')}{' '}
            </span>
            {t('to')} {t('task_prompt_outro', { ns: 'tasks' }).toLowerCase()}
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
