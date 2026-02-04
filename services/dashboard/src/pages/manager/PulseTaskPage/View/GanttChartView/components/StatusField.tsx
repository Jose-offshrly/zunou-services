import { Task, TaskStatus, TaskType } from '@zunou-graphql/core/graphql'
import { Chip } from '@zunou-react/components/form'
import { memo } from 'react'

import { getPulseTaskStatusColor } from '~/utils/getPulseTaskColor'

interface StatusFieldProps {
  task: Task
  disabled?: boolean
  onClick: (e: React.MouseEvent<HTMLElement>) => void
}

// Static styles moved outside component
const chipSx = {
  '&:hover': {
    opacity: 0.9,
  },
  borderRadius: 9999,
  cursor: 'pointer',
  fontSize: 10,
}

const formatTaskStatus = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Todo:
      return 'To Do'
    case TaskStatus.Inprogress:
      return 'In Progress'
    case TaskStatus.Completed:
      return 'Completed'
    case TaskStatus.Overdue:
      return 'Overdue'
    default:
      return status
  }
}

export const StatusField = memo(
  ({ task, disabled = false, onClick }: StatusFieldProps) => {
    if (task.type !== TaskType.Task) {
      return <>-</>
    }

    // Use custom status if available, otherwise fall back to default status
    const statusLabel =
      task.taskStatus?.label ||
      (task.status ? formatTaskStatus(task.status as TaskStatus) : '')
    const statusColor =
      task.taskStatus?.color ||
      (task.status ? getPulseTaskStatusColor(task.status as TaskStatus) : null)

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      if (disabled) return
      onClick(e)
    }

    return (
      <Chip
        label={statusLabel}
        onClick={handleClick}
        size="small"
        sx={{
          ...chipSx,
          ...(statusColor && { backgroundColor: statusColor, color: 'white' }),
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    )
  },
)
