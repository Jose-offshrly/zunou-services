import { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useQueryClient } from '@tanstack/react-query'
import {
  PulseCategory,
  PulseStatusOption,
  PulseType,
  TaskStatusType,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useCreatePulseTaskStatusMutation } from '@zunou-queries/core/hooks/useCreatePulseTaskStatusMutation'
import { useCreateTaskMutation } from '@zunou-queries/core/hooks/useCreateTaskMutation'
import { useDeletePulseTaskStatusMutation } from '@zunou-queries/core/hooks/useDeletePulseTaskStatusMutation'
import { useDeleteTaskMutation } from '@zunou-queries/core/hooks/useDeleteTaskMutation'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { useGetTaskQuery } from '@zunou-queries/core/hooks/useGetTaskQuery'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import { useUpdatePulseMutation } from '@zunou-queries/core/hooks/useUpdatePulseMutation'
import { useUpdatePulseTaskStatusMutation } from '@zunou-queries/core/hooks/useUpdatePulseTaskStatusMutation'
import { useUpdateTaskMutation } from '@zunou-queries/core/hooks/useUpdateTaskMutation'
import { useUpdateTaskStatusOrderMutation } from '@zunou-queries/core/hooks/useUpdateTaskStatusOrderMutation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'

/**
 * Hook for fetching a single task and related data for TaskDetailModal
 */
export const useTaskDetail = (taskId: string) => {
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pulse } = usePulseStore()

  // Fetch single task
  const { data: taskData, isLoading: isLoadingTask } = useGetTaskQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      taskId,
    },
  })
  const task = taskData?.task

  // Fetch all tasks for task lists dropdown
  const { data: tasksData } = useGetTasksQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!pulseId && !!task,
    variables: {
      entityId: pulseId,
      organizationId,
    },
  })
  const pulseTasks = tasksData?.tasks ?? []
  const taskLists = pulseTasks.filter((task) => task.type === TaskType.List)

  // Get pulse name from task entity or fallback to pulse store
  const pulseName = task?.entity?.name || pulse?.name || 'My Tasks'

  return {
    isLoadingTask,
    pulseName,
    pulseTasks,
    task,
    taskLists,
  }
}

/**
 * Hook for task mutations (update and delete) used in TaskDetailModal
 */
export const useTaskMutations = () => {
  const { t } = useTranslation(['common', 'tasks'])

  const { mutate: deleteTask, isPending: isPendingDeleteTask } =
    useDeleteTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { mutate: updateTask, isPending: isPendingUpdateTask } =
    useUpdateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleDeleteTask = (
    taskId: string,
    onSuccess?: () => void,
    onError?: () => void,
  ) => {
    deleteTask(
      {
        id: taskId,
      },
      {
        onError: () => {
          toast.error(t('task_deletion_error', { ns: 'tasks' }))
          onError?.()
        },
        onSuccess: () => {
          toast.success(t('task_deletion_success', { ns: 'tasks' }))
          onSuccess?.()
        },
      },
    )
  }

  const handleUpdateTask = (
    input: Parameters<typeof updateTask>[0],
    onSuccess?: () => void,
    onError?: () => void,
  ) => {
    updateTask(input, {
      onError: () => {
        toast.error(t('task_update_error', { ns: 'tasks' }))
        onError?.()
      },
      onSuccess: () => {
        toast.success(t('task_updated', { ns: 'tasks' }))
        onSuccess?.()
      },
    })
  }

  return {
    deleteTask: handleDeleteTask,
    isPendingDeleteTask,
    isPendingUpdateTask,
    updateTask: handleUpdateTask,
  }
}

/**
 * Hook for task creation used in AddItemDialog
 */
export const useTaskCreation = () => {
  const { t } = useTranslation(['common', 'tasks'])

  const { mutate: createTask, isPending: isPendingCreateTask } =
    useCreateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleCreateTask = (
    taskInput: Parameters<typeof createTask>[0][0],
    onSuccess?: () => void,
    onError?: (error: unknown) => void,
  ) => {
    createTask([taskInput], {
      onError: (error) => {
        const message = (
          error as { response?: { errors?: { message?: string }[] } }
        )?.response?.errors?.[0]?.message
        if (message) {
          toast.error(message)
        } else {
          toast.error(t('task_creation_error', { ns: 'tasks' }))
        }
        onError?.(error)
      },
      onSuccess: () => {
        toast.success(t('new_task_created', { ns: 'tasks' }))
        onSuccess?.()
      },
    })
  }

  return {
    createTask: handleCreateTask,
    isPendingCreateTask,
  }
}

/**
 * Hook for fetching pulses (used in AddItemDialog for personal pulses)
 */
