import { Divider, Stack } from '@mui/material'
import { Box } from '@mui/system'
import { TaskType } from '@zunou-graphql/core/graphql'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'

import { AddItemDialog } from './components/AddItemDialog'
import { TaskDetailModal } from './components/TaskDetailModal'
import { TaskToolbar } from './components/Toolbar'
import { useTaskViewStore } from './store/useTaskViewStore'
import { useTimelineStore } from './store/useTimelineStore'
import { flattenTasks, taskToTimelineItem } from './utils/taskAdapter'
import { GroupByField } from './utils/taskGrouping'
import { CalendarView } from './View/CalendarView/CalendarView'
import GanttChartView from './View/GanttChartView'
import { KanbanView } from './View/KanbanView'
import { EmptyTaskState } from './View/ListView/EmptyTaskState'
import { PulseTaskList } from './View/ListView/TaskList'
import { OptionsPanel } from './View/OptionsPanel/OptionsPanel'
import { TableView } from './View/TableView/TableView'

export type TaskViewType = 'list' | 'table' | 'calendar' | 'timeline'

export const PulseTaskPage = () => {
  const [searchParams] = useSearchParams()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { isLoadingTasks, pulseTasks } = useTaskStore()
  const { pulseActions, addActionToPulse } = usePulseStore()

  const currentView = useTaskViewStore((state) => state.currentView)
  const viewConfig = useTimelineStore((state) => state.viewConfig)
  const groupByField = viewConfig.groupBy.field as GroupByField

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
  const [addItemMode, setAddItemMode] = useState<'milestone' | 'task'>('task')

  // Auto-expand all task lists when grouping is active
  useEffect(() => {
    if (groupByField && pulseId) {
      const taskListIds = pulseTasks
        .filter((task) => task.type === TaskType.List)
        .map((task) => task.id)

      const pulseAction = pulseActions.find((action) => action.id === pulseId)
      const currentExpandedLists = pulseAction?.expandedTaskList || []

      // find lists that are not expanded and expand them
      const listsToExpand = taskListIds.filter(
        (id) => !currentExpandedLists.includes(id),
      )

      if (listsToExpand.length > 0) {
        addActionToPulse({
          id: pulseId,
          updates: {
            expandedTaskList: [...currentExpandedLists, ...listsToExpand],
          },
        })
      }
    }
  }, [groupByField, pulseId])

  // Use dummy data if enabled, otherwise use real tasks
  // When using dummy data, don't depend on pulseTasks to avoid loops
  const tasksToDisplay = useMemo(() => {
    return pulseTasks
  }, [pulseTasks])

  // Convert tasks to timeline items for calendar/timeline views
  // Flatten tasks first to include all children in the conversion
  const timelineItems = useMemo(() => {
    if (!organizationId || tasksToDisplay.length === 0) return []
    // Flatten tasks to include children, then convert all to timeline items
    const flattenedTasks = flattenTasks(tasksToDisplay)
    return flattenedTasks.map((task) =>
      taskToTimelineItem(task, organizationId),
    )
  }, [tasksToDisplay, organizationId])

  // Always update timeline store with converted tasks when they change
  // This ensures TableView and other views reflect task updates immediately
  useEffect(() => {
    if (organizationId) {
      const timelineStore = useTimelineStore.getState()
      timelineStore.setItems(timelineItems)

      // Map Task view types to Timeline view types
      const timelineViewMap: Record<string, 'table' | 'timeline' | 'calendar'> =
        {
          calendar: 'calendar',
          table: 'table',
          timeline: 'timeline',
        }
      if (timelineViewMap[currentView]) {
        if (timelineStore.currentView !== timelineViewMap[currentView]) {
          timelineStore.setCurrentView(timelineViewMap[currentView])
        }
      }
    }
  }, [timelineItems, currentView, organizationId])

  useEffect(() => {
    const selectedTaskId = searchParams.get('id')

    if (selectedTaskId) {
      setSelectedTaskId(selectedTaskId)
    }
  }, [searchParams])

  const handleOpenCreateTaskListModal = () => {
    setAddItemMode('milestone')
    setIsAddItemDialogOpen(true)
  }

  const handleOpenCreateTaskModal = () => {
    setAddItemMode('task')
    setIsAddItemDialogOpen(true)
  }

  const renderView = () => {
    switch (currentView) {
      case 'table':
        return <TableView />
      case 'calendar':
        return <CalendarView />
      case 'gantt':
        return <GanttChartView />
      case 'kanban':
        return <KanbanView />
      case 'list':
      default:
        return (
          <Stack height="100%" overflow="auto">
            {isLoadingTasks ? (
              <Stack
                alignItems="center"
                height="100%"
                justifyContent="center"
                width="100%"
              >
                <LoadingSpinner />
              </Stack>
            ) : tasksToDisplay.length > 0 ? (
              <Stack height="100%" justifyContent="start" spacing={3}>
                <PulseTaskList onSelect={setSelectedTaskId} />
                <Divider />
              </Stack>
            ) : (
              <EmptyTaskState
                onOpenCreateTaskListModal={handleOpenCreateTaskListModal}
                onOpenCreateTaskListSection={handleOpenCreateTaskListModal}
                onOpenCreateTaskModal={handleOpenCreateTaskModal}
                onOpenCreateTaskSection={handleOpenCreateTaskModal}
              />
            )}
          </Stack>
        )
    }
  }

  return (
    <Stack
      direction="row"
      sx={{
        backgroundColor: 'background.default',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Main Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          overflow: 'hidden',
          transition: 'margin 0.2s ease',
        }}
      >
        <Stack
          flex={1}
          overflow="hidden"
          sx={{ backgroundColor: 'background.default', height: '100%' }}
        >
          <Stack
            alignItems="center"
            borderBottom={1}
            borderColor="divider"
            direction="row"
            justifyContent="space-between"
            sx={{ backgroundColor: 'background.paper' }}
          >
            <TaskToolbar
              onCreateMilestone={handleOpenCreateTaskListModal}
              onCreateMilestoneItem={handleOpenCreateTaskModal}
            />
          </Stack>
          <Box
            flexGrow={1}
            minHeight={0}
            sx={{ backgroundColor: 'background.paper' }}
          >
            {renderView()}
          </Box>
        </Stack>
      </Box>

      {/* Options Panel - Always visible */}
      <OptionsPanel />

      <AddItemDialog
        initialMode={addItemMode === 'milestone' ? 'milestone' : 'task'}
        onClose={() => setIsAddItemDialogOpen(false)}
        open={isAddItemDialogOpen}
      />

      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          taskId={selectedTaskId}
        />
      )}
    </Stack>
  )
}
