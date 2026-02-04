import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'

import {
  ItemStatus,
  Person,
  TaskPriority as TimelineTaskPriority,
  TaskReference,
  TaskType as TimelineTaskType,
  TimelineItem,
} from '../types/types'

/**
 * Maps GraphQL TaskStatus to Timeline ItemStatus
 */
export const mapTaskStatusToItemStatus = (
  status: TaskStatus | null | undefined,
): ItemStatus => {
  switch (status) {
    case TaskStatus.Todo:
      return 'not-started'
    case TaskStatus.Inprogress:
      return 'in-progress'
    case TaskStatus.Completed:
      return 'completed'
    case TaskStatus.Overdue:
      return 'overdue'
    default:
      return 'not-started'
  }
}

/**
 * Maps Timeline ItemStatus to GraphQL TaskStatus
 */
export const mapItemStatusToTaskStatus = (
  status: ItemStatus,
): TaskStatus | null => {
  switch (status) {
    case 'not-started':
      return TaskStatus.Todo
    case 'in-progress':
      return TaskStatus.Inprogress
    case 'completed':
      return TaskStatus.Completed
    case 'overdue':
      return TaskStatus.Overdue
    default:
      return null
  }
}

/**
 * Maps GraphQL TaskPriority to Timeline TaskPriority
 */
export const mapTaskPriority = (
  priority: TaskPriority | null | undefined,
): TimelineTaskPriority | undefined => {
  if (!priority) return undefined
  return priority as TimelineTaskPriority
}

/**
 * Maps GraphQL TaskType to Timeline TaskType
 */
export const mapTaskType = (
  type: TaskType | null | undefined,
): TimelineTaskType | undefined => {
  if (!type) return undefined
  return type as TimelineTaskType
}

/**
 * Flattens a tree of tasks (including children) into a flat array
 * This ensures all child tasks are included when converting to timeline items
 */
export const flattenTasks = (tasks: Task[]): Task[] => {
  const result: Task[] = []

  const traverse = (task: Task) => {
    result.push(task)
    if (task.children && task.children.length > 0) {
      task.children.forEach((child) => traverse(child))
    }
  }

  tasks.forEach((task) => traverse(task))
  return result
}

/**
 * Converts Task assignees to Person array
 */
export const convertAssigneesToPersons = (
  assignees: Task['assignees'],
): Person[] => {
  if (!assignees || assignees.length === 0) return []
  return assignees.map((assignee) => ({
    avatar: assignee.user?.gravatar || '',
    email: assignee.user?.email || '',
    id: assignee.user?.id || assignee.id,
    name: assignee.user?.name || assignee.user?.email || 'Unknown',
  }))
}

/**
 * Converts a GraphQL Task to a TimelineItem
 */
