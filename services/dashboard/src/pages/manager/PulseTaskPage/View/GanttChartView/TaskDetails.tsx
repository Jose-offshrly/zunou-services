import { Check, OpenInFull } from '@mui/icons-material'
import {
  Box,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import {
  PulseStatusOption,
  Task,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import { useUpdateTaskMutation } from '@zunou-queries/core/hooks/useUpdateTaskMutation'
import { Chip } from '@zunou-react/components/form'
import { default as CustomAvatar } from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import React, { memo, useCallback, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { usePulseStore } from '~/store/usePulseStore'
import { getPulseTaskStatusColor } from '~/utils/getPulseTaskColor'

import { TaskDetailModal } from '../../components'
import { AssigneeField, DateField, StatusField, TitleField } from './components'

// Constants
const ROW_HEIGHT = 40

// Helper functions
const formatDate = (date: string | null | undefined): string => {
  return date ? dayjs(date).format('MMM D') : '-'
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

const calculateListTaskDates = (
  task: Task,
): { startDate: string | null; dueDate: string | null } => {
  if (task.type !== TaskType.List || !task.children?.length) {
    return {
      dueDate: task.due_date ?? null,
      startDate: task.start_date ?? null,
    }
  }

  const childrenWithDates = task.children.filter(
    (child) => child.start_date || child.due_date,
  )

  if (childrenWithDates.length === 0) {
    return {
      dueDate: task.due_date ?? null,
      startDate: task.start_date ?? null,
    }
  }

  const earliestStart = childrenWithDates
    .filter((child) => child.start_date)
    .reduce<dayjs.Dayjs | null>((earliest, child) => {
      const childStart = dayjs(child.start_date)
      return !earliest || childStart.isBefore(earliest) ? childStart : earliest
    }, null)

  const latestDue = childrenWithDates
    .filter((child) => child.due_date)
    .reduce<dayjs.Dayjs | null>((latest, child) => {
      const childDue = dayjs(child.due_date)
      return !latest || childDue.isAfter(latest) ? childDue : latest
    }, null)

  return {
    dueDate: latestDue?.toISOString() ?? task.due_date ?? null,
    startDate: earliestStart?.toISOString() ?? task.start_date ?? null,
  }
}

interface TaskDetailsProps {
  tasks: Task[]
  collapsedTasks: Set<string>
  onToggleCollapse: (taskId: string) => void
  highlightedTaskId: string | null
  updatingTaskIds: Set<string>
  addUpdatingTaskId: (taskId: string) => void
  removeUpdatingTaskId: (taskId: string) => void
}

function TaskDetails({
  tasks,
  collapsedTasks,
  onToggleCollapse,
  highlightedTaskId,
  updatingTaskIds,
  addUpdatingTaskId,
  removeUpdatingTaskId,
}: TaskDetailsProps) {
  const { pulseStatusOption } = usePulseStore()
  const { user } = useAuthContext()
  const { organizationId, pulseId } = useParams()
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const isSavingRef = useRef(false)
  const [datePickerAnchor, setDatePickerAnchor] = useState<{
    element: HTMLElement
    taskId: string
    type: 'start' | 'end'
  } | null>(null)
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<{
    element: HTMLElement
    taskId: string
  } | null>(null)
  const [assigneeMenuAnchor, setAssigneeMenuAnchor] = useState<{
    element: HTMLElement
    taskId: string
  } | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { pulseMembers } = usePulseStore()

  const shouldFetchDefaults = pulseStatusOption === PulseStatusOption.Default
  const shouldFetchCustom =
    pulseStatusOption === PulseStatusOption.Custom && pulseId

  const { data: taskStatusesData } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: shouldFetchDefaults
      ? { defaults: true }
      : shouldFetchCustom
        ? { pulseId }
        : undefined,
  })

  const customStatuses = taskStatusesData?.taskStatuses

  const timezone = user?.timezone ?? 'UTC'

  const cellStyle = useMemo(
    () => ({
      height: ROW_HEIGHT,
      overflow: 'hidden',
      px: 1,
      py: 0.5,
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    }),
    [],
  )

  const handleCloseTaskDetailModal = () => {
    setSelectedTaskId(null)
  }

  // Memoize header cell style
  const headerCellStyle = useMemo(
    () => ({
      ...cellStyle,
      backgroundColor: 'background.paper',
      minWidth: 100,
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
    }),
    [cellStyle],
  )

  // Helper to find task by ID
  const findTask = useCallback(
    (taskId: string) => tasks.find((t) => t.id === taskId),
    [tasks],
  )

  // Helper to build update task input
  const buildUpdateInput = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (task: Task, updates: Record<string, any>) => ({
      color: task.color,
      due_date: task.due_date ?? undefined,
      organization_id: organizationId!,
      parent_id: task.parent?.id ?? undefined,
      start_date: task.start_date ?? undefined,
      status: task.status ?? undefined,
      taskId: task.id,
      task_status_id: task.task_status_id ?? undefined,
      title: task.title,
      ...updates,
    }),
    [organizationId],
  )

  const { mutate: updateTask } = useUpdateTaskMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleTitleClick = (task: Task) => {
    setEditingTaskId(task.id)
    setEditedTitle(task.title)
  }

  const handleTitleSave = useCallback(
    (taskId: string) => {
      if (isSavingRef.current) return
      isSavingRef.current = true

      if (!organizationId) {
        toast.error('Missing organization ID.')
        return
      }

      const task = findTask(taskId)
      const trimmedTitle = editedTitle.trim()

      if (trimmedTitle && trimmedTitle !== task?.title && task) {
        addUpdatingTaskId(taskId)
        updateTask(buildUpdateInput(task, { title: trimmedTitle }), {
          onError: () => toast.error('Failed to update task title'),
          onSettled: (_data, _error, variables) =>
            removeUpdatingTaskId(variables.taskId),
        })
      }

      setEditingTaskId(null)
      setEditedTitle('')

      setTimeout(() => {
        isSavingRef.current = false
      }, 100)
    },
    [
      organizationId,
      editedTitle,
      findTask,
      buildUpdateInput,
      updateTask,
      addUpdatingTaskId,
      removeUpdatingTaskId,
    ],
  )

  const handleTitleKeyDown = (e: React.KeyboardEvent, taskId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleTitleSave(taskId)
    } else if (e.key === 'Escape') {
      setEditingTaskId(null)
      setEditedTitle('')
      isSavingRef.current = false
    }
  }

  const handleBlur = (taskId: string) => {
    setTimeout(() => {
      if (!isSavingRef.current) {
        handleTitleSave(taskId)
      }
    }, 10)
  }

  const handleDateClick = (
    event: React.MouseEvent<HTMLElement>,
    taskId: string,
    type: 'start' | 'end',
  ) => {
    setDatePickerAnchor({ element: event.currentTarget, taskId, type })
  }

  const handleDateChange = useCallback(
    (date: Dayjs | null) => {
      if (!date || !datePickerAnchor || !organizationId) return

      const task = findTask(datePickerAnchor.taskId)
      if (!task) return

      const isStartDate = datePickerAnchor.type === 'start'

      // Get current time in user's timezone
      const now = dayjs().tz(timezone)

      // Combine selected date with current time
      const dateWithCurrentTime = date
        .tz(timezone, true)
        .hour(now.hour())
        .minute(now.minute())
        .second(now.second())

      // Validate date constraints
      if (isStartDate && task.due_date) {
        const dueDate = dayjs(task.due_date).tz(timezone)
        if (dateWithCurrentTime.isAfter(dueDate)) {
          toast.error('Start date cannot be after due date')
          return
        }
      } else if (!isStartDate && task.start_date) {
        const startDate = dayjs(task.start_date).tz(timezone)
        if (dateWithCurrentTime.isBefore(startDate)) {
          toast.error('Due date cannot be before start date')
          return
        }
      }

      const formattedDate = dateWithCurrentTime.format('YYYY-MM-DD HH:mm:ss')

      addUpdatingTaskId(datePickerAnchor.taskId)
      updateTask(
        buildUpdateInput(task, {
          [isStartDate ? 'start_date' : 'due_date']: formattedDate,
        }),
        {
          onError: () =>
            toast.error(
              `Failed to update ${isStartDate ? 'start' : 'end'} date`,
            ),
          onSettled: (_data, _error, variables) =>
            removeUpdatingTaskId(variables.taskId),
        },
      )

      setDatePickerAnchor(null)
    },
    [
      datePickerAnchor,
      organizationId,
      timezone,
      findTask,
      buildUpdateInput,
      updateTask,
      addUpdatingTaskId,
      removeUpdatingTaskId,
    ],
  )

  const handleCloseDatePicker = () => {
    setDatePickerAnchor(null)
  }

  // Temporarily removed for now
  // const handleClearDate = useCallback(() => {
  //   if (!datePickerAnchor || !organizationId) return

  //   const task = findTask(datePickerAnchor.taskId)
  //   if (!task) return

  //   const isStartDate = datePickerAnchor.type === 'start'

  //   updateTask(
  //     buildUpdateInput(task, {
  //       [isStartDate ? 'start_date' : 'due_date']: null,
  //     }),
  //     {
  //       onError: () =>
  //         toast.error(`Failed to clear ${isStartDate ? 'start' : 'end'} date`),
  //     },
  //   )

  //   setDatePickerAnchor(null)
  // }, [datePickerAnchor, organizationId, findTask, buildUpdateInput, updateTask])

  const handleStatusClick = (
    event: React.MouseEvent<HTMLElement>,
    taskId: string,
  ) => {
    setStatusMenuAnchor({ element: event.currentTarget, taskId })
  }

  const handleStatusChange = useCallback(
    (status: TaskStatus | string, isCustomStatus = false) => {
      if (!statusMenuAnchor || !organizationId) return

      const task = findTask(statusMenuAnchor.taskId)
      if (!task) return

      const updates = isCustomStatus
        ? { status: null, task_status_id: status }
        : { status, task_status_id: null }

      addUpdatingTaskId(statusMenuAnchor.taskId)
      updateTask(buildUpdateInput(task, updates), {
        onError: () => toast.error('Failed to update task status'),
        onSettled: (_data, _error, variables) =>
          removeUpdatingTaskId(variables.taskId),
      })

      setStatusMenuAnchor(null)
    },
    [
      statusMenuAnchor,
      organizationId,
      findTask,
      buildUpdateInput,
      updateTask,
      addUpdatingTaskId,
      removeUpdatingTaskId,
    ],
  )

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null)
  }

  const handleAssigneeClick = (
    event: React.MouseEvent<HTMLElement>,
    taskId: string,
  ) => {
    event.stopPropagation()
    setAssigneeMenuAnchor({ element: event.currentTarget, taskId })
  }

  const handleToggleAssignee = useCallback(
    (userId: string) => {
      if (!assigneeMenuAnchor || !organizationId) return

      const task = findTask(assigneeMenuAnchor.taskId)
      if (!task) return

      const currentAssignees = task.assignees?.map((a) => a.user.id) || []
      const newAssignees = currentAssignees.includes(userId)
        ? currentAssignees.filter((id) => id !== userId)
        : [...currentAssignees, userId]

      addUpdatingTaskId(assigneeMenuAnchor.taskId)
      updateTask(buildUpdateInput(task, { assignees: newAssignees }), {
        onError: () => toast.error('Failed to update task assignees'),
        onSettled: (_data, _error, variables) =>
          removeUpdatingTaskId(variables.taskId),
      })
    },
    [
      assigneeMenuAnchor,
      organizationId,
      findTask,
      buildUpdateInput,
      updateTask,
      addUpdatingTaskId,
      removeUpdatingTaskId,
    ],
  )

  const handleCloseAssigneeMenu = () => {
    setAssigneeMenuAnchor(null)
  }

  return (
    <>
      <TableContainer sx={{ flexShrink: 0, width: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ height: ROW_HEIGHT }}>
              <TableCell sx={headerCellStyle}>Task Name</TableCell>
              <TableCell
                sx={{
                  ...headerCellStyle,
                  maxWidth: 44,
                  minWidth: 44,
                  px: 0.5,
                  width: 44,
                }}
              ></TableCell>
              <TableCell sx={headerCellStyle}>Assignee</TableCell>
              <TableCell sx={headerCellStyle}>Status</TableCell>
              <TableCell sx={headerCellStyle}>Start</TableCell>
              <TableCell sx={headerCellStyle}>End</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tasks.map((task) => (
              <TaskDetailsRow
                cellStyle={cellStyle}
                collapsedTasks={collapsedTasks}
                disabled={updatingTaskIds.has(task.id)}
                editedTitle={editedTitle}
                editingTaskId={editingTaskId}
                handleAssigneeClick={handleAssigneeClick}
                handleBlur={handleBlur}
                handleDateClick={handleDateClick}
                handleRowClick={setSelectedTaskId}
                handleStatusClick={handleStatusClick}
                handleTitleClick={handleTitleClick}
                handleTitleKeyDown={handleTitleKeyDown}
                highlightedTaskId={highlightedTaskId}
                key={task.id}
                onToggleCollapse={onToggleCollapse}
                setEditedTitle={setEditedTitle}
                task={task}
              />
            ))}
          </TableBody>
        </Table>

        <DatePickerPopover
          datePickerAnchor={datePickerAnchor}
          onChange={handleDateChange}
          onClose={handleCloseDatePicker}
          tasks={tasks}
          timezone={timezone}
        />
        <Menu
          anchorEl={statusMenuAnchor?.element}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
          onClose={handleCloseStatusMenu}
          open={Boolean(statusMenuAnchor)}
        >
          {pulseStatusOption === PulseStatusOption.Custom && customStatuses
            ? customStatuses.map((customStatus) => (
                <MenuItem
                  key={customStatus.id}
                  onClick={() => handleStatusChange(customStatus.id, true)}
                >
                  <Chip
                    label={customStatus.label}
                    size="small"
                    sx={{
                      backgroundColor: customStatus.color || undefined,
                      borderRadius: 9999,
                      color: customStatus.color ? 'white' : undefined,
                      fontSize: 10,
                    }}
                  />
                </MenuItem>
              ))
            : [
                <MenuItem
                  key="todo"
                  onClick={() => handleStatusChange(TaskStatus.Todo)}
                >
                  <Chip
                    label={formatTaskStatus(TaskStatus.Todo)}
                    size="small"
                    sx={{
                      backgroundColor: getPulseTaskStatusColor(TaskStatus.Todo),
                      borderRadius: 9999,
                      color: 'white',
                      fontSize: 10,
                    }}
                  />
                </MenuItem>,
                <MenuItem
                  key="inprogress"
                  onClick={() => handleStatusChange(TaskStatus.Inprogress)}
                >
                  <Chip
                    label={formatTaskStatus(TaskStatus.Inprogress)}
                    size="small"
                    sx={{
                      backgroundColor: getPulseTaskStatusColor(
                        TaskStatus.Inprogress,
                      ),
                      borderRadius: 9999,
                      color: 'white',
                      fontSize: 10,
                    }}
                  />
                </MenuItem>,
                <MenuItem
                  key="completed"
                  onClick={() => handleStatusChange(TaskStatus.Completed)}
                >
                  <Chip
                    label={formatTaskStatus(TaskStatus.Completed)}
                    size="small"
                    sx={{
                      backgroundColor: getPulseTaskStatusColor(
                        TaskStatus.Completed,
                      ),
                      borderRadius: 9999,
                      color: 'white',
                      fontSize: 10,
                    }}
                  />
                </MenuItem>,
                <MenuItem
                  key="overdue"
                  onClick={() => handleStatusChange(TaskStatus.Overdue)}
                >
                  <Chip
                    label={formatTaskStatus(TaskStatus.Overdue)}
                    size="small"
                    sx={{
                      backgroundColor: getPulseTaskStatusColor(
                        TaskStatus.Overdue,
                      ),
                      borderRadius: 9999,
                      color: 'white',
                      fontSize: 10,
                    }}
                  />
                </MenuItem>,
              ]}
        </Menu>

        <Menu
          anchorEl={assigneeMenuAnchor?.element}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
          onClose={handleCloseAssigneeMenu}
          open={Boolean(assigneeMenuAnchor)}
        >
          {pulseMembers?.map((member) => {
            const task = tasks.find((t) => t.id === assigneeMenuAnchor?.taskId)
            const isAssigned = task?.assignees?.some(
              (a) => a.user.id === member.user.id,
            )

            return (
              <MenuItem
                key={member.user.id}
                onClick={() => handleToggleAssignee(member.user.id)}
              >
                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={1.5}
                  width="100%"
                >
                  <CustomAvatar
                    placeholder={member.user.name}
                    size="extraSmall"
                    src={member.user.gravatar}
                    variant="circular"
                  />
                  <Typography sx={{ flex: 1 }} variant="caption">
                    {member.user.name}
                  </Typography>
                  {isAssigned && <Check fontSize="small" />}
                </Stack>
              </MenuItem>
            )
          })}
        </Menu>
      </TableContainer>
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={handleCloseTaskDetailModal}
          taskId={selectedTaskId}
        />
      )}
    </>
  )
}

