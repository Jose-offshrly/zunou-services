import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Task, TaskType } from '@zunou-graphql/core/graphql'
import { useUpdateTaskMutation } from '@zunou-queries/core/hooks/useUpdateTaskMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import timezonePlugin from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

// Time period interface
interface TimePeriod {
  start: Date
  end: Date
  label: string
  subLabel?: string
}

interface DragState {
  taskId: string
  edge: 'start' | 'end' | 'move'
  initialMouseX: number
  initialLeft: number
  initialWidth: number
  task: Task
}

// Optimistic date overrides for tasks
interface OptimisticDates {
  [taskId: string]: {
    start_date?: string | null
    due_date?: string | null
  }
}

interface TaskBarProps {
  tasks: Task[]
  startDate: Date
  endDate: Date
  setHighlightedTaskId: (id: string | null) => void
  highlightedTaskId: string | null
  viewMode: 'day' | 'week' | 'month'
  dependencyLineStyle?: 'dashed' | 'solid'
  dependencyLineColor?: string
  dependencyLineHighlightColor?: string
  hideWeekends?: boolean
  markWeekends?: boolean
  updatingTaskIds: Set<string>
  addUpdatingTaskId: (taskId: string) => void
  removeUpdatingTaskId: (taskId: string) => void
}

export interface TaskBarRef {
  scrollToCurrentPeriod: () => void
}

