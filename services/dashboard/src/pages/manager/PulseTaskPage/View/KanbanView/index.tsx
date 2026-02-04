import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Box, MenuItem, Select, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import {
  PulseCategory,
  Task,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { useUpdateTaskMutation } from '@zunou-queries/core/hooks/useUpdateTaskMutation'
import { useUpdateTaskStatusMutation } from '@zunou-queries/core/hooks/useUpdateTaskStatusMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'

import { AddItemDialog } from '../../components'
import { TaskDetailModal } from '../../components/TaskDetailModal'
import KanbanColumn from './Column'

// Group for tasks without a task list (unassigned)
const UNASSIGNED_KEY = 'unassigned'
const UNASSIGNED_LABEL = 'Unassigned Tasks'
const UNASSIGNED_COLOR = '#6b7280' // gray

// Map TaskStatus to display configuration
const STATUS_CONFIG = {
  [TaskStatus.Todo]: {
    color: theme.palette.text.primary,
    label: 'To Do',
    value: TaskStatus.Todo, // slate
  },
  [TaskStatus.Inprogress]: {
    color: theme.palette.common.dandelion,
    label: 'In Progress',
    value: TaskStatus.Inprogress, // blue
  },
  [TaskStatus.Completed]: {
    color: theme.palette.common.lime,
    label: 'Completed',
    value: TaskStatus.Completed, // green
  },
  [TaskStatus.Overdue]: {
    color: '#ef4444',
    label: 'Overdue',
    value: TaskStatus.Overdue, // red
  },
}

// Define the order of statuses
const STATUS_ORDER = [
  TaskStatus.Todo,
  TaskStatus.Inprogress,
  TaskStatus.Overdue,
  TaskStatus.Completed,
]

export type KanbanViewType = 'status' | 'task-list'

export interface AddItemDialog {
  isOpen: boolean
  initialStatus?: TaskStatus | string | null
  initialParentId?: string | null
}

export const KanbanView = () => {
  const { t } = useTranslation('tasks')
  const { organizationId } = useOrganization()
  const queryClient = useQueryClient()

  const { mutate: updateTaskStatus } = useUpdateTaskStatusMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutate: updateTask } = useUpdateTaskMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { pulseId } = useParams()
  const { pulse } = usePulseStore()
  const { user } = useAuthContext()
  const isPersonalPulse = pulse?.category === PulseCategory.Personal

  const { filters: taskFilters } = useTaskStore()

  const [addItemDialog, setAddItemDialog] = useState<AddItemDialog | null>(null)

  const { data: tasksData, isLoading: isLoadingFilteredTasks } =
    useGetTasksQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
        ...taskFilters,
        ...(isPersonalPulse ? { userId: user?.id } : { entityId: pulseId }),
      },
    })

  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [hasDragged, setHasDragged] = useState(false)
  const [selectedView, setSelectedView] = useState<KanbanViewType>('status')
  // Extract task lists (parent tasks of type LIST)
  const taskLists = useMemo(() => {
    if (!tasksData?.tasks) return []
    return tasksData.tasks.filter((task) => task.type === TaskType.List)
  }, [tasksData])

  const serverTasks = useMemo(() => {
    if (!tasksData?.tasks) return []

    return tasksData.tasks.flatMap((task) =>
      task.type === TaskType.List && task.children ? task.children : task,
    )
  }, [tasksData])

  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>(serverTasks)

  // Track if we're in the middle of an optimistic update
  const isPendingUpdate = useRef(false)

  // Sync local tasks with server tasks when data changes (but not during optimistic updates)
  useEffect(() => {
    if (!isPendingUpdate.current) {
      setLocalTasks(serverTasks)
    }
  }, [serverTasks])

  // Group tasks by TaskStatus
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.Todo]: [],
      [TaskStatus.Inprogress]: [],
      [TaskStatus.Completed]: [],
      [TaskStatus.Overdue]: [],
    }

    // Group tasks by their status
    localTasks.forEach((task) => {
      const status = task.status || TaskStatus.Todo
      if (grouped[status]) {
        grouped[status].push(task)
      }
    })

    return grouped
  }, [localTasks])

  // Group tasks by task list (parent)
  const tasksByTaskList = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      [UNASSIGNED_KEY]: [],
    }

    // Initialize groups for each task list
    taskLists.forEach((taskList) => {
      grouped[taskList.id] = []
    })

    // Group tasks by their parent task list
    localTasks.forEach((task) => {
      const parentId = task.parent?.id
      if (parentId && grouped[parentId]) {
        grouped[parentId].push(task)
      } else {
        // Task has no parent or parent is not a known task list
        grouped[UNASSIGNED_KEY].push(task)
      }
    })

    return grouped
  }, [localTasks, taskLists])

  const activeItem = useMemo(
    () => (activeId ? localTasks.find((t) => t.id === activeId) : null),
    [activeId, localTasks],
  )

  const handleItemClick = (task: Task) => {
    if (!hasDragged) {
      setSelectedTaskId(task.id)
    }
  }

  const handleCloseTaskDetailModal = () => {
    setSelectedTaskId(null)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setHasDragged(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setTimeout(() => setHasDragged(false), 100)

    if (!over) return

    const activeId = active.id as string
    const item = localTasks.find((t) => t.id === activeId)
    if (!item) return

    const overData = over.data.current

    if (selectedView === 'status') {
      // Handle status view - update task status
      let targetStatus: string | null = null

      // If dropped on a column, use that column's status
      if (overData?.type === 'column' && overData?.status) {
        targetStatus = overData.status
      }
      // If dropped on a task, find which column that task belongs to
      else if (overData?.type === 'task' && overData?.item) {
        const targetTask = overData.item as Task
        targetStatus = targetTask.status || TaskStatus.Todo
      }

      if (targetStatus !== null) {
        // Update task status
        const newStatus = targetStatus as TaskStatus

        // Don't update if status hasn't changed
        if (item.status === newStatus) return

        // Mark as pending update
        isPendingUpdate.current = true

        // Optimistically update local state
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t)),
        )

        // Update task via API
        updateTaskStatus(
          {
            organization_id: organizationId || '',
            status: newStatus,
            taskId: item.id,
          },
          {
            onError: () => {
              // Rollback on error
              isPendingUpdate.current = false
              setLocalTasks(serverTasks)
              toast.error(t('task_update_error'))
            },
            onSettled: async () => {
              await queryClient.invalidateQueries({ queryKey: ['tasks'] })
              isPendingUpdate.current = false
            },
          },
        )
      }
    } else {
      // Handle task list view - update task parent
      let targetTaskListId: string | null = null

      // If dropped on a column, use that column's task list id (status contains task list id)
      if (overData?.type === 'column' && overData?.status) {
        targetTaskListId = overData.status
      }
      // If dropped on a task, find which task list that task belongs to
      else if (overData?.type === 'task' && overData?.item) {
        const targetTask = overData.item as Task
        targetTaskListId = targetTask.parent?.id || UNASSIGNED_KEY
      }

      if (targetTaskListId !== null) {
        const currentParentId = item.parent?.id || UNASSIGNED_KEY

        // Don't update if task list hasn't changed
        if (currentParentId === targetTaskListId) return

        // Mark as pending update
        isPendingUpdate.current = true

        // Determine new parent_id (null for unassigned)
        const newParentId =
          targetTaskListId === UNASSIGNED_KEY ? null : targetTaskListId

        // Optimistically update local state
        setLocalTasks((prev) =>
          prev.map((t) =>
            t.id === item.id
              ? ({
                  ...t,
                  parent: newParentId
                    ? ({
                        __typename: 'Task',
                        id: newParentId,
                      } as Task['parent'])
                    : null,
                } as Task)
              : t,
          ),
        )

        // Update task via API
        updateTask(
          {
            organization_id: organizationId || '',
            parent_id: newParentId,
            taskId: item.id,
            title: item.title,
          },
          {
            onError: () => {
              // Rollback on error
              isPendingUpdate.current = false
              setLocalTasks(serverTasks)
              toast.error(t('task_update_error'))
            },
            onSettled: async () => {
              await queryClient.invalidateQueries({ queryKey: ['tasks'] })
              isPendingUpdate.current = false
            },
          },
        )
      }
    }
  }

  if (isLoadingFilteredTasks)
    return (
      <Stack alignItems="center" height="100%" justifyContent="center">
        <LoadingSpinner />
      </Stack>
    )

  return (
    <Stack
      sx={{
        flexDirection: 'column',
        gap: 2,
        height: '100%',
        overflow: 'hidden',
        p: 2,
      }}
    >
      <Stack alignItems="center" direction="row" gap={1}>
        <Typography fontWeight={500} variant="body2">
          View
        </Typography>
        <Select
          onChange={(e) =>
            setSelectedView(e.target.value as 'status' | 'task-list')
          }
          size="small"
          sx={{ minWidth: 100 }}
          value={selectedView}
        >
          <MenuItem value="status">
            <Typography variant="body2">Status</Typography>
          </MenuItem>
          <MenuItem value="task-list">
            <Typography variant="body2">Task List</Typography>
          </MenuItem>
        </Select>
      </Stack>

      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <Stack
          direction="row"
          gap={2}
          sx={{
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-thumb': {
              '&:hover': {
                backgroundColor: alpha('#000', 0.3),
              },
              backgroundColor: alpha('#000', 0.2),
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            flex: 1,
            minHeight: 0,
            overflowX: 'auto',
            pb: 2,
          }}
        >
          {selectedView === 'status' ? (
            // Status view - group by task status
            STATUS_ORDER.map((status) => {
              const config = STATUS_CONFIG[status]
              return (
                <KanbanColumn
                  activeDragId={activeId}
                  key={status}
                  onItemClick={handleItemClick}
                  setAddItemDialog={setAddItemDialog}
                  status={status}
                  statusColor={config.color}
                  statusLabel={config.label}
                  tasks={tasksByStatus[status] || []}
                  viewType={selectedView}
                />
              )
            })
          ) : (
            // Task list view - group by task list
            <>
              {/* Unassigned tasks column first */}
              <KanbanColumn
                activeDragId={activeId}
                key={UNASSIGNED_KEY}
                onItemClick={handleItemClick}
                setAddItemDialog={setAddItemDialog}
                status={UNASSIGNED_KEY}
                statusColor={UNASSIGNED_COLOR}
                statusLabel={UNASSIGNED_LABEL}
                tasks={tasksByTaskList[UNASSIGNED_KEY] || []}
                viewType={selectedView}
              />
              {/* Task list columns */}
              {taskLists.map((taskList) => (
                <KanbanColumn
                  activeDragId={activeId}
                  key={taskList.id}
                  onItemClick={handleItemClick}
                  setAddItemDialog={setAddItemDialog}
                  status={taskList.id}
                  statusColor={taskList.color || '#3b82f6'}
                  statusLabel={taskList.title}
                  tasks={tasksByTaskList[taskList.id] || []}
                  viewType={selectedView}
                />
              ))}
            </>
          )}
        </Stack>

        <DragOverlay>
          {activeItem ? (
            <Box
              sx={{
                backgroundColor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                boxShadow: 4,
                opacity: 0.9,
                p: 1.5,
                transform: 'rotate(5deg)',
                width: 280,
              }}
            >
              <Stack spacing={1}>
                <Typography fontWeight={500} variant="body2">
                  {activeItem.title}
                </Typography>
                {activeItem.description && (
                  <Typography
                    color="text.secondary"
                    sx={{
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      display: '-webkit-box',
                      overflow: 'hidden',
                    }}
                    variant="caption"
                  >
                    {activeItem.description}
                  </Typography>
                )}
              </Stack>
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={handleCloseTaskDetailModal}
          taskId={selectedTaskId}
        />
      )}

      <AddItemDialog
        initialMode={'task'}
        initialParentId={addItemDialog?.initialParentId || null}
        initialStatus={addItemDialog?.initialStatus || undefined}
        onClose={() => setAddItemDialog(null)}
        open={Boolean(addItemDialog && addItemDialog?.isOpen)}
      />
    </Stack>
  )
}
