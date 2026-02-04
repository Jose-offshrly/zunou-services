import { Divider, Stack } from '@mui/material'
import { PulseCategory, Task, TaskType } from '@zunou-graphql/core/graphql'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePulseStore } from '~/store/usePulseStore'

import { TaskDetailModal } from '../../../components'
import { SORT_OPTION_TO_ORDER, SortOption, TaskSortMenu } from './TaskSortMenu'
import UnscheduledCard from './UnscheduledCard'

export default function UnscheduledContainer() {
  const { pulseId, organizationId } = useParams()
  const { pulse } = usePulseStore()
  const { user } = useAuthContext()
  const isPersonalPulse = pulse?.category === PulseCategory.Personal
  const [sortBy, setSortBy] = useState<SortOption>('Status')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { data: tasksData, isLoading: isLoadingFilteredTasks } =
    useGetTasksQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        isScheduled: false,
        orderBy: SORT_OPTION_TO_ORDER[sortBy],
        organizationId,
        ...(isPersonalPulse ? { userId: user?.id } : { entityId: pulseId }),
      },
    })

  const allTasks = tasksData?.tasks ?? []

  // Flatten tasks to only include TaskType.Task (not lists), then sort
  const tasks = useMemo(() => {
    const flattened: Task[] = []

    allTasks.forEach((task) => {
      if (task.type === TaskType.Task) {
        flattened.push(task)
      }
      if (task.children && task.children.length > 0) {
        task.children.forEach((child) => {
          if (child.type === TaskType.Task) {
            flattened.push(child)
          }
        })
      }
    })

    // Sort the flattened list based on selected sort option
    return flattened.sort((a, b) => {
      switch (sortBy) {
        case 'Status': {
          const statusOrder = ['TODO', 'INPROGRESS', 'COMPLETED', 'OVERDUE']
          const aIndex = statusOrder.indexOf(a.status ?? '')
          const bIndex = statusOrder.indexOf(b.status ?? '')
          return aIndex - bIndex
        }
        case 'Priority': {
          const priorityOrder = ['URGENT', 'HIGH', 'MEDIUM', 'LOW']
          const aIndex = priorityOrder.indexOf(a.priority ?? '')
          const bIndex = priorityOrder.indexOf(b.priority ?? '')
          return aIndex - bIndex
        }
        case 'Due Date': {
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        }
        case 'Assignee': {
          const aName = a.assignees?.[0]?.user?.name ?? ''
          const bName = b.assignees?.[0]?.user?.name ?? ''
          return aName.localeCompare(bName)
        }
        default:
          return 0
      }
    })
  }, [allTasks, sortBy])

  const handleCloseTaskDetailModal = () => {
    setSelectedTaskId(null)
  }

  if (isLoadingFilteredTasks)
    return (
      <Stack alignItems="center" height="100%" justifyContent="center">
        <LoadingSpinner />
      </Stack>
    )

  return (
    <Stack spacing={0}>
      <TaskSortMenu
        onSortChange={setSortBy}
        sortBy={sortBy}
        taskCount={tasks.length}
      />
      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1}>
        {tasks.map((task) => (
          <UnscheduledCard
            key={task.id}
            onClick={setSelectedTaskId}
            task={task}
          />
        ))}
      </Stack>

      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={handleCloseTaskDetailModal}
          taskId={selectedTaskId}
        />
      )}
    </Stack>
  )
}
