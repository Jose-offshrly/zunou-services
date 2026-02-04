import { Typography } from '@mui/material'
import { Task, TaskStatus } from '@zunou-graphql/core/graphql'

export const TasksCompletionCount = ({ tasks }: { tasks?: Task[] | null }) => {
  if (!tasks) return

  const completedTasksCount = tasks.filter(
    ({ status }) => status === TaskStatus.Completed,
  ).length

  const totalTasksCount = tasks.length

  return (
    <Typography variant="caption">
      {completedTasksCount} / {totalTasksCount}
    </Typography>
  )
}
