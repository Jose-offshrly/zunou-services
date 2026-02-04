import { KeyboardArrowDown } from '@mui/icons-material'
import { Box, Menu, MenuItem, Stack, Typography } from '@mui/material'
import {
  PulseCategory,
  Task,
  TaskType,
  WeekendDisplay,
} from '@zunou-graphql/core/graphql'
import { useGetSettingQuery } from '@zunou-queries/core/hooks/useGetSettingQuery'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'

import BacklogPanel from './BacklogPanel'
import TaskBar, { TaskBarRef } from './TaskBar'
import TaskDetails from './TaskDetails'

// Extend dayjs with timezone plugins
dayjs.extend(utc)
dayjs.extend(timezone)

export interface MockTaskGantt {
  id: string
  name: string
  assignee: string
  status: string
  start: Date
  end: Date
  color: string
}

// Helper function to calculate parent task dates based on children
const calculateParentDates = (task: Task, tz: string): Task => {
  if (
    task.type !== TaskType.List ||
    !task.children ||
    task.children.length === 0
  ) {
    return task
  }

  // Filter children that have both start and end dates
  const childrenWithDates = task.children.filter(
    (child) => child.start_date && child.due_date,
  )

  if (childrenWithDates.length === 0) {
    return task
  }

  // Find earliest start date and latest end date among children
  const earliestStart = childrenWithDates.reduce<dayjs.Dayjs | null>(
    (earliest, child) => {
      const childStart = dayjs(child.start_date).tz(tz)
      return !earliest || childStart.isBefore(earliest) ? childStart : earliest
    },
    null,
  )

  const latestEnd = childrenWithDates.reduce<dayjs.Dayjs | null>(
    (latest, child) => {
      const childEnd = dayjs(child.due_date).tz(tz)
      return !latest || childEnd.isAfter(latest) ? childEnd : latest
    },
    null,
  )

  // Return task with updated dates
  return {
    ...task,
    due_date: latestEnd?.toISOString() || task.due_date,
    start_date: earliestStart?.toISOString() || task.start_date,
  }
}