const TaskBar = forwardRef<TaskBarRef, TaskBarProps>(
  (
    {
      tasks,
      startDate,
      endDate,
      setHighlightedTaskId,
      highlightedTaskId,
      viewMode,
      dependencyLineStyle = 'dashed',
      dependencyLineColor = theme.palette.grey[400],
      dependencyLineHighlightColor = theme.palette.primary.light,
      hideWeekends = false,
      markWeekends = true,
      updatingTaskIds,
      addUpdatingTaskId,
      removeUpdatingTaskId,
    },
    ref,
  ) => {
    const { user } = useAuthContext()
    const { organizationId } = useParams()
    const timezone = user?.timezone ?? 'UTC'
    const containerRef = useRef<HTMLDivElement>(null)
    const [dragState, setDragState] = useState<DragState | null>(null)
    const [dragOffset, setDragOffset] = useState({ left: 0, width: 0 })
    const [optimisticDates, setOptimisticDates] = useState<OptimisticDates>({})

    const { mutate: updateTask } = useUpdateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

    // Helper to get task dates (optimistic or actual)
    const getTaskDates = useCallback(
      (task: Task) => {
        const optimistic = optimisticDates[task.id]
        return {
          due_date: optimistic?.due_date ?? task.due_date,
          start_date: optimistic?.start_date ?? task.start_date,
        }
      },
      [optimisticDates],
    )

    const height = 40
    const cellWidth = viewMode === 'day' ? 70 : viewMode === 'week' ? 120 : 150

    const currentDay = useMemo(() => dayjs().tz(timezone), [timezone])

    // Generate array of time periods based on view mode - memoized for performance
    const timePeriods = useMemo<TimePeriod[]>(() => {
      const periods: TimePeriod[] = []

      if (viewMode === 'day') {
        const currentDate = dayjs(startDate).tz(timezone).startOf('day')
        const endDateDay = dayjs(endDate).tz(timezone).startOf('day')

        let iterDate = currentDate
        while (iterDate.isSameOrBefore(endDateDay, 'day')) {
          const dayOfWeek = iterDate.day()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

          // Skip weekends if hideWeekends is true
          if (!hideWeekends || !isWeekend) {
            periods.push({
              end: iterDate.endOf('day').toDate(),
              label: iterDate.format('MMM D'),
              // First letter of day name
              start: iterDate.toDate(),
              subLabel: iterDate.format('ddd').charAt(0),
            })
          }
          iterDate = iterDate.add(1, 'day')
        }
      } else if (viewMode === 'week') {
        const currentDate = dayjs(startDate).tz(timezone).startOf('week')
        const endDateWeek = dayjs(endDate).tz(timezone).endOf('week')

        let iterDate = currentDate
        while (iterDate.isSameOrBefore(endDateWeek, 'week')) {
          const weekEnd = iterDate.endOf('week')
          periods.push({
            end: weekEnd.toDate(),
            label: `${iterDate.format('MMM D')} - ${weekEnd.format('MMM D')}`,
            start: iterDate.toDate(),
          })
          iterDate = iterDate.add(1, 'week')
        }
      } else if (viewMode === 'month') {
        const currentDate = dayjs(startDate).tz(timezone).startOf('month')
        const endDateMonth = dayjs(endDate).tz(timezone).endOf('month')

        let iterDate = currentDate
        while (iterDate.isSameOrBefore(endDateMonth, 'month')) {
          periods.push({
            end: iterDate.endOf('month').toDate(),
            label: iterDate.format('MMMM YYYY'),
            start: iterDate.toDate(),
          })
          iterDate = iterDate.add(1, 'month')
        }
      }

      return periods
    }, [startDate, endDate, timezone, viewMode, hideWeekends])

    // Helper to check if a period is a weekend
    const isWeekendPeriod = useCallback(
      (period: TimePeriod) => {
        if (viewMode !== 'day') return false
        const periodStart = dayjs(period.start).tz(timezone)
        const dayOfWeek = periodStart.day()
        return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
      },
      [viewMode, timezone],
    )

    // Calculate position and width for a task bar - memoized
    const calculateBarPosition = useCallback(
      (taskStart: Date, taskEnd: Date) => {
        const taskStartDay = dayjs(taskStart).tz(timezone)
        const taskEndDay = dayjs(taskEnd).tz(timezone)

        // If hiding weekends, adjust task dates to skip weekends
        let adjustedStartDay = taskStartDay
        let adjustedEndDay = taskEndDay

        if (hideWeekends && viewMode === 'day') {
          // If start date is on weekend, move to next Monday
          while (adjustedStartDay.day() === 0 || adjustedStartDay.day() === 6) {
            adjustedStartDay = adjustedStartDay.add(1, 'day')
          }

          // If end date is on weekend, move to previous Friday
          while (adjustedEndDay.day() === 0 || adjustedEndDay.day() === 6) {
            adjustedEndDay = adjustedEndDay.subtract(1, 'day')
          }

          // If the adjusted end is before adjusted start, don't render the bar
          if (adjustedEndDay.isBefore(adjustedStartDay)) {
            return {
              left: '0px',
              leftPx: 0,
              startPeriodIndex: 0,
              width: '0px',
              widthPx: 0,
            }
          }
        }

        // Find which periods the task spans
        let startPeriodIndex = -1
        let endPeriodIndex = -1
        let startOffset = 0
        let endOffset = 1

        for (let index = 0; index < timePeriods.length; index++) {
          const period = timePeriods[index]
          const periodStart = dayjs(period.start).tz(timezone)
          const periodEnd = dayjs(period.end).tz(timezone)

          // Check if task starts in this period
          if (
            startPeriodIndex === -1 &&
            adjustedStartDay.isSameOrAfter(periodStart) &&
            adjustedStartDay.isSameOrBefore(periodEnd)
          ) {
            startPeriodIndex = index
            if (viewMode === 'day') {
              startOffset = 0
            } else {
              const periodDays = periodEnd.diff(periodStart, 'day') + 1
              const taskStartDayOffset = adjustedStartDay
                .startOf('day')
                .diff(periodStart.startOf('day'), 'day')
              startOffset = taskStartDayOffset / periodDays
            }
          }

          // Check if task ends in this period
          if (
            endPeriodIndex === -1 &&
            adjustedEndDay.isSameOrAfter(periodStart) &&
            adjustedEndDay.isSameOrBefore(periodEnd)
          ) {
            endPeriodIndex = index
            if (viewMode === 'day') {
              endOffset = 1
            } else {
              const periodDays = periodEnd.diff(periodStart, 'day') + 1
              const taskEndDayOffset =
                adjustedEndDay
                  .startOf('day')
                  .diff(periodStart.startOf('day'), 'day') + 1
              endOffset = taskEndDayOffset / periodDays
            }
          }

          // Early exit if both indices found
          if (startPeriodIndex !== -1 && endPeriodIndex !== -1) break
        }

        // If task starts before first visible period, clamp to first
        if (startPeriodIndex === -1) {
          startPeriodIndex = 0
          startOffset = 0
        }

        // If task ends after last visible period, clamp to last
        if (endPeriodIndex === -1) {
          endPeriodIndex = timePeriods.length - 1
          endOffset = 1
        }

        const padding = 5
        const minBarWidth = 20

        // Calculate raw positions
        const rawLeft = startPeriodIndex * cellWidth + startOffset * cellWidth
        const rawRight = endPeriodIndex * cellWidth + endOffset * cellWidth

        // Calculate the end boundary of the last period the task spans
        const endCellBoundary = (endPeriodIndex + 1) * cellWidth

        // Apply padding but clamp to stay within cell boundaries
        let left = rawLeft + padding
        const right = Math.min(rawRight - padding, endCellBoundary - padding)

        // Ensure minimum bar width, but don't exceed cell boundary
        let width = right - left
        if (width < minBarWidth) {
          const center = (rawLeft + rawRight) / 2
          left = Math.max(
            startPeriodIndex * cellWidth + padding,
            Math.min(
              center - minBarWidth / 2,
              endCellBoundary - minBarWidth - padding,
            ),
          )
          width = minBarWidth
        }

        return {
          left: `${left}px`,
          leftPx: left,
          startPeriodIndex,
          width: `${width}px`,
          widthPx: width,
        }
      },
      [cellWidth, timePeriods, timezone, viewMode, hideWeekends],
    )

    // Calculate date from pixel position
    const calculateDateFromPosition = useCallback(
      (pixelPosition: number, edge: 'start' | 'end'): dayjs.Dayjs => {
        const padding = 5 // Match the padding used in calculateBarPosition

        // Adjust position to account for padding
        // For start edge, the actual date position is at the left edge of the bar minus padding
        // For end edge, the actual date position is at the right edge of the bar plus padding
        const adjustedPosition =
          edge === 'start' ? pixelPosition - padding : pixelPosition + padding

        // Find which period this position falls into
        const periodIndex = Math.floor(adjustedPosition / cellWidth)
        const clampedPeriodIndex = Math.max(
          0,
          Math.min(periodIndex, timePeriods.length - 1),
        )
        const period = timePeriods[clampedPeriodIndex]

        if (!period) {
          return dayjs().tz(timezone)
        }

        const periodStart = dayjs(period.start).tz(timezone)
        const periodEnd = dayjs(period.end).tz(timezone)

        // Calculate offset within the period (0 to 1)
        const positionInPeriod =
          adjustedPosition - clampedPeriodIndex * cellWidth
        const offsetRatio = Math.max(
          0,
          Math.min(1, positionInPeriod / cellWidth),
        )

        if (viewMode === 'day') {
          // For day view, return the exact day at this position
          return periodStart
        } else if (viewMode === 'week') {
          // For week view, calculate the exact day within the week
          const periodDays = periodEnd.diff(periodStart, 'day') + 1
          const dayOffset = Math.round(offsetRatio * (periodDays - 1))
          return periodStart.add(dayOffset, 'day')
        } else {
          // For month view, calculate the exact day within the month
          const periodDays = periodEnd.diff(periodStart, 'day') + 1
          const dayOffset = Math.round(offsetRatio * (periodDays - 1))
          return periodStart.add(dayOffset, 'day')
        }
      },
      [cellWidth, timePeriods, timezone, viewMode],
    )

    // Handle drag start
    const handleDragStart = useCallback(
      (
        e: React.MouseEvent,
        task: Task,
        edge: 'start' | 'end' | 'move',
        currentLeft: number,
        currentWidth: number,
      ) => {
        e.preventDefault()
        e.stopPropagation()

        if (task.type === TaskType.List) return // Don't allow dragging list tasks

        setDragState({
          edge,
          initialLeft: currentLeft,
          initialMouseX: e.clientX,
          initialWidth: currentWidth,
          task,
          taskId: task.id,
        })
        setDragOffset({ left: 0, width: 0 })
      },
      [],
    )

    // Handle drag move
    const handleDragMove = useCallback(
      (e: MouseEvent) => {
        if (!dragState) return

        const deltaX = e.clientX - dragState.initialMouseX

        if (dragState.edge === 'start') {
          // Moving the start edge - adjust left and width
          const newLeft = Math.max(0, dragState.initialLeft + deltaX)
          const leftDelta = newLeft - dragState.initialLeft
          const newWidth = Math.max(20, dragState.initialWidth - leftDelta)

          setDragOffset({
            left: newLeft - dragState.initialLeft,
            width: newWidth - dragState.initialWidth,
          })
        } else if (dragState.edge === 'end') {
          // Moving the end edge - only adjust width
          const newWidth = Math.max(20, dragState.initialWidth + deltaX)

          setDragOffset({
            left: 0,
            width: newWidth - dragState.initialWidth,
          })
        } else {
          // Moving the entire bar - adjust left, keep width the same
          const newLeft = Math.max(0, dragState.initialLeft + deltaX)

          setDragOffset({
            left: newLeft - dragState.initialLeft,
            width: 0,
          })
        }
      },
      [dragState],
    )

    // Handle cell click to add dates for tasks without dates
    const handleCellClick = useCallback(
      (e: React.MouseEvent, task: Task, cellIndex: number) => {
        // Only handle if task has no dates
        if (task.start_date || task.due_date || !organizationId) return
        if (task.type === TaskType.List) return // Don't allow for list tasks

        e.stopPropagation()

        // Get the period for this cell
        const period = timePeriods[cellIndex]
        if (!period) return

        const periodStart = dayjs(period.start).tz(timezone)
        const now = dayjs().tz(timezone)

        // Set start date to the beginning of the period with current time
        const startDate = periodStart
          .hour(now.hour())
          .minute(now.minute())
          .second(now.second())

        // Set due date to end of the same day (or 1 day later for week/month views)
        const dueDate =
          viewMode === 'day'
            ? startDate.endOf('day')
            : startDate.add(1, 'day').endOf('day')

        const formattedStartDate = startDate.format('YYYY-MM-DD HH:mm:ss')
        const formattedDueDate = dueDate.format('YYYY-MM-DD HH:mm:ss')

        addUpdatingTaskId(task.id)
        updateTask(
          {
            color: task.color ?? undefined,
            due_date: formattedDueDate,
            organization_id: organizationId,
            parent_id: task.parent?.id ?? undefined,
            start_date: formattedStartDate,
            status: task.status ?? undefined,
            taskId: task.id,
            title: task.title,
          },
          {
            onError: () => toast.error('Failed to set task dates'),
            onSettled: (_data, _error, variables) =>
              removeUpdatingTaskId(variables.taskId),
            onSuccess: () => toast.success('Task dates set'),
          },
        )
      },
      [
        organizationId,
        timePeriods,
        timezone,
        viewMode,
        updateTask,
        addUpdatingTaskId,
        removeUpdatingTaskId,
      ],
    )

    // Handle drag end
    const handleDragEnd = useCallback(() => {
      if (!dragState || !organizationId) {
        setDragState(null)
        setDragOffset({ left: 0, width: 0 })
        return
      }

      // Skip update if there was no actual movement (just a click)
      const hasMovement =
        Math.abs(dragOffset.left) > 2 || Math.abs(dragOffset.width) > 2
      if (!hasMovement) {
        setDragState(null)
        setDragOffset({ left: 0, width: 0 })
        return
      }

      const { task, edge, initialLeft, initialWidth } = dragState
      const finalLeft = initialLeft + dragOffset.left
      const finalWidth = initialWidth + dragOffset.width

      // Get current dates (might have previous optimistic updates)
      const currentDates = getTaskDates(task)

      let newStartDate: dayjs.Dayjs | null = null
      let newDueDate: dayjs.Dayjs | null = null

      if (edge === 'move') {
        // Moving entire bar - calculate delta and apply to both dates
        const newStartPosition = calculateDateFromPosition(finalLeft, 'start')
        const oldStartPosition = calculateDateFromPosition(initialLeft, 'start')
        const daysDelta = newStartPosition.diff(oldStartPosition, 'day')
        const now = dayjs().tz(timezone)

        if (currentDates.start_date) {
          newStartDate = dayjs(currentDates.start_date)
            .tz(timezone)
            .add(daysDelta, 'day')
            .hour(now.hour())
            .minute(now.minute())
            .second(now.second())
        }
        if (currentDates.due_date) {
          newDueDate = dayjs(currentDates.due_date)
            .tz(timezone)
            .add(daysDelta, 'day')
            .hour(now.hour())
            .minute(now.minute())
            .second(now.second())
        }
      } else if (edge === 'start') {
        // Calculate new start date from the left position
        const newDate = calculateDateFromPosition(finalLeft, 'start')
        const now = dayjs().tz(timezone)
        newStartDate = newDate
          .hour(now.hour())
          .minute(now.minute())
          .second(now.second())

        // Validate date constraint
        if (currentDates.due_date) {
          const dueDate = dayjs(currentDates.due_date).tz(timezone)
          if (newStartDate.isAfter(dueDate)) {
            toast.error('Start date cannot be after due date')
            setDragState(null)
            setDragOffset({ left: 0, width: 0 })
            return
          }
        }
      } else {
        // Calculate new due date from the right edge position
        const rightEdge = finalLeft + finalWidth
        const newDate = calculateDateFromPosition(rightEdge, 'end')
        const now = dayjs().tz(timezone)
        newDueDate = newDate
          .hour(now.hour())
          .minute(now.minute())
          .second(now.second())

        // Validate date constraint
        if (currentDates.start_date) {
          const startDate = dayjs(currentDates.start_date).tz(timezone)
          if (newDueDate.isBefore(startDate)) {
            toast.error('Due date cannot be before start date')
            setDragState(null)
            setDragOffset({ left: 0, width: 0 })
            return
          }
        }
      }

      // Format changed dates, default to existing values as-is
      const formattedStartDate = newStartDate
        ? newStartDate.format('YYYY-MM-DD HH:mm:ss')
        : currentDates.start_date
      const formattedDueDate = newDueDate
        ? newDueDate.format('YYYY-MM-DD HH:mm:ss')
        : currentDates.due_date

      // Apply optimistic update immediately
      setOptimisticDates((prev) => ({
        ...prev,
        [task.id]: {
          due_date: formattedDueDate ?? undefined,
          start_date: formattedStartDate ?? undefined,
        },
      }))

      // Store previous values for rollback
      const previousDates = {
        due_date: currentDates.due_date,
        start_date: currentDates.start_date,
      }

      // Debug: log what's being sent
      console.log('Drag update:', {
        edge,
        originalDueDate: currentDates.due_date,
        originalStartDate: currentDates.start_date,
        sendingDueDate: formattedDueDate,
        sendingStartDate: formattedStartDate,
      })

      addUpdatingTaskId(task.id)
      updateTask(
        {
          color: task.color,
          due_date: formattedDueDate ?? undefined,
          organization_id: organizationId,
          parent_id: task.parent?.id ?? undefined,
          start_date: formattedStartDate ?? undefined,
          status: task.status ?? undefined,
          taskId: task.id,
          title: task.title,
        },
        {
          onError: () => {
            // Rollback optimistic update on error
            setOptimisticDates((prev) => ({
              ...prev,
              [task.id]: previousDates,
            }))
            toast.error(
              `Failed to update ${edge === 'move' ? 'task dates' : edge === 'start' ? 'start date' : 'due date'}`,
            )
          },
          onSettled: (_data, _error, variables) =>
            removeUpdatingTaskId(variables.taskId),
          onSuccess: () => {
            // Clear optimistic update on success (server data will be used)
            setOptimisticDates((prev) => {
              const { [task.id]: _, ...rest } = prev
              return rest
            })
          },
        },
      )

      setDragState(null)
      setDragOffset({ left: 0, width: 0 })
    }, [
      dragState,
      dragOffset,
      organizationId,
      calculateDateFromPosition,
      updateTask,
      getTaskDates,
      timezone,
      addUpdatingTaskId,
      removeUpdatingTaskId,
    ])

    // Attach/detach mouse event listeners for dragging
    useEffect(() => {
      if (dragState) {
        window.addEventListener('mousemove', handleDragMove)
        window.addEventListener('mouseup', handleDragEnd)

        return () => {
          window.removeEventListener('mousemove', handleDragMove)
          window.removeEventListener('mouseup', handleDragEnd)
        }
      }
    }, [dragState, handleDragMove, handleDragEnd])

    // Calculate current day/week/month indicator position - memoized
    const currentPeriodIndex = useMemo(() => {
      return timePeriods.findIndex((period) => {
        const periodStart = dayjs(period.start).tz(timezone)
        const periodEnd = dayjs(period.end).tz(timezone)
        return (
          currentDay.isSameOrAfter(periodStart) &&
          currentDay.isSameOrBefore(periodEnd)
        )
      })
    }, [timePeriods, timezone, currentDay])

    useImperativeHandle(
      ref,
      () => ({
        scrollToCurrentPeriod: () => {
          if (containerRef.current && currentPeriodIndex >= 0) {
            const indicatorPosition =
              currentPeriodIndex * cellWidth + cellWidth / 2
            const containerWidth = containerRef.current.clientWidth
            const scrollPos = indicatorPosition - containerWidth / 2
            containerRef.current.scrollTo({
              behavior: 'smooth',
              left: Math.max(0, scrollPos),
            })
          }
        },
      }),
      [currentPeriodIndex, cellWidth],
    )

    // Calculate dependency lines
    const dependencyLines = useMemo(() => {
      const lines: {
        fromX: number
        fromY: number
        toX: number
        toY: number
        fromTaskId: string
        toTaskId: string
      }[] = []

      // Create a map of task id to row index
      const taskIndexMap = new Map<string, number>()
      tasks.forEach((task, index) => {
        taskIndexMap.set(task.id, index)
      })

      // For each task, calculate lines to its dependencies
      const horizontalPadding = 8 // Horizontal gap from task bar edges

      tasks.forEach((task, taskIndex) => {
        if (!task.dependencies || task.dependencies.length === 0) return

        const taskDates = getTaskDates(task)
        if (!taskDates.start_date) return

        const taskPosition = calculateBarPosition(
          new Date(taskDates.start_date),
          new Date(taskDates.due_date || taskDates.start_date),
        )

        // Start point: right edge of this (dependent) task's bar (with padding)
        const fromX =
          taskPosition.leftPx + taskPosition.widthPx + horizontalPadding
        const rowCenterY = (taskIndex + 1) * height + height / 2 // +1 for header row

        task.dependencies.forEach((dep) => {
          const depIndex = taskIndexMap.get(dep.id)
          if (depIndex === undefined) return

          const depTask = tasks[depIndex]
          const depDates = getTaskDates(depTask)
          if (!depDates.due_date) return

          const depPosition = calculateBarPosition(
            new Date(depDates.start_date || depDates.due_date),
            new Date(depDates.due_date),
          )

          // End point: left edge of dependency task's bar (with padding) - arrow points here
          const toX = depPosition.leftPx - horizontalPadding
          const depRowCenterY = (depIndex + 1) * height + height / 2 // +1 for header row

          // Both start and end points are centered on their respective task bars
          const fromY = rowCenterY // Start at center of dependent task bar
          const toY = depRowCenterY // Arrow points at center of dependency task bar

          lines.push({
            fromTaskId: dep.id,
            fromX,
            fromY,
            toTaskId: task.id,
            toX,
            toY,
          })
        })
      })

      return lines
    }, [tasks, getTaskDates, calculateBarPosition, height])

    // Memoize static styles to avoid recreating objects on each render
    const currentPeriodIndicatorStyle = useMemo(
      () =>
        currentPeriodIndex >= 0
          ? {
              backgroundColor: '#2196f3',
              bottom: 0,
              left: `${currentPeriodIndex * cellWidth + cellWidth / 2}px`,
              pointerEvents: 'none' as const,
              position: 'absolute' as const,
              top: height,
              width: '2px',
              zIndex: 1,
            }
          : null,
      [currentPeriodIndex, cellWidth, height],
    )

    const tableWidth = useMemo(
      () => timePeriods.length * cellWidth,
      [timePeriods.length, cellWidth],
    )

    const tableSx = useMemo(
      () => ({
        borderCollapse: 'collapse' as const,
        tableLayout: 'fixed' as const,
        width: tableWidth,
      }),
      [tableWidth],
    )

    const headerCellSx = useMemo(
      () => ({
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        fontSize: viewMode === 'day' ? 12 : 11,
        height,
        overflow: 'hidden',
        position: 'sticky' as const,
        px: 1,
        py: 0.5,
        textOverflow: 'ellipsis',
        top: 0,
        whiteSpace: 'nowrap' as const,
        width: cellWidth,
        zIndex: 2,
      }),
      [viewMode, cellWidth, height],
    )

    return (
      <TableContainer
        ref={containerRef}
        sx={{ flex: 1, overflow: 'auto', position: 'relative' }}
      >
        {/* Current period indicator line */}
        {currentPeriodIndicatorStyle && (
          <div style={currentPeriodIndicatorStyle} />
        )}
        {/* Dependency lines SVG overlay */}
        {dependencyLines.length > 0 && (
          <svg
            style={{
              height: (tasks.length + 1) * height,
              left: 0,
              pointerEvents: 'none',
              position: 'absolute',
              top: 0,
              width: tableWidth,
              zIndex: 0,
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerHeight="5"
                markerWidth="6"
                orient="auto"
                refX="6"
                refY="2.5"
              >
                <polygon fill={dependencyLineColor} points="0 0, 6 2.5, 0 5" />
              </marker>
              <marker
                id="arrowhead-highlighted"
                markerHeight="5"
                markerWidth="6"
                orient="auto"
                refX="6"
                refY="2.5"
              >
                <polygon
                  fill={dependencyLineHighlightColor}
                  points="0 0, 6 2.5, 0 5"
                />
              </marker>
            </defs>
            {dependencyLines.map((line, index) => {
              // Calculate orthogonal path (only horizontal and vertical lines)
              // Route below the dependent bar, then to the left of dependency, then into it
              const verticalOffset = 22 // Offset to go below task bars
              const horizontalOffset = 15 // Offset to the left of dependency bar

              // First vertical: go down below the dependent bar
              const firstVerticalY = line.fromY + verticalOffset
              // Horizontal stop point: to the left of the dependency bar
              const horizontalStopX = line.toX - horizontalOffset

              // Path: right of dependent → down → left → down to dependency level → right into dependency
              const path = `M ${line.fromX} ${line.fromY} 
                        V ${firstVerticalY} 
                        H ${horizontalStopX} 
                        V ${line.toY} 
                        H ${line.toX}`

              const isHighlighted =
                highlightedTaskId === line.fromTaskId ||
                highlightedTaskId === line.toTaskId

              return (
                <path
                  d={path}
                  fill="none"
                  key={`${line.fromTaskId}-${line.toTaskId}-${index}`}
                  markerEnd={
                    isHighlighted
                      ? 'url(#arrowhead-highlighted)'
                      : 'url(#arrowhead)'
                  }
                  stroke={
                    isHighlighted
                      ? dependencyLineHighlightColor
                      : dependencyLineColor
                  }
                  strokeDasharray={
                    dependencyLineStyle === 'solid' ? 'none' : '4,2'
                  }
                  strokeWidth={isHighlighted ? 2 : 1.5}
                />
              )
            })}
          </svg>
        )}
        <Table stickyHeader={true} sx={tableSx}>
          <TableHead>
            <TableRow sx={{ height }}>
              {timePeriods.map((period, index) => (
                <TableCell align="center" key={index} sx={headerCellSx}>
                  <Stack>
                    <Typography fontSize={10} fontWeight={600}>
                      {period.label}
                    </Typography>
                    {period.start && (
                      <Typography color="text.secondary" fontSize={10}>
                        {period.subLabel}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {tasks.map((task) => (
              <TaskRow
                calculateBarPosition={calculateBarPosition}
                cellWidth={cellWidth}
                disabled={updatingTaskIds.has(task.id)}
                dragOffset={dragOffset}
                dragState={dragState}
                getTaskDates={getTaskDates}
                handleCellClick={handleCellClick}
                handleDragStart={handleDragStart}
                height={height}
                highlightedTaskId={highlightedTaskId}
                isWeekendPeriod={isWeekendPeriod}
                key={task.id}
                markWeekends={markWeekends}
                setHighlightedTaskId={setHighlightedTaskId}
                task={task}
                timePeriods={timePeriods}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  },
)

TaskBar.displayName = 'TaskBar'

export default memo(TaskBar)

// Memoized task row component to prevent unnecessary re-renders
interface TaskRowProps {
  task: Task
  timePeriods: TimePeriod[]
  getTaskDates: (task: Task) => {
    due_date: string | null | undefined
    start_date: string | null | undefined
  }
  calculateBarPosition: (
    taskStart: Date,
    taskEnd: Date,
  ) => {
    left: string
    leftPx: number
    startPeriodIndex: number
    width: string
    widthPx: number
  }
  dragState: DragState | null
  dragOffset: { left: number; width: number }
  height: number
  cellWidth: number
  disabled?: boolean
  highlightedTaskId: string | null
  setHighlightedTaskId: (id: string | null) => void
  handleCellClick: (e: React.MouseEvent, task: Task, cellIndex: number) => void
  handleDragStart: (
    e: React.MouseEvent,
    task: Task,
    edge: 'start' | 'end' | 'move',
    currentLeft: number,
    currentWidth: number,
  ) => void
  isWeekendPeriod: (period: TimePeriod) => boolean
  markWeekends: boolean
}

const TaskRow = memo(
  ({
    task,
    timePeriods,
    getTaskDates,
    calculateBarPosition,
    dragState,
    dragOffset,
    height,
    cellWidth,
    disabled = false,
    highlightedTaskId,
    setHighlightedTaskId,
    handleCellClick,
    handleDragStart,
    isWeekendPeriod,
    markWeekends,
  }: TaskRowProps) => {
    // Use optimistic dates if available
    const { start_date, due_date } = getTaskDates(task)
    const taskStartDate = start_date ? new Date(start_date) : null
    const taskEndDate = due_date ? new Date(due_date) : null

    const hasValidDates = Boolean(taskStartDate && taskEndDate)

    const position = useMemo(
      () =>
        hasValidDates && taskStartDate && taskEndDate
          ? calculateBarPosition(taskStartDate, taskEndDate)
          : null,
      [hasValidDates, taskStartDate, taskEndDate, calculateBarPosition],
    )

    // Apply drag offset if this task is being dragged
    const isDragging = dragState?.taskId === task.id
    const adjustedLeft = position
      ? isDragging
        ? position.leftPx + dragOffset.left
        : position.leftPx
      : 0
    const adjustedWidth = position
      ? isDragging
        ? position.widthPx + dragOffset.width
        : position.widthPx
      : 0

    const isListTask = task.type === TaskType.List
    const barHeight = height / (isListTask ? 2.5 : 2)

    const handleRowClick = useCallback(() => {
      setHighlightedTaskId(task.id)
    }, [setHighlightedTaskId, task.id])

    // Memoize cell sx to avoid recreating on each render
    const getCellSx = useCallback(
      (period: TimePeriod) => {
        const isWeekend = markWeekends && isWeekendPeriod(period)
        return {
          '&:hover': hasValidDates
            ? undefined
            : {
                backgroundColor: 'action.hover',
                cursor: 'cell',
              },
          ...(isWeekend && {
            background:
              'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)',
          }),
          border: '1px solid',
          borderColor: 'divider',
          height,
          overflow: 'visible',
          position: 'relative' as const,
          px: 0,
          py: 0,
          width: cellWidth,
        }
      },
      [hasValidDates, height, cellWidth, markWeekends, isWeekendPeriod],
    )

    // Memoize bar sx
    const barSx = useMemo(
      () => ({
        '&:hover .drag-handle': {
          opacity: disabled ? 0 : 1,
        },
        left: `${adjustedLeft}px`,
        maxWidth: `${cellWidth * timePeriods.length}px`,
        opacity: disabled ? 0.5 : isListTask ? 0.6 : 1,
        overflow: 'visible',
        pointerEvents: disabled ? ('none' as const) : ('auto' as const),
        position: 'absolute' as const,
        top: '50%',
        transform: 'translateY(-50%)',
        transition: isDragging ? 'none' : undefined,
        width: `${adjustedWidth}px`,
        zIndex: isDragging ? 10 : 1,
        ...(highlightedTaskId === task.id && {
          outline: '2px solid',
          outlineColor: 'common.blue',
          outlineOffset: '2px',
        }),
      }),
      [
        adjustedLeft,
        adjustedWidth,
        cellWidth,
        timePeriods.length,
        isListTask,
        isDragging,
        highlightedTaskId,
        task.id,
        disabled,
      ],
    )

    // Memoize static drag handle styles
    const dragHandleSx = useMemo(
      () => ({
        '&::after': {
          bgcolor: 'rgba(255, 255, 255, 0.6)',
          borderRadius: '2px',
          content: '""',
          height: '12px',
          left: '50%',
          position: 'absolute' as const,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '3px',
        },
        '&:hover': {
          bgcolor: 'rgba(0, 0, 0, 0.2)',
        },
        bottom: 0,
        cursor: 'ew-resize',
        opacity: 0,
        position: 'absolute' as const,
        top: 0,
        transition: 'opacity 0.2s',
        width: '10px',
        zIndex: 1,
      }),
      [],
    )

    const leftDragHandleSx = useMemo(
      () => ({
        ...dragHandleSx,
        borderRadius: '4px 0 0 4px',
        left: 0,
      }),
      [dragHandleSx],
    )

    const rightDragHandleSx = useMemo(
      () => ({
        ...dragHandleSx,
        borderRadius: '0 4px 4px 0',
        right: 0,
      }),
      [dragHandleSx],
    )

    const moveAreaSx = useMemo(
      () => ({
        cursor: isListTask ? 'default' : 'move',
        display: 'flex',
        px: 1.5,
      }),
      [isListTask],
    )

    const handleStartDrag = useCallback(
      (e: React.MouseEvent) => {
        if (position) {
          handleDragStart(e, task, 'start', position.leftPx, position.widthPx)
        }
      },
      [handleDragStart, task, position],
    )

    const handleMoveDrag = useCallback(
      (e: React.MouseEvent) => {
        if (!isListTask && position) {
          handleDragStart(e, task, 'move', position.leftPx, position.widthPx)
        }
      },
      [handleDragStart, task, isListTask, position],
    )

    const handleEndDrag = useCallback(
      (e: React.MouseEvent) => {
        if (position) {
          handleDragStart(e, task, 'end', position.leftPx, position.widthPx)
        }
      },
      [handleDragStart, task, position],
    )

    return (
      <TableRow onClick={handleRowClick} sx={{ cursor: 'pointer', height }}>
        {timePeriods.map((period, index) => (
          <TableCell
            key={index}
            onClick={(e) => handleCellClick(e, task, index)}
            sx={getCellSx(period)}
          >
            {/* Render the task bar only once per row */}
            {index === 0 && position && (
              <Stack
                alignItems="center"
                bgcolor={task.color ?? 'grey.300'}
                borderRadius={1}
                className="task-bar"
                direction="row"
                height={barHeight}
                justifyContent="flex-start"
                sx={barSx}
              >
                {/* Left drag handle for start date */}
                {!isListTask && (
                  <Box
                    className="drag-handle"
                    onMouseDown={handleStartDrag}
                    sx={leftDragHandleSx}
                  />
                )}

                <Box flex={1} onMouseDown={handleMoveDrag} sx={moveAreaSx}>
                  <Typography
                    color="common.white"
                    fontSize={isListTask ? 10 : 12}
                    noWrap={true}
                    sx={typographySx}
                  >
                    {task.title}
                  </Typography>
                </Box>

                {/* Right drag handle for due date */}
                {!isListTask && (
                  <Box
                    className="drag-handle"
                    onMouseDown={handleEndDrag}
                    sx={rightDragHandleSx}
                  />
                )}
              </Stack>
            )}
          </TableCell>
        ))}
      </TableRow>
    )
  },
)

TaskRow.displayName = 'TaskRow'

// Static styles that don't depend on props - defined outside component
const typographySx = {
  pointerEvents: 'none' as const,
  userSelect: 'none' as const,
}
