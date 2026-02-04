import { ArrowOutwardOutlined, Circle, Flag } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { TaskPriority, TaskStatus } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

import { useVitalsContext } from '~/context/VitalsContext'
import { TaskStatusIndicator } from '~/pages/manager/PulseTaskPage/View/ListView/TaskStatusIndicator'
import { getPulseTaskPriorityColor } from '~/utils/getPulseTaskPriorityColor'
import { toTitleCase } from '~/utils/toTitleCase'

interface TaskCardProps {
  pulseName: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  desc?: string
  onRedirect?: () => void
}

const TaskCard = ({
  pulseName,
  title,
  priority,
  status,
  dueDate,
  desc,
  onRedirect,
}: TaskCardProps) => {
  const { t } = useTranslation('vitals')
  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'

  return (
    <Stack gap={2} height="80%" overflow="auto">
      <Stack
        gap={2}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2,
        }}
      >
        {/* Pulse */}
        <Stack
          alignItems="center"
          direction="row"
          gap={1}
          justifyContent="space-between"
        >
          <Stack alignItems="center" direction="row" gap={1}>
            <Avatar placeholder={pulseName} size="small" />
            <Typography variant="body2">
              {t('assigned_tasks_on')}{' '}
              <Typography component="span" fontWeight="bold" variant="body2">
                {pulseName}
              </Typography>
            </Typography>
          </Stack>
          <IconButton onClick={() => onRedirect?.()}>
            <ArrowOutwardOutlined color="secondary" fontSize="small" />
          </IconButton>
        </Stack>
        {/* Task Title */}
        <Stack>
          <Typography variant="body2">{title}</Typography>
        </Stack>
        {/* Task Metadata */}
        <Stack
          alignItems="center"
          direction="row"
          divider={
            <Circle
              sx={{
                color: 'divider',
                fontSize: 5,
              }}
            />
          }
          flexWrap="wrap"
          gap={1}
        >
          {/* Priority */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              color:
                isDarkMode && priority === TaskPriority.Medium
                  ? 'text.secondary'
                  : getPulseTaskPriorityColor(priority),
            }}
          >
            <Flag fontSize="small" />
            <Typography variant="caption">{toTitleCase(priority)}</Typography>
          </Stack>

          {/* Status */}
          {status && <TaskStatusIndicator size="small" status={status} />}

          {/* Due Date */}
          {dueDate && (
            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography color="text.secondary" variant="caption">
                {dayjs(dueDate).format('MMM D, YYYY')}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
      <Stack pb={2}>
        <Typography color="text.secondary" variant="caption">
          {desc || 'No Description.'}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default TaskCard
