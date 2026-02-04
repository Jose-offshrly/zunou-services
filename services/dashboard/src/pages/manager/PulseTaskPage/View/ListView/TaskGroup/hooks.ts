import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQueryClient } from '@tanstack/react-query'
import {
  Assignee,
  Task,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useDeleteTaskMutation } from '@zunou-queries/core/hooks/useDeleteTaskMutation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useTaskStore } from '~/store/useTaskStore'
import { isMobileDevice } from '~/utils/mobileDeviceUtils'

type Props = Pick<Task, 'id'> & {
  subtasks: Task['children']
  isOverlay: boolean
  title: string
}

export const useHooks = ({ id, subtasks, isOverlay, title }: Props) => {
  const { t } = useTranslation('tasks')
  const queryClient = useQueryClient()

  const [isTaskListActionShow, setIsTaskListActionShow] =
    useState(isMobileDevice())
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false)
  const [isUsingMobileDevice, setIsUsingMobileDevice] = useState(false)

  const { isUpdatingTaskOrder, isTaskFilterActive } = useTaskStore()

  useEffect(() => {
    setIsUsingMobileDevice(isMobileDevice())
  }, [setIsUsingMobileDevice])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    data: { title, type: TaskType.List },
    disabled: isUpdatingTaskOrder,
    id,
  })

  useEffect(() => {
    const handleResize = () => {
      // Show actions if in mobile mode by default
      setIsTaskListActionShow(isMobileDevice())
      setIsUsingMobileDevice(isMobileDevice())
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const sortableStyle: React.CSSProperties = {
    boxShadow: isOverlay ? '0 5px 10px rgba(0, 0, 0, 0.2)' : 'none',
    cursor: isOverlay ? 'grabbing' : 'pointer',
    position: 'relative',
    transform: CSS.Transform.toString(transform),
    transition,
    userSelect: 'none',
    visibility: !isOverlay && isDragging ? 'hidden' : 'visible',
    zIndex: transform ? 999 : 'auto',
  }

  const { mutate: deleteTask, isPending: isPendingDeleteTask } =
    useDeleteTaskMutation({ coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL })

  const taskListStatus = (() => {
    if (!subtasks?.length) return TaskStatus.Todo

    const taskStatuses = new Set(subtasks.map((s) => s.status))

    if (taskStatuses.has(TaskStatus.Inprogress)) return TaskStatus.Inprogress
    if (taskStatuses.size === 1)
      return taskStatuses.values().next().value as TaskStatus

    return TaskStatus.Todo
  })()

  const groupedDueDate = subtasks?.reduce<Date | null>((acc, curr) => {
    const dueDateStr = curr.due_date

    if (!dueDateStr) return acc

    const dueDate = new Date(dueDateStr)

    if (isNaN(dueDate.getTime())) return acc

    if (!acc) return dueDate

    return dueDate > acc ? dueDate : acc
  }, null)

  const groupedAssignees: Assignee[] = Array.from(
    subtasks
      ?.reduce((acc, curr) => {
        curr.assignees?.forEach((assignee) => {
          acc.set(assignee.user.id, assignee)
        })
        return acc
      }, new Map<string, Assignee>())
      ?.values() || [],
  )

  const groupedTaskPriorityMap =
    subtasks?.reduce(
      (acc, curr) => {
        const { priority } = curr

        if (!priority) return acc

        if (!acc[priority]) {
          acc[priority] = 0
        }

        acc[priority] += 1
        return acc
      },
      {} as Record<TaskPriority, number>,
    ) || {}

  const groupedSubtaskPriorities = Object.entries(groupedTaskPriorityMap).map(
    ([priority, count]) => ({
      count: count as number,
      priority: priority as TaskPriority,
    }),
  )

  const handleOpenDeleteTaskListConfirmationModal = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation()
    setIsDeleteConfirmationOpen(true)
  }

  const handleCloseDeleteTaskListConfirmationModal = () => {
    setIsDeleteConfirmationOpen(false)
  }

  const handleDeleteTask = () => {
    deleteTask(
      {
        id,
      },
      {
        onError: () => toast.error(t('task_deletion_error')),
        onSettled: () => setIsDeleteConfirmationOpen(false),
        onSuccess: async () => {
          toast.success(t('task_deletion_success'))

          await queryClient.invalidateQueries({
            queryKey: ['tasks'],
          })
        },
      },
    )
  }

  // Check if drag should be disabled
  const isDragDisabled =
    isUpdatingTaskOrder ||
    taskListStatus === TaskStatus.Completed ||
    isTaskFilterActive

  return {
    attributes,
    groupedAssignees,
    groupedDueDate,
    groupedSubtaskPriorities,
    handleCloseDeleteTaskListConfirmationModal,
    handleDeleteTask,
    handleOpenDeleteTaskListConfirmationModal,
    isDeleteConfirmationOpen,
    isDragDisabled,
    isDragging,
    isPendingDeleteTask,
    isTaskFilterActive,
    isTaskListActionShow,
    isUsingMobileDevice,
    listeners,
    setIsTaskListActionShow,
    setNodeRef,
    sortableStyle,
    taskListStatus,
  }
}