export default memo(TaskDetails)

// Memoized task row component
interface TaskDetailsRowProps {
  task: Task
  cellStyle: Record<string, unknown>
  collapsedTasks: Set<string>
  disabled?: boolean
  highlightedTaskId: string | null
  editingTaskId: string | null
  editedTitle: string
  setEditedTitle: (title: string) => void
  handleTitleClick: (task: Task) => void
  handleBlur: (taskId: string) => void
  handleTitleKeyDown: (e: React.KeyboardEvent, taskId: string) => void
  onToggleCollapse: (taskId: string) => void
  handleAssigneeClick: (
    e: React.MouseEvent<HTMLElement>,
    taskId: string,
  ) => void
  handleStatusClick: (e: React.MouseEvent<HTMLElement>, taskId: string) => void
  handleDateClick: (
    e: React.MouseEvent<HTMLElement>,
    taskId: string,
    type: 'start' | 'end',
  ) => void
  handleRowClick?: (id: string) => void
}

const TaskDetailsRow = memo(
  ({
    task,
    cellStyle,
    collapsedTasks,
    disabled = false,
    highlightedTaskId,
    editingTaskId,
    editedTitle,
    setEditedTitle,
    handleTitleClick,
    handleBlur,
    handleTitleKeyDown,
    onToggleCollapse,
    handleAssigneeClick,
    handleStatusClick,
    handleDateClick,
    handleRowClick,
  }: TaskDetailsRowProps) => {
    const { startDate, dueDate } = useMemo(
      () => calculateListTaskDates(task),
      [task],
    )
    const start = formatDate(startDate)
    const due = formatDate(dueDate)
    const isCollapsed = collapsedTasks.has(task.id)
    const isHighlighted = highlightedTaskId === task.id
    const isEditing = editingTaskId === task.id

    const rowSx = useMemo(
      () => ({
        '&:hover .open-in-full-icon': {
          opacity: 1,
        },
        bgcolor: isHighlighted ? 'common.lightBlue' : undefined,
        height: ROW_HEIGHT,
      }),
      [isHighlighted],
    )

    const handleRowBlur = useCallback(
      () => handleBlur(task.id),
      [handleBlur, task.id],
    )

    const handleRowTitleClick = useCallback(
      () => handleTitleClick(task),
      [handleTitleClick, task],
    )

    const handleRowKeyDown = useCallback(
      (e: React.KeyboardEvent) => handleTitleKeyDown(e, task.id),
      [handleTitleKeyDown, task.id],
    )

    const handleRowToggleCollapse = useCallback(
      () => onToggleCollapse(task.id),
      [onToggleCollapse, task.id],
    )

    const handleRowAssigneeClick = useCallback(
      (e: React.MouseEvent<HTMLElement>) => handleAssigneeClick(e, task.id),
      [handleAssigneeClick, task.id],
    )

    const handleRowStatusClick = useCallback(
      (e: React.MouseEvent<HTMLElement>) => handleStatusClick(e, task.id),
      [handleStatusClick, task.id],
    )

    const handleStartDateClick = useCallback(
      (e: React.MouseEvent<HTMLElement>) =>
        handleDateClick(e, task.id, 'start'),
      [handleDateClick, task.id],
    )

    const handleEndDateClick = useCallback(
      (e: React.MouseEvent<HTMLElement>) => handleDateClick(e, task.id, 'end'),
      [handleDateClick, task.id],
    )

    const handleOpenInFull = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        handleRowClick?.(task.id)
      },
      [handleRowClick, task.id],
    )

    const actionCellSx = useMemo(
      () => ({
        ...cellStyle,
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        maxWidth: 44,
        minWidth: 44,
        px: 0.5,
        py: 0.5,
        width: 44,
      }),
      [cellStyle],
    )

    return (
      <TableRow sx={rowSx}>
        <TableCell sx={cellStyle}>
          <TitleField
            disabled={disabled}
            editedValue={editedTitle}
            isCollapsed={isCollapsed}
            isEditing={isEditing}
            onBlur={handleRowBlur}
            onChange={setEditedTitle}
            onClick={handleRowTitleClick}
            onKeyDown={handleRowKeyDown}
            onToggleCollapse={handleRowToggleCollapse}
            task={task}
          />
        </TableCell>
        <TableCell sx={actionCellSx}>
          <Box
            className="open-in-full-icon"
            onClick={handleOpenInFull}
            sx={{
              '&:active': {
                transform: 'scale(0.95)',
              },
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
                color: 'primary.main',
              },
              alignItems: 'center',
              backgroundColor: 'transparent',
              border: 0.5,
              borderColor: 'divider',
              borderRadius: 0.75,
              color: 'text.secondary',
              cursor: 'pointer',
              display: 'flex',
              flexShrink: 0,
              height: 20,
              justifyContent: 'center',
              opacity: 0,
              transition: 'all 0.2s ease-in-out',
              width: 20,
            }}
          >
            <OpenInFull sx={{ fontSize: 12 }} />
          </Box>
        </TableCell>
        <TableCell sx={cellStyle}>
          <AssigneeField
            disabled={disabled}
            onClick={handleRowAssigneeClick}
            task={task}
          />
        </TableCell>
        <TableCell sx={cellStyle}>
          <StatusField
            disabled={disabled}
            onClick={handleRowStatusClick}
            task={task}
          />
        </TableCell>
        <TableCell sx={cellStyle}>
          <DateField
            disabled={disabled}
            onClick={handleStartDateClick}
            taskType={task.type ?? TaskType.Task}
            value={start}
          />
        </TableCell>
        <TableCell sx={cellStyle}>
          <DateField
            disabled={disabled}
            onClick={handleEndDateClick}
            taskType={task.type ?? TaskType.Task}
            value={due}
          />
        </TableCell>
      </TableRow>
    )
  },
)

