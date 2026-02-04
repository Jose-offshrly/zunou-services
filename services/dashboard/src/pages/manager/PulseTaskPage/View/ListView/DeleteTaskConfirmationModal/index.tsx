import { CalendarTodayOutlined, Flag } from '@mui/icons-material'
import { Divider, Stack, SvgIcon, Typography } from '@mui/material'
import { TaskStatus } from '@zunou-graphql/core/graphql'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { getPulseTaskStatusColor } from '~/utils/getPulseTaskColor'
import { getPulseTaskPriorityColor } from '~/utils/getPulseTaskPriorityColor'
import { toTitleCase } from '~/utils/toTitleCase'

import { TaskStatusIconMap } from '../CreateTaskForm/StatusDropdown'
import { PulseTaskAssigneesGroup } from '../PulseTaskAssigneesGroup'
import { TaskItem } from '../TaskItem'

interface DeleteTaskConfirmationModal {
  isLoading: boolean
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  task: TaskItem
}

export const DeleteTaskConfirmationModal = ({
  isLoading,
  isOpen,
  onClose,
  onSubmit,
  task,
}: DeleteTaskConfirmationModal) => {
  const { t } = useTranslation(['common', 'tasks'])

  const { assignees, description, dueDate, title, priority, status } = task
  return (
    <CustomModalWithSubmit
      isOpen={isOpen}
      isSubmitting={isLoading}
      onCancel={onClose}
      onClose={onClose}
      onSubmit={onSubmit}
      submitText={t('delete')}
      title={t('delete_task', { ns: 'tasks' })}
      type="warning"
    >
      <Stack spacing={2}>
        <Typography
          sx={{ color: 'text.secondary' }}
          textAlign="start"
          variant="body2"
        >
          {t('delete_task_confirmation', { ns: 'tasks' })}
        </Typography>
        <Stack
          borderRadius={1}
          padding={2}
          sx={{ border: 1, borderColor: 'divider' }}
        >
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={2}>
              <SvgIcon
                component={
                  TaskStatusIconMap[(status ?? TaskStatus.Todo) as TaskStatus]
                }
                fontSize="small"
                sx={{
                  color: getPulseTaskStatusColor(
                    (status ?? TaskStatus.Todo) as TaskStatus,
                  ),
                }}
              />
              <Stack spacing={1}>
                <Stack>
                  <Typography color="text.primary" variant="body1">
                    {title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {description}
                  </Typography>
                </Stack>
                <Stack
                  direction="row"
                  divider={
                    <Divider orientation="vertical" sx={{ height: 'auto' }} />
                  }
                  flex={1}
                  spacing={2}
                >
                  {dueDate && (
                    <Stack direction="row" spacing={1}>
                      <CalendarTodayOutlined fontSize="small" />
                      <Typography fontSize={14}>
                        {dayjs(dueDate).format('MMM D')}
                      </Typography>
                    </Stack>
                  )}
                  {priority && (
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ color: getPulseTaskPriorityColor(priority) }}
                    >
                      <Flag fontSize="small" />
                      <Typography fontSize={14}>
                        {toTitleCase(priority)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Stack>
            <PulseTaskAssigneesGroup assignees={assignees} />
          </Stack>
        </Stack>
      </Stack>
    </CustomModalWithSubmit>
  )
}
