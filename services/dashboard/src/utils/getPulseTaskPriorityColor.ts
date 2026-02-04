import { TaskPriority } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

export const getPulseTaskPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.High:
      return theme.palette.common.dandelion
    case TaskPriority.Low:
      return theme.palette.common.lime
    case TaskPriority.Medium:
      return theme.palette.text.primary
    case TaskPriority.Urgent:
      return theme.palette.common.cherry
    default:
      return 'inherit'
  }
}