export default function GanttChartView() {
  const { pulseId, organizationId } = useParams()
  const { pulse } = usePulseStore()
  const { user } = useAuthContext()
  const isPersonalPulse = pulse?.category === PulseCategory.Personal
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  )
  const [backlogOpen, setBacklogOpen] = useState(false)
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set())

  const addUpdatingTaskId = useCallback((taskId: string) => {
    setUpdatingTaskIds((prev) => new Set(prev).add(taskId))
  }, [])

  const removeUpdatingTaskId = useCallback((taskId: string) => {
    setUpdatingTaskIds((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }, [])

  // Refs for synchronized scrolling
  const leftScrollRef = useRef<HTMLDivElement>(null)
  const rightScrollRef = useRef<HTMLDivElement>(null)
  const taskBarRef = useRef<TaskBarRef>(null)

  const timezone = user?.timezone ?? 'UTC'

  const { filters: taskFilters } = useTaskStore()

  const { data: settingData } = useGetSettingQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(user?.id && organizationId),
    variables: {
      organizationId,
      userId: user?.id,
    },
  })

  const hideWeekend =
    settingData?.setting?.weekendDisplay?.toLowerCase() ===
    WeekendDisplay.Hidden.toLowerCase()
  const blockWeekend =
    settingData?.setting?.weekendDisplay?.toLowerCase() ===
    WeekendDisplay.BlockedOut.toLowerCase()

  const { data: tasksData, isLoading: isLoadingFilteredTasks } =
    useGetTasksQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
        ...taskFilters,
        ...(isPersonalPulse ? { userId: user?.id } : { entityId: pulseId }),
      },
    })

  // Transform tasks to preserve parent-child hierarchy and calculate parent dates
  const transformedTasks = useMemo(() => {
    if (!tasksData?.tasks) return []

    return tasksData.tasks.flatMap((task) => {
      if (task.type === TaskType.Task) {
        // Only add regular tasks if they don't have a parent (top-level tasks)
        // Tasks with a parent will be added when the parent is processed
        return task.parent?.id ? [] : [task]
      }

      // It's a parent task - calculate dates based on children, then add
      const parentWithCalculatedDates = calculateParentDates(task, timezone)
      return [parentWithCalculatedDates, ...(task.children ?? [])]
    })
  }, [tasksData, timezone])

  // Filter visible tasks based on collapsed state
  const visibleTasks = useMemo(() => {
    return transformedTasks.filter((task) => {
      // Always show parent tasks (LIST type)
      if (task.type === TaskType.List) {
        return true
      }

      // For TASK type, check if it has a parent
      if (task.parent?.id) {
        // It has a parent, check if the parent is collapsed
        return !collapsedTasks.has(task.parent.id)
      }

      // No parent means it's a top-level task, always show it
      return true
    })
  }, [transformedTasks, collapsedTasks])

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  // Check if any tasks have dates for the Gantt chart
  const hasTasksWithDates = useMemo(() => {
    return transformedTasks.some((task) => task.start_date && task.due_date)
  }, [transformedTasks])

  // Calculate date range based on tasks with timezone
  const { startDate, endDate } = useMemo(() => {
    // Filter tasks that have both start and end dates
    const tasksWithDates = transformedTasks.filter(
      (task) => task.start_date && task.due_date,
    )

    if (tasksWithDates.length === 0) {
      // Show current week when no tasks have dates
      return {
        endDate: dayjs().tz(timezone).endOf('week').toDate(),
        startDate: dayjs().tz(timezone).startOf('week').toDate(),
      }
    }

    // Find the earliest start date
    const earliestStart = tasksWithDates.reduce<dayjs.Dayjs | null>(
      (earliest, task) => {
        const taskStart = dayjs(task.start_date).tz(timezone)
        return !earliest || taskStart.isBefore(earliest) ? taskStart : earliest
      },
      null,
    )

    // Find the latest end date
    const latestEnd = tasksWithDates.reduce<dayjs.Dayjs | null>(
      (latest, task) => {
        const taskEnd = dayjs(task.due_date).tz(timezone)
        return !latest || taskEnd.isAfter(latest) ? taskEnd : latest
      },
      null,
    )

    // Use actual task dates with start of day for start and end of day for end
    return {
      endDate:
        latestEnd?.endOf('day').toDate() ||
        dayjs().tz(timezone).endOf('month').toDate(),
      startDate:
        earliestStart?.startOf('day').toDate() ||
        dayjs().tz(timezone).startOf('month').toDate(),
    }
  }, [transformedTasks, timezone])

  // Synchronized scroll handler
  const handleScroll =
    (source: 'left' | 'right') => (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop

      if (source === 'left' && rightScrollRef.current) {
        rightScrollRef.current.scrollTop = scrollTop
      } else if (source === 'right' && leftScrollRef.current) {
        leftScrollRef.current.scrollTop = scrollTop
      }
    }

  const handleTodayClick = () => {
    taskBarRef.current?.scrollToCurrentPeriod()
  }

  useEffect(() => {
    console.log('endDate', endDate)
  }, [endDate])

  if (isLoadingFilteredTasks) {
    return (
      <Stack alignItems="center" height="100%" justifyContent="center">
        <LoadingSpinner />
      </Stack>
    )
  }
  if (transformedTasks.length === 0) {
    return (
      <Stack alignItems="center" height="100%" justifyContent="center">
        <Typography variant="body2">No tasks yet.</Typography>
      </Stack>
    )
  }

  return (
    <Stack
      sx={{
        gap: 2,
        height: '100%',
        overflow: 'hidden',
        p: 2,
        position: 'relative',
        width: '100%',
      }}
    >
      {backlogOpen && <BacklogPanel onClose={() => setBacklogOpen(false)} />}
      <Stack
        alignItems="center"
        direction="row"
        gap={2}
        justifyContent="space-between"
      >
        {hasTasksWithDates && (
          <Stack alignItems="center" direction="row" gap={1}>
            <Button
              onClick={handleTodayClick}
              size="small"
              sx={{
                borderColor: 'grey.300',
                color: 'text.primary',
              }}
              variant="outlined"
            >
              Today
            </Button>
            <Button
              endIcon={<KeyboardArrowDown fontSize="small" />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              size="small"
              sx={{
                borderColor: 'grey.300',
                color: 'text.primary',
              }}
              variant="outlined"
            >
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
            </Button>
            <Menu
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              open={Boolean(anchorEl)}
            >
              <MenuItem
                onClick={() => {
                  setViewMode('day')
                  setAnchorEl(null)
                }}
                selected={viewMode === 'day'}
              >
                <Typography variant="body2">Day</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setViewMode('week')
                  setAnchorEl(null)
                }}
                selected={viewMode === 'week'}
              >
                <Typography variant="body2">Week</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setViewMode('month')
                  setAnchorEl(null)
                }}
                selected={viewMode === 'month'}
              >
                <Typography variant="body2">Month</Typography>
              </MenuItem>
            </Menu>
          </Stack>
        )}

        <Button
          onClick={() => setBacklogOpen(!backlogOpen)}
          size="small"
          sx={{
            borderColor: 'grey.300',
            color: 'text.primary',
          }}
          variant="outlined"
        >
          Backlogs
        </Button>
      </Stack>
      <Group orientation="horizontal" style={{ height: '100%', width: '100%' }}>
        {/* Left side - Task Details */}
        <Panel
          defaultSize={hasTasksWithDates ? (backlogOpen ? 30 : 40) : 100}
          minSize="10"
        >
          <Box
            onScroll={handleScroll('left')}
            ref={leftScrollRef}
            sx={{
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              height: '100%',
              msOverflowStyle: 'none',
              overflowX: 'hidden',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            <TaskDetails
              addUpdatingTaskId={addUpdatingTaskId}
              collapsedTasks={collapsedTasks}
              highlightedTaskId={highlightedTaskId}
              onToggleCollapse={toggleTaskCollapse}
              removeUpdatingTaskId={removeUpdatingTaskId}
              tasks={visibleTasks}
              updatingTaskIds={updatingTaskIds}
            />
          </Box>
        </Panel>

        {hasTasksWithDates && (
          <>
            <Separator
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              style={{
                alignItems: 'center',
                backgroundColor: theme.palette.grey[200],
                cursor: 'col-resize',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                width: 5,
              }}
            />

            {/* Right side - Task Bars */}
            <Panel defaultSize={backlogOpen ? 45 : 60} minSize="10">
              <Box
                onScroll={handleScroll('right')}
                ref={rightScrollRef}
                sx={{
                  '&::-webkit-scrollbar': {
                    height: '6px',
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '3px',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                  },
                  '&:hover': {
                    scrollbarColor: '#888 transparent',
                  },
                  '&:hover::-webkit-scrollbar-thumb': {
                    opacity: 1,
                  },
                  height: '100%',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  scrollbarColor: 'transparent transparent',
                  scrollbarWidth: 'thin',
                }}
              >
                <TaskBar
                  addUpdatingTaskId={addUpdatingTaskId}
                  endDate={endDate}
                  hideWeekends={hideWeekend}
                  highlightedTaskId={highlightedTaskId}
                  markWeekends={blockWeekend}
                  ref={taskBarRef}
                  removeUpdatingTaskId={removeUpdatingTaskId}
                  setHighlightedTaskId={setHighlightedTaskId}
                  startDate={startDate}
                  tasks={visibleTasks}
                  updatingTaskIds={updatingTaskIds}
                  viewMode={viewMode}
                />
              </Box>
            </Panel>
          </>
        )}
      </Group>
    </Stack>
  )
}
