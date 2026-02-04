import { Task, TaskStatusType, TaskType } from '@zunou-graphql/core/graphql'
import {
  isSameMonth,
  isSameWeek,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'

export type GroupByField = 'status' | 'priority' | 'assignee' | 'dueDate' | null
export type SortByField = 'status' | 'priority' | 'dueDate' | null
export type SortDirection = 'asc' | 'desc'

export interface TaskSortConfig {
  field: SortByField
  direction: SortDirection
}

export interface TaskGroup {
  groupKey: string
  groupLabel: string
  tasks: Task[]
  color?: string
}

/**
 * Groups tasks by the specified field
 * Only groups child tasks, not task lists themselves
 */
export const groupTasks = (
  tasks: Task[],
  groupBy: GroupByField,
  sortDirection?: SortDirection,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): TaskGroup[] => {
  if (!groupBy) {
    return [{ groupKey: 'all', groupLabel: 'All Tasks', tasks }]
  }

  const taskMap = new Map<string, Task[]>()

  // assign tasks to each group
  tasks.forEach((task) => {
    const keys = getGroupKeys(task, groupBy, isUsingCustomStatuses)
    keys.forEach((key) => {
      if (!taskMap.has(key)) {
        taskMap.set(key, [])
      }
      taskMap.get(key)!.push(task)
    })
  })

  // regroup tasks with key and label
  const groups: TaskGroup[] = []
  taskMap.forEach((tasks, key) => {
    const label = getGroupLabel(
      key,
      groupBy,
      isUsingCustomStatuses,
      customStatuses,
    )
    const color = getGroupColor(
      key,
      groupBy,
      isUsingCustomStatuses,
      customStatuses,
    )
    groups.push({
      color,
      groupKey: key,
      groupLabel: label,
      tasks,
    })
  })

  return sortGroups(
    groups,
    groupBy,
    sortDirection,
    isUsingCustomStatuses,
    customStatuses,
  )
}

// get unique group keys based on grouping field (status, priority, assignee, due date)
const getGroupKeys = (
  task: Task,
  groupBy: GroupByField,
  isUsingCustomStatuses?: boolean,
): string[] => {
  switch (groupBy) {
    case 'status':
      // For custom statuses, use task_status_id; for default, use status
      if (isUsingCustomStatuses) {
        return [task.task_status_id || 'NO_STATUS']
      }
      return [task.status || 'NO_STATUS']
    case 'priority':
      return [task.priority || 'NO_PRIORITY']
    case 'assignee':
      if (task.assignees && task.assignees.length > 0) {
        return task.assignees.map((a) => a.user.name)
      }
      return ['UNASSIGNED']
    case 'dueDate':
      return [getDueDateGroup(task.due_date)]
    default:
      return ['ALL']
  }
}

const getGroupLabel = (
  key: string,
  groupBy: GroupByField,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): string => {
  switch (groupBy) {
    case 'status':
      return getStatusLabel(key, isUsingCustomStatuses, customStatuses)
    case 'priority':
      return getPriorityLabel(key)
    case 'assignee':
      if (key === 'UNASSIGNED') return 'Unassigned'
      return key
    case 'dueDate':
      return getDueDateLabel(key)
    default:
      return 'All Tasks'
  }
}

// for styling if necessary
const getGroupColor = (
  key: string,
  groupBy: GroupByField,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): string | undefined => {
  switch (groupBy) {
    case 'status':
      return getStatusColor(key, isUsingCustomStatuses, customStatuses)
    case 'priority':
      return getPriorityColor(key)
    default:
      return undefined
  }
}

// sort groups based on predefined order for certain fields
const sortGroups = (
  groups: TaskGroup[],
  groupBy: GroupByField,
  sortDirection?: SortDirection,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): TaskGroup[] => {
  switch (groupBy) {
    case 'status':
      return sortByStatusOrder(
        groups,
        sortDirection,
        isUsingCustomStatuses,
        customStatuses,
      )
    case 'priority':
      return sortByPriorityOrder(groups, sortDirection)
    case 'dueDate':
      return sortByDueDateOrder(groups, sortDirection)
    case 'assignee':
      return [...groups].sort((a, b) => {
        if (a.groupKey === 'UNASSIGNED') return 1
        if (b.groupKey === 'UNASSIGNED') return -1
        return a.groupLabel.localeCompare(b.groupLabel)
      })
    default:
      return groups
  }
}

const sortByStatusOrder = (
  groups: TaskGroup[],
  sortDirection?: SortDirection,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): TaskGroup[] => {
  // sort custom statuses by their position
  if (isUsingCustomStatuses) {
    if (customStatuses && customStatuses.length > 0) {
      const sortedCustomStatuses = [...customStatuses].sort(
        (a, b) => (a.position ?? 999) - (b.position ?? 999),
      )

      const orderMap = new Map<string, number>()
      sortedCustomStatuses.forEach((status, index) => {
        orderMap.set(status.id, index)
      })

      // sort groups
      const sortedGroups = [...groups].sort((a, b) => {
        const aOrder = orderMap.has(a.groupKey)
          ? orderMap.get(a.groupKey)!
          : 999
        const bOrder = orderMap.has(b.groupKey)
          ? orderMap.get(b.groupKey)!
          : 999
        const result = aOrder - bOrder
        return sortDirection === 'desc' ? -result : result
      })

      return sortedGroups
    }
    return [...groups]
  }

  // For default statuses, use predefined order
  const order = ['TODO', 'INPROGRESS', 'COMPLETED', 'OVERDUE', 'NO_STATUS']
  return [...groups].sort((a, b) => {
    const aIndex = order.indexOf(a.groupKey)
    const bIndex = order.indexOf(b.groupKey)
    const result = aIndex - bIndex
    return sortDirection === 'desc' ? -result : result
  })
}

const sortByPriorityOrder = (
  groups: TaskGroup[],
  sortDirection?: SortDirection,
): TaskGroup[] => {
  const descendingOrder = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY']
  const ascendingOrder = ['NO_PRIORITY', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']

  const order = sortDirection === 'asc' ? ascendingOrder : descendingOrder

  return [...groups].sort((a, b) => {
    const aIndex = order.indexOf(a.groupKey)
    const bIndex = order.indexOf(b.groupKey)
    return aIndex - bIndex
  })
}

const sortByDueDateOrder = (
  groups: TaskGroup[],
  sortDirection?: SortDirection,
): TaskGroup[] => {
  const order = [
    'OVERDUE',
    'TODAY',
    'THIS_WEEK',
    'THIS_MONTH',
    'LATER',
    'NO_DUE_DATE',
  ]
  return [...groups].sort((a, b) => {
    const aIndex = order.indexOf(a.groupKey)
    const bIndex = order.indexOf(b.groupKey)
    const result = aIndex - bIndex
    return sortDirection === 'desc' ? -result : result
  })
}

const getStatusLabel = (
  status: string,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): string => {
  // get labels from custom statuses if applicable
  if (isUsingCustomStatuses && customStatuses) {
    const customStatus = customStatuses.find((s) => s.id === status)
    if (customStatus) {
      return customStatus.label
    }
  }

  // predefined labels for Default statuses
  const labels: Record<string, string> = {
    COMPLETED: 'Completed',
    INPROGRESS: 'In Progress',
    NO_STATUS: 'No Status',
    OVERDUE: 'Overdue',
    TODO: 'To Do',
  }
  return labels[status] || status
}

const getStatusColor = (
  status: string,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): string => {
  // get colors from custom statuses if applicable
  if (isUsingCustomStatuses && customStatuses) {
    const customStatus = customStatuses.find((s) => s.id === status)
    if (customStatus && customStatus.color) {
      return customStatus.color
    }
  }

  // colors for Default statuses
  const colors: Record<string, string> = {
    COMPLETED: '#4CAF50',
    INPROGRESS: '#2196F3',
    NO_STATUS: '#BDBDBD',
    OVERDUE: '#f44336',
    TODO: '#9E9E9E',
  }
  return colors[status] || '#9E9E9E'
}

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    HIGH: 'High',
    LOW: 'Low',
    MEDIUM: 'Medium',
    NO_PRIORITY: 'No Priority',
    URGENT: 'Urgent',
  }
  return labels[priority] || priority
}

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    HIGH: '#f57c00',
    LOW: '#388e3c',
    MEDIUM: '#fbc02d',
    NO_PRIORITY: '#9e9e9e',
    URGENT: '#d32f2f',
  }
  return colors[priority] || '#9e9e9e'
}