export const usePulses = (enabled: boolean) => {
  const { organizationId } = useOrganization()

  const { data: pulsesData } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled,
    variables: {
      organizationId: organizationId,
    },
  })

  return {
    pulses: pulsesData?.pulses ?? [],
  }
}

/**
 * Hook for fetching task lists (used in both AddItemDialog and TaskDetailModal)
 */
export const useTaskLists = (
  entityId: string | undefined,
  enabled: boolean,
) => {
  const { organizationId } = useOrganization()

  const { data: tasksData } = useGetTasksQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: enabled && !!entityId,
    variables: {
      entityId,
      organizationId,
    },
  })

  const pulseTasks = tasksData?.tasks ?? []
  const taskLists = pulseTasks.filter((task) => task.type === TaskType.List)

  return {
    pulseTasks,
    taskLists,
  }
}

/**
 * Hook for AddItemDialog that combines all necessary data fetching
 */
export const useAddItemDialog = (
  open: boolean,
  selectedPulseIdForCreation: string | undefined,
) => {
  const { pulseCategory } = usePulseStore()
  const isPersonalPulse = pulseCategory === PulseCategory.Personal

  // Fetch pulses for personal pulse dropdown
  const { pulses: allPulses } = usePulses(isPersonalPulse && open)

  // Fetch task lists and all tasks for the selected pulse
  const { taskLists, pulseTasks } = useTaskLists(
    selectedPulseIdForCreation,
    open,
  )

  // Task creation mutation
  const { createTask, isPendingCreateTask } = useTaskCreation()

  return {
    allPulses,
    createTask,
    isPendingCreateTask,
    pulseTasks,
    taskLists,
  }
}

/**
 * Hook for StatusManager component
 */
export type StatusType = 'default' | 'custom'

export interface StatusManagerState {
  statusType: StatusType
  customStatuses: TaskStatusType[]
  editingStatus: TaskStatusType | null
  kebabAnchorEl: { element: HTMLElement; status: TaskStatusType } | null
  colorPickerAnchorEl: HTMLElement | null
  newStatusLabel: string
  newStatusColor: string
  editingLabel: string
  editingColor: string
}

// Constants
const DEFAULT_COLOR = '#2196F3'
const UUID_LENGTH = 36
const MIN_STATUSES_REQUIRED = 2

// Helper function to extract error message
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const graphqlError = error as {
    response?: { errors?: { message?: string }[] }
  }
  return (
    graphqlError?.response?.errors?.[0]?.message ||
    (error as Error)?.message ||
    defaultMessage
  )
}

// Helper function to check if status is temporary
const isTemporaryStatus = (statusId: string): boolean =>
  statusId.startsWith('temp-')