export const taskToTimelineItem = (
  task: Task,
  organizationId: string,
): TimelineItem => {
  const assignees = convertAssigneesToPersons(task.assignees)
  const owner = assignees.length > 0 ? assignees[0] : undefined

  // Parse due_date to startDate/endDate
  // Tasks should span from start to end date, not appear as milestones
  const dueDate = task.due_date
    ? (() => {
        const date = new Date(task.due_date)
        return !isNaN(date.getTime()) ? date : null
      })()
    : null
  const createdAt = (() => {
    const date = new Date(task.createdAt)
    return !isNaN(date.getTime()) ? date : new Date() // Fallback to current date if invalid
  })()

  let startDate: Date | null = null
  let endDate: Date | null = null

  if (dueDate) {
    // Use dueDate as endDate
    endDate = dueDate

    // Calculate startDate: use createdAt if it's before dueDate, otherwise use dueDate - 1 day
    // This ensures tasks span at least 1 day
    const oneDayBeforeDue = new Date(dueDate)
    oneDayBeforeDue.setDate(oneDayBeforeDue.getDate() - 1)

    // Use the earlier of createdAt or one day before due date
    startDate = createdAt < oneDayBeforeDue ? createdAt : oneDayBeforeDue
  } else {
    // If no due date, use createdAt as startDate and calculate endDate
    startDate = createdAt
    const defaultEndDate = new Date(createdAt)
    defaultEndDate.setDate(defaultEndDate.getDate() + 1) // Default 1-day duration
    endDate = defaultEndDate
  }

  const taskReference: TaskReference = {
    entityId: task.entity_id,
    entityType: task.entity_type,
    organizationId,
    parentTaskId: task.parent?.id,
    taskId: task.id,
    taskNumber: task.task_number || undefined,
  }

  return {
    assignees,
    categoryId: task.category?.id,
    color: undefined, // Tasks don't have color in GraphQL schema
    createdAt,
    description: task.description || undefined,
    duration:
      startDate && endDate
        ? Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          )
        : undefined,
    endDate,
    id: task.id,
    isMilestone: false, // Tasks are not milestones by default
    linkedTaskIds: [], // Will be populated by linking logic
    name: task.title,
    owner,
    phase: undefined, // Phase is timeline-specific, not in Task
    priority: mapTaskPriority(task.priority),
    progress: task.status === TaskStatus.Completed ? 100 : undefined,
    startDate,
    status: mapTaskStatusToItemStatus(task.status),
    taskReference,
    taskType: mapTaskType(task.type),
    updatedAt: (() => {
      const date = new Date(task.updatedAt)
      return !isNaN(date.getTime()) ? date : new Date() // Fallback to current date if invalid
    })(),
  }
}

/**
 * Converts a TimelineItem to Task creation input (for CreateTaskInput)
 */
export const timelineItemToTaskInput = (
  item: Omit<TimelineItem, 'id' | 'createdAt' | 'updatedAt'>,
  organizationId: string,
  entityId: string,
  entityType = 'PULSE',
): {
  assignees?: string[]
  category_id?: string
  description?: string
  due_date?: string
  entity_id: string
  entity_type: string
  organization_id: string
  parent_id?: string
  priority?: TaskPriority
  status?: TaskStatus
  task_type: TaskType
  title: string
} => {
  const assigneeIds =
    item.assignees?.map((a) => a.id) || item.owner?.id
      ? [item.owner!.id]
      : undefined

  return {
    assignees: assigneeIds,
    category_id: item.categoryId,
    description: item.description,
    due_date: item.endDate
      ? item.endDate.toISOString().split('T')[0]
      : item.startDate
        ? item.startDate.toISOString().split('T')[0]
        : undefined,
    entity_id: entityId,
    entity_type: entityType,
    organization_id: organizationId,
    parent_id: item.taskReference?.parentTaskId,
    priority: item.priority as TaskPriority | undefined,
    status: item.status ? mapItemStatusToTaskStatus(item.status)! : undefined,
    task_type: (item.taskType as TaskType) || TaskType.Task,
    title: item.name,
  }
}

/**
 * Creates a milestone TimelineItem (not linked to a Task)
 */
export const createMilestoneItem = (
  name: string,
  date: Date,
  owner?: Person,
): Omit<TimelineItem, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    assignees: owner ? [owner] : undefined,
    color: undefined,
    description: undefined,
    endDate: null,
    isMilestone: true,
    linkedTaskIds: [],
    name,
    owner,
    phase: undefined,
    progress: undefined,
    startDate: date,
    status: 'not-started',
  }
}

/**
 * Links a task ID to a timeline item
 */
export const linkTaskToTimelineItem = (
  item: TimelineItem,
  taskId: string,
): TimelineItem => {
  const linkedTaskIds = item.linkedTaskIds || []
  if (!linkedTaskIds.includes(taskId)) {
    return {
      ...item,
      linkedTaskIds: [...linkedTaskIds, taskId],
    }
  }
  return item
}

/**
 * Unlinks a task ID from a timeline item
 */
export const unlinkTaskFromTimelineItem = (
  item: TimelineItem,
  taskId: string,
): TimelineItem => {
  const linkedTaskIds = item.linkedTaskIds || []
  return {
    ...item,
    linkedTaskIds: linkedTaskIds.filter((id) => id !== taskId),
  }
}