TaskDetailsRow.displayName = 'TaskDetailsRow'

// Memoized DatePicker Popover component
interface DatePickerPopoverProps {
  datePickerAnchor: {
    element: HTMLElement
    taskId: string
    type: 'start' | 'end'
  } | null
  tasks: Task[]
  timezone: string
  onClose: () => void
  onChange: (date: Dayjs | null) => void
}

const DatePickerPopover = memo(
  ({
    datePickerAnchor,
    tasks,
    timezone,
    onClose,
    onChange,
  }: DatePickerPopoverProps) => {
    const task = useMemo(
      () =>
        datePickerAnchor
          ? tasks.find((t) => t.id === datePickerAnchor.taskId)
          : null,
      [datePickerAnchor, tasks],
    )

    const maxDate = useMemo(() => {
      if (!datePickerAnchor || datePickerAnchor.type !== 'start')
        return undefined
      return task?.due_date
        ? dayjs(task.due_date).tz(timezone, true)
        : undefined
    }, [datePickerAnchor, task?.due_date, timezone])

    const minDate = useMemo(() => {
      if (!datePickerAnchor || datePickerAnchor.type !== 'end') return undefined
      return task?.start_date
        ? dayjs(task.start_date).tz(timezone, true)
        : undefined
    }, [datePickerAnchor, task?.start_date, timezone])

    const value = useMemo(() => {
      if (!datePickerAnchor || !task) return null
      const dateValue =
        datePickerAnchor.type === 'start' ? task.start_date : task.due_date
      return dateValue ? dayjs(dateValue).tz(timezone, true) : null
    }, [datePickerAnchor, task, timezone])

    const anchorOrigin = useMemo(
      () => ({
        horizontal: 'left' as const,
        vertical: 'bottom' as const,
      }),
      [],
    )

    return (
      <Popover
        anchorEl={datePickerAnchor?.element}
        anchorOrigin={anchorOrigin}
        onClose={onClose}
        open={Boolean(datePickerAnchor)}
      >
        <Box>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              maxDate={maxDate}
              minDate={minDate}
              onChange={onChange}
              value={value}
            />
          </LocalizationProvider>
        </Box>
      </Popover>
    )
  },
)

DatePickerPopover.displayName = 'DatePickerPopover'
