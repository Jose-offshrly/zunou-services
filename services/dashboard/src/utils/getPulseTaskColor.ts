import { TaskStatus } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

export const getPulseTaskStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.Completed:
      return theme.palette.common.lime
    case TaskStatus.Inprogress:
      return theme.palette.common.dandelion
    case TaskStatus.Todo:
      return theme.palette.text.primary
    case TaskStatus.Overdue:
      return theme.palette.error.main
    default:
      return 'inherit'
  }
}