const getDueDateGroup = (dueDate: string | null | undefined): string => {
  if (!dueDate) return 'NO_DUE_DATE'

  try {
    const date = parseISO(dueDate)
    if (!isValid(date)) return 'NO_DUE_DATE'

    const today = startOfDay(new Date())
    const taskDate = startOfDay(date)
    const diffInDays = Math.ceil(
      (taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diffInDays < 0) return 'OVERDUE'
    if (diffInDays === 0) return 'TODAY'
    if (isSameWeek(taskDate, today, { weekStartsOn: 0 })) return 'THIS_WEEK'
    if (isSameMonth(taskDate, today)) return 'THIS_MONTH'
    return 'LATER'
  } catch (error) {
    return 'NO_DUE_DATE'
  }
}

const getDueDateLabel = (key: string): string => {
  const labels: Record<string, string> = {
    LATER: 'Later',
    NO_DUE_DATE: 'No Due Date',
    OVERDUE: 'Overdue',
    THIS_MONTH: 'This Month',
    THIS_WEEK: 'This Week',
    TODAY: 'Today',
  }
  return labels[key] || key
}

export const getAllChildrenTasks = (tasks: Task[]): Task[] => {
  const children: Task[] = []

  tasks.forEach((task) => {
    if (task.children && task.children.length > 0) {
      children.push(...task.children)
      // Recursively get children of children
      children.push(...getAllChildrenTasks(task.children))
    }
  })

  return children
}

// sorts tasks by the specified field and direction
export const sortTasks = (
  tasks: Task[],
  sortConfig: TaskSortConfig | null,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): Task[] => {
  if (!sortConfig?.field) {
    return tasks
  }

  const { field, direction } = sortConfig
  const sortedTasks = [...tasks]

  switch (field) {
    case 'status':
      return sortByStatus(
        sortedTasks,
        direction,
        isUsingCustomStatuses,
        customStatuses,
      )
    case 'priority':
      return sortByPriority(sortedTasks, direction)
    case 'dueDate':
      return sortByDueDate(sortedTasks, direction)
    default:
      return sortedTasks
  }
}

/**
 * get a task list's most active status based on its children
 * For default statuses: INPROGRESS > TODO > OVERDUE > COMPLETED > NO_STATUS
 * For custom statuses: uses position field (lower position = more active)
 */
const getEffectiveStatus = (
  task: Task,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): string => {
  if (
    task.type !== TaskType.List ||
    !task.children ||
    task.children.length === 0
  ) {
    if (isUsingCustomStatuses) {
      return task.task_status_id || 'NO_STATUS'
    }
    return task.status || 'NO_STATUS'
  }

  // find lowest status among child tasks and set that as the list's active status
  if (isUsingCustomStatuses && customStatuses) {
    const positionMap = new Map<string, number>()
    customStatuses.forEach((status) => {
      positionMap.set(status.id, status.position ?? 999)
    })

    let mostActiveStatusId = 'NO_STATUS'
    let lowestPosition = Infinity

    for (const child of task.children) {
      const childStatusId = child.task_status_id || 'NO_STATUS'
      const position = positionMap.get(childStatusId) ?? 999
      if (position < lowestPosition) {
        lowestPosition = position
        mostActiveStatusId = childStatusId
      }
    }

    return mostActiveStatusId
  }

  // order for Default statuses
  const activeStatusOrder = [
    'INPROGRESS',
    'TODO',
    'OVERDUE',
    'COMPLETED',
    'NO_STATUS',
  ]

  let mostActiveIndex = activeStatusOrder.length - 1

  for (const child of task.children) {
    const childStatus = child.status || 'NO_STATUS'
    const childIndex = activeStatusOrder.indexOf(childStatus)
    if (childIndex !== -1 && childIndex < mostActiveIndex) {
      mostActiveIndex = childIndex
    }
  }

  return activeStatusOrder[mostActiveIndex]
}

/**
 * Sort by status
 * For default statuses:
 *   - Ascending: TODO → INPROGRESS → COMPLETED → OVERDUE → NO_STATUS
 *   - Descending: Reverse order
 * For custom statuses:
 *   - Ascending: First status (lowest position) → Last status (highest position)
 *   - Descending: Reverse order
 * Task lists are sorted based on their children's most active status
 */
const sortByStatus = (
  tasks: Task[],
  direction: SortDirection,
  isUsingCustomStatuses?: boolean,
  customStatuses?: TaskStatusType[],
): Task[] => {
  // sort by position for custom statuses
  if (isUsingCustomStatuses) {
    if (customStatuses && customStatuses.length > 0) {
      const sortedCustomStatuses = [...customStatuses].sort(
        (a, b) => (a.position ?? 999) - (b.position ?? 999),
      )

      const orderMap = new Map<string, number>()
      sortedCustomStatuses.forEach((status, index) => {
        orderMap.set(status.id, index)
      })

      return [...tasks].sort((a, b) => {
        const statusA = getEffectiveStatus(
          a,
          isUsingCustomStatuses,
          customStatuses,
        )
        const statusB = getEffectiveStatus(
          b,
          isUsingCustomStatuses,
          customStatuses,
        )

        const orderA = orderMap.has(statusA) ? orderMap.get(statusA)! : 999
        const orderB = orderMap.has(statusB) ? orderMap.get(statusB)! : 999

        return direction === 'asc' ? orderA - orderB : orderB - orderA
      })
    }
    return [...tasks]
  }

  // predefined order for Default statuses
  const statusOrder = [
    'TODO',
    'INPROGRESS',
    'COMPLETED',
    'OVERDUE',
    'NO_STATUS',
  ]

  return [...tasks].sort((a, b) => {
    const statusA = getEffectiveStatus(a)
    const statusB = getEffectiveStatus(b)

    const indexA = statusOrder.indexOf(statusA)
    const indexB = statusOrder.indexOf(statusB)

    // handle unknown statuses by putting them at the end
    const effectiveIndexA = indexA === -1 ? statusOrder.length : indexA
    const effectiveIndexB = indexB === -1 ? statusOrder.length : indexB

    return direction === 'asc'
      ? effectiveIndexA - effectiveIndexB
      : effectiveIndexB - effectiveIndexA
  })
}

// Determines a task list's priority based on its children (highest to lowest priority)
const getEffectivePriority = (task: Task): string => {
  if (
    task.type !== TaskType.List ||
    !task.children ||
    task.children.length === 0
  ) {
    return task.priority || 'NO_PRIORITY'
  }

  const priorityOrder = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NO_PRIORITY']
  let highestPriorityIndex = priorityOrder.length - 1

  for (const child of task.children) {
    const childPriority = child.priority || 'NO_PRIORITY'
    const childIndex = priorityOrder.indexOf(childPriority)
    if (childIndex !== -1 && childIndex < highestPriorityIndex) {
      highestPriorityIndex = childIndex
    }
  }

  return priorityOrder[highestPriorityIndex]
}

/**
 * Sort by priority
 * Ascending: NO_PRIORITY → LOW → MEDIUM → HIGH → URGENT
 * Descending: URGENT → HIGH → MEDIUM → LOW → NO_PRIORITY
 * Task lists are sorted based on their children's highest priority
 */
const sortByPriority = (tasks: Task[], direction: SortDirection): Task[] => {
  // Order from lowest to highest priority
  const priorityOrder = ['NO_PRIORITY', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']

  return tasks.sort((a, b) => {
    const priorityA = getEffectivePriority(a)
    const priorityB = getEffectivePriority(b)

    const indexA = priorityOrder.indexOf(priorityA)
    const indexB = priorityOrder.indexOf(priorityB)

    // No priority tasks should be placed at the beginning
    const effectiveIndexA = indexA === -1 ? 0 : indexA
    const effectiveIndexB = indexB === -1 ? 0 : indexB

    return direction === 'asc'
      ? effectiveIndexA - effectiveIndexB
      : effectiveIndexB - effectiveIndexA
  })
}

/**
 * Get the effective due date for a task or task list (latest due date among children)
 */
const getEffectiveDueDate = (task: Task): string | null | undefined => {
  if (
    task.type !== TaskType.List ||
    !task.children ||
    task.children.length === 0
  ) {
    return task.due_date
  }

  // For task lists, find the latest due date among children
  let latestDate: Date | null = null
  let latestDateString: string | null = null

  for (const child of task.children) {
    if (child.due_date) {
      try {
        const childDate = parseISO(child.due_date)
        if (isValid(childDate)) {
          if (latestDate === null || childDate > latestDate) {
            latestDate = childDate
            latestDateString = child.due_date
          }
        }
      } catch (error) {
        console.error('Error parsing date: ', error)
      }
    }
  }

  return latestDateString
}

/**
 * Sort by due date (no due date tasks are always placed at the end)
 * Ascending: Earliest due date first, latest last
 * Descending: Latest due date first, earliest last
 */
const sortByDueDate = (tasks: Task[], direction: SortDirection): Task[] => {
  return tasks.sort((a, b) => {
    const dueDateA = getEffectiveDueDate(a)
    const dueDateB = getEffectiveDueDate(b)

    // tasks with no due date always go last, regardless of direction
    if (!dueDateA && !dueDateB) return 0
    if (!dueDateA) return 1
    if (!dueDateB) return -1

    try {
      const dateA = parseISO(dueDateA)
      const dateB = parseISO(dueDateB)

      if (!isValid(dateA) && !isValid(dateB)) return 0
      if (!isValid(dateA)) return 1
      if (!isValid(dateB)) return -1

      const diff = dateA.getTime() - dateB.getTime()

      return direction === 'asc' ? diff : -diff
    } catch {
      return 0
    }
  })
}
