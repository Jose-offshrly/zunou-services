import {
  DateRangeInput,
  PulseCategory,
  TaskPriority,
  TaskStatus,
} from '@zunou-graphql/core/graphql'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import dayjs from 'dayjs'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useAuthContext } from 'zunou-react/contexts/AuthContext'

import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'

export const TaskPriorityRank: Record<TaskPriority, number> = {
  [TaskPriority.Low]: 1,
  [TaskPriority.Medium]: 2,
  [TaskPriority.High]: 3,
  [TaskPriority.Urgent]: 4,
} as const

export const TaskStatusRank: Record<TaskStatus, number> = {
  [TaskStatus.Todo]: 1,
  [TaskStatus.Inprogress]: 2,
  [TaskStatus.Overdue]: 3,
  [TaskStatus.Completed]: 4,
}

const initialTaskFilters = {
  assigneeId: null,
  date: null,
  dateRange: null,
  entityId: null,
  excludeAssigneeId: null,
  excludePriority: null,
  excludeStatus: null,
  isPersonalTasks: null,
  priority: null,
  search: '',
  showCompletedTasks: false,
  status: null,
}

export const useHooks = () => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const userId = user?.id
  const { pulse } = usePulseStore()
  const isPersonalPulse = pulse?.category === PulseCategory.Personal

  const {
    setIsLoadingTasks,
    setPulseTasks,
    filters: taskFilters,
    setIsTaskFilterActive,
    setFilters,
  } = useTaskStore()
  const hasFilters = Object.values(taskFilters).some(Boolean)

  useEffect(() => {
    const hasActiveFilter = Object.values(taskFilters).some(
      (value) => value !== null && value !== '',
    )
    setIsTaskFilterActive(hasActiveFilter)
  }, [taskFilters])

  const {
    data: filteredTasksData,
    isLoading: isLoadingFilteredTasks,
    isFetching: isFetchingTasks,
  } = useGetTasksQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      ...taskFilters,
      ...(isPersonalPulse && !taskFilters.isPersonalTasks
        ? { entityId: taskFilters.entityId || undefined, userId: user?.id }
        : { entityId: pulseId }),
    }, // Disable query when using dummy data
  })
  const filteredTasks = filteredTasksData?.tasks ?? []

  useEffect(() => {
    setIsLoadingTasks(isLoadingFilteredTasks)
    setPulseTasks(filteredTasks)
  }, [isFetchingTasks, isLoadingFilteredTasks, filteredTasksData])

  const handleFilterByAssignee = (assigneeId: string) => {
    setFilters((prev) => ({ ...prev, assigneeId }))
  }

  const handleFilterByPriority = (priority: TaskPriority) => {
    setFilters((prev) => ({ ...prev, priority }))
  }

  const handleFilterByStatus = (status: TaskStatus) => {
    setFilters((prev) => ({ ...prev, status }))
  }

  const handleFilterByDate = (date: Date) => {
    setFilters((prev) => ({
      ...prev,
      date: dayjs(date).format('YYYY-MM-DD'),
    }))
  }

  const handleFilterByDateRange = (dateRange: DateRangeInput) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        from: dayjs(dateRange.from).format('YYYY-MM-DD'),
        to: dayjs(dateRange.to).format('YYYY-MM-DD'),
      },
    }))
  }

  const handleSearchFilter = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const handleTogglePersonalTasksFilter = () => {
    setFilters((prev) => ({ ...prev, isPersonalTasks: !prev.isPersonalTasks }))
  }

  const handleToggleMyTasksFilter = () => {
    if (!user) return

    taskFilters.assigneeId === user.id
      ? handleClearAssigneeFilter()
      : handleFilterByAssignee(user.id)
  }

  const handleFilterByPulse = (pulseId: string) => {
    setFilters((prev) => ({ ...prev, entityId: pulseId }))
  }

  const handleClearPulseFilter = () => {
    setFilters((prev) => ({ ...prev, entityId: null }))
  }

  const handleClearPriorityFilter = () => {
    setFilters((prev) => ({ ...prev, priority: null }))
  }

  const handleClearAssigneeFilter = () => {
    setFilters((prev) => ({ ...prev, assigneeId: null }))
  }

  const handleClearSearchFilter = () => {
    setFilters((prev) => ({ ...prev, search: '' }))
  }

  const handleClearStatusFilter = () => {
    setFilters((prev) => ({ ...prev, status: null }))
  }

  const handleClearDateFilter = () => {
    setFilters((prev) => ({ ...prev, date: null, dateRange: null }))
  }

  const handleResetFilters = () => {
    setFilters(initialTaskFilters)
  }

  return {
    handleClearAssigneeFilter,
    handleClearDateFilter,
    handleClearPriorityFilter,
    handleClearPulseFilter,
    handleClearSearchFilter,
    handleClearStatusFilter,
    handleFilterByAssignee,
    handleFilterByDate,
    handleFilterByDateRange,
    handleFilterByPriority,
    handleFilterByPulse,
    handleFilterByStatus,
    handleResetFilters,
    handleSearchFilter,
    handleToggleMyTasksFilter,
    handleTogglePersonalTasksFilter,
    hasFilters,
    t,
    taskFilters,
    userId,
  }
}