export const useStatusManager = (open: boolean) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseStatusOption, pulse, setPulseStatusOption } = usePulseStore()
  const queryClient = useQueryClient()

  // State
  const initialStatusType: StatusType =
    pulseStatusOption === PulseStatusOption.Default ? 'default' : 'custom'

  const [statusType, setStatusType] = useState<StatusType>(initialStatusType)
  const [customStatuses, setCustomStatuses] = useState<TaskStatusType[]>([])
  const [editingStatus, setEditingStatus] = useState<TaskStatusType | null>(
    null,
  )
  const [kebabAnchorEl, setKebabAnchorEl] = useState<{
    element: HTMLElement
    status: TaskStatusType
  } | null>(null)
  const [colorPickerAnchorEl, setColorPickerAnchorEl] =
    useState<HTMLElement | null>(null)
  const [newStatusLabel, setNewStatusLabel] = useState('')
  const [newStatusColor, setNewStatusColor] = useState(DEFAULT_COLOR)
  const [editingLabel, setEditingLabel] = useState('')
  const [editingColor, setEditingColor] = useState('')

  // Queries
  const {
    data: statusesData,
    isLoading: isLoadingStatuses,
    refetch: refetchStatuses,
  } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled:
      open &&
      statusType === 'custom' &&
      !!pulseId &&
      pulseId.length === UUID_LENGTH,
    variables: {
      pulseId: pulseId!,
    },
  })

  // Mutations
  const coreUrl = import.meta.env.VITE_CORE_GRAPHQL_URL

  const { mutateAsync: createStatus, isPending: isCreating } =
    useCreatePulseTaskStatusMutation({ coreUrl })

  const { mutateAsync: updateStatus, isPending: isUpdating } =
    useUpdatePulseTaskStatusMutation({ coreUrl })

  const { mutateAsync: deleteStatus, isPending: isDeleting } =
    useDeletePulseTaskStatusMutation({ coreUrl })

  const { mutateAsync: updateTaskStatusOrder, isPending: isUpdatingOrder } =
    useUpdateTaskStatusOrderMutation({ coreUrl })

  const { mutateAsync: updatePulse, isPending: isUpdatingPulse } =
    useUpdatePulseMutation({ coreUrl })

  const isSaving =
    isCreating || isUpdating || isDeleting || isUpdatingPulse || isUpdatingOrder

  // Helper: Invalidate queries after status changes
  const invalidateStatusQueries = async () => {
    await refetchStatuses()
    await queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }

  // Initialize from store
  useEffect(() => {
    if (open) {
      const initialType =
        pulseStatusOption === PulseStatusOption.Default ? 'default' : 'custom'
      setStatusType(initialType)
    }
  }, [open, pulseStatusOption])

  // Update custom statuses when data changes
  useEffect(() => {
    if (statusesData?.taskStatuses) {
      const sortedStatuses = [...statusesData.taskStatuses].sort((a, b) => {
        const posA = a.position ?? Infinity
        const posB = b.position ?? Infinity
        return posA - posB
      })
      setCustomStatuses(sortedStatuses)
    } else if (statusesData && !statusesData.taskStatuses) {
      setCustomStatuses([])
    }
  }, [statusesData])

  // Validation helpers
  const validateDeleteStatus = useCallback(
    (status: TaskStatusType): string | null => {
      const totalStatuses = customStatuses.length

      if (totalStatuses <= MIN_STATUSES_REQUIRED) {
        return 'You must have at least 2 statuses'
      }

      if (totalStatuses === MIN_STATUSES_REQUIRED) {
        const isFirst = customStatuses[0].id === status.id
        const isLast =
          customStatuses[customStatuses.length - 1].id === status.id
        if (isFirst || isLast) {
          return 'The first and last statuses cannot be removed when only 2 remain'
        }
      }

      return null
    },
    [customStatuses],
  )

  const validatePulseId = useCallback((): string | null => {
    if (!pulseId) {
      return 'Pulse ID is required'
    }
    if (pulseId.length !== UUID_LENGTH) {
      return 'Invalid pulse ID'
    }
    return null
  }, [pulseId])

  // UI Handlers
  const handleKebabClick = (
    event: React.MouseEvent<HTMLElement>,
    status: TaskStatusType,
  ) => {
    setKebabAnchorEl({ element: event.currentTarget, status })
  }

  const handleKebabClose = () => {
    setKebabAnchorEl(null)
  }

  const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
    setColorPickerAnchorEl(event.currentTarget)
  }

  const handleColorPickerClose = () => {
    setColorPickerAnchorEl(null)
  }

  const handleEditColorClick = (event: React.MouseEvent<HTMLElement>) => {
    if (editingStatus) {
      setColorPickerAnchorEl(event.currentTarget)
    }
  }

  const handleEdit = (status: TaskStatusType) => {
    if (isTemporaryStatus(status.id)) {
      toast.error('Please wait for the status to be saved before editing')
      handleKebabClose()
      return
    }

    setEditingStatus(status)
    setEditingLabel(status.label)
    setEditingColor(status.color || DEFAULT_COLOR)
    handleKebabClose()
  }

  const handleCancelEdit = () => {
    setEditingStatus(null)
    setEditingLabel('')
    setEditingColor('')
  }

  // Status operations
  const handleAddNewStatus = async () => {
    const label = newStatusLabel.trim()
    if (!label) return

    const validationError = validatePulseId()
    if (validationError) {
      toast.error(validationError)
      return
    }

    const tempId = `temp-${Date.now()}`
    const previousStatuses = customStatuses

    try {
      setCustomStatuses((prev) => [
        ...prev,
        {
          color: newStatusColor,
          createdAt: new Date().toISOString(),
          id: tempId,
          label,
          position: prev.length,
          pulse_id: pulseId!,
          updatedAt: new Date().toISOString(),
        } as TaskStatusType,
      ])

      setNewStatusLabel('')
      setNewStatusColor(DEFAULT_COLOR)

      await createStatus({
        color: newStatusColor,
        label,
        position: customStatuses.length,
        pulse_id: pulseId!,
      })

      await invalidateStatusQueries()
      toast.success('Status created successfully')
    } catch (error) {
      setCustomStatuses(previousStatuses)
      await refetchStatuses()
      toast.error(getErrorMessage(error, 'Failed to create status'))
    }
  }

  const handleSaveEdit = async () => {
    if (!editingStatus || !editingLabel.trim()) return

    if (isTemporaryStatus(editingStatus.id)) {
      toast.error('Please wait for the status to be saved before editing')
      handleCancelEdit()
      return
    }

    const label = editingLabel.trim()
    const color = editingColor
    const statusId = editingStatus.id
    const previousStatuses = customStatuses

    try {
      setCustomStatuses((prev) =>
        prev.map((s) => (s.id === statusId ? { ...s, color, label } : s)),
      )

      handleCancelEdit()

      await updateStatus({ color, id: statusId, label })
      await invalidateStatusQueries()
      toast.success('Status updated successfully')
    } catch (error) {
      setCustomStatuses(previousStatuses)
      await refetchStatuses()
      toast.error(getErrorMessage(error, 'Failed to update status'))
    }
  }

  const handleDelete = async (status: TaskStatusType) => {
    const validationError = validateDeleteStatus(status)
    if (validationError) {
      toast.error(validationError)
      handleKebabClose()
      return
    }

    const previousStatuses = customStatuses

    try {
      setCustomStatuses((prev) => prev.filter((s) => s.id !== status.id))
      handleKebabClose()

      await deleteStatus({ id: status.id, pulseId: pulseId! })
      await invalidateStatusQueries()
      toast.success('Status deleted successfully')
    } catch (error) {
      setCustomStatuses(previousStatuses)
      await refetchStatuses()
      toast.error(getErrorMessage(error, 'Failed to delete status'))
    }
  }

  // Permission helpers
  const canEdit = (status: TaskStatusType | null | undefined): boolean => {
    return !!status && !isTemporaryStatus(status.id)
  }

  const canDelete = (status: TaskStatusType | null | undefined): boolean => {
    if (!status || isTemporaryStatus(status.id)) {
      return false
    }

    const validationError = validateDeleteStatus(status)
    return validationError === null
  }

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      if (!over || active.id === over.id || !pulseId) {
        return
      }

      const oldIndex = customStatuses.findIndex((s) => s.id === active.id)
      const newIndex = customStatuses.findIndex((s) => s.id === over.id)

      if (oldIndex === -1 || newIndex === -1) {
        return
      }

      const reorderedStatuses = arrayMove(customStatuses, oldIndex, newIndex)
      const previousStatuses = customStatuses

      try {
        setCustomStatuses(reorderedStatuses)

        const orderInput = reorderedStatuses
          .filter((status) => !isTemporaryStatus(status.id))
          .map((status, index) => ({
            id: status.id,
            position: index,
          }))

        if (orderInput.length > 0) {
          await updateTaskStatusOrder(orderInput)
        }

        await invalidateStatusQueries()
        toast.success('Status order updated successfully')
      } catch (error) {
        setCustomStatuses(previousStatuses)
        await refetchStatuses()
        toast.error(getErrorMessage(error, 'Failed to reorder statuses'))
      }
    },
    [
      customStatuses,
      pulseId,
      updateTaskStatusOrder,
      refetchStatuses,
      queryClient,
    ],
  )

  const handleStatusTypeChange = async (type: StatusType) => {
    if (!pulseId || !pulse) {
      toast.error('Pulse ID is required')
      return
    }

    const newOption =
      type === 'default' ? PulseStatusOption.Default : PulseStatusOption.Custom

    // Only update if the option actually changed
    if (pulseStatusOption === newOption) {
      setStatusType(type)
      return
    }

    // Optimistically update UI
    setStatusType(type)

    try {
      // Backend requires description field, so we always include it
      await updatePulse({
        description: pulse.description ?? '',
        icon: pulse.icon! || PulseType.Generic,
        name: pulse.name,
        pulseId,
        status_option: newOption,
      })

      setPulseStatusOption(newOption)
      toast.success('Status type updated successfully')
    } catch (error) {
      // Rollback on error
      setStatusType(
        pulseStatusOption === PulseStatusOption.Default ? 'default' : 'custom',
      )
      toast.error(getErrorMessage(error, 'Failed to update status type'))
    }
  }

  return {
    canDelete,
    canEdit,
    colorPickerAnchorEl,
    customStatuses,
    editingColor,
    editingLabel,
    editingStatus,

    handleAddNewStatus,
    handleCancelEdit,
    handleColorPickerClose,
    handleColorPickerOpen,
    handleDelete,
    handleDragEnd,
    handleEdit,
    handleEditColorClick,
    handleKebabClick,
    handleKebabClose,
    handleSaveEdit,
    handleStatusTypeChange,

    isCreating,
    isDeleting,
    isLoadingStatuses,
    isSaving,
    isUpdating,

    kebabAnchorEl,
    newStatusColor,
    newStatusLabel,
    pulseId,

    setEditingColor,
    setEditingLabel,
    setNewStatusColor,
    setNewStatusLabel,

    statusType,
    t,
  }
}
