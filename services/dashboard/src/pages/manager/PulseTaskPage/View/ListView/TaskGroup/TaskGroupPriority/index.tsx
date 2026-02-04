import { Flag } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { TaskPriority } from '@zunou-graphql/core/graphql'

import { getPulseTaskPriorityColor } from '~/utils/getPulseTaskPriorityColor'
interface TaskGroupPriorityProps {
  priorities: {
    count: number
    priority: TaskPriority
  }[]
}
export const TaskGroupPriority = ({ priorities }: TaskGroupPriorityProps) => {
  return (
    <Stack direction="row" spacing={1}>
      {priorities.map(({ priority, count }, index) => {
        return (
          <Stack
            direction="row"
            key={index}
            spacing={0.5}
            sx={{
              color: getPulseTaskPriorityColor(priority),
            }}
          >
            <Flag fontSize="small" />
            <Typography fontSize={14}>{count}</Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}
