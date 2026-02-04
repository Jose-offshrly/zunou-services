import { Divider, Stack } from '@mui/material'
import {
  PulseCategory,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePulseStore } from '~/store/usePulseStore'

import { TaskDetailModal } from '../../../components'
import OverdueCard from './OverdueCard'
import { SORT_OPTION_TO_ORDER, SortOption, TaskSortMenu } from './TaskSortMenu'

export default function OverdueContainer() {
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
        orderBy: SORT_OPTION_TO_ORDER[sortBy],
        organizationId,
        status: TaskStatus.Overdue,
        ...(isPersonalPulse ? { userId: user?.id } : { entityId: pulseId }),
      },
    })

  const tasks = tasksData?.tasks ?? []

  const getTotalTaskCount = () => {
    let count = 0
    tasks.forEach((task) => {
      if (task.type === TaskType.Task) {
        count += 1
      } else if (task.type === TaskType.List && task.children) {
        task.children.forEach((child) => {
          if (child.type === TaskType.Task) {
            count += 1
          }
        })
      }
    })
    return count
  }

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
        taskCount={getTotalTaskCount()}
      />
      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1}>
        {tasks.map((task) => (
          <OverdueCard key={task.id} onClick={setSelectedTaskId} task={task} />
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
