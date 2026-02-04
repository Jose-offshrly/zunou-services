import { zodResolver } from '@hookform/resolvers/zod'
import {
  DeleteOutlined,
  KeyboardReturnOutlined,
  MenuOutlined,
} from '@mui/icons-material'
import { Divider, Stack, TextField, Typography } from '@mui/material'
import {
  PulseStatusOption,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetTaskQuery } from '@zunou-queries/core/hooks/useGetTaskQuery'
import { useUpdateTaskMutation } from '@zunou-queries/core/hooks/useUpdateTaskMutation'
import {
  Button,
  Form,
  IconButton,
  LoadingButton,
} from '@zunou-react/components/form'
import { Card, CardContent } from '@zunou-react/components/layout'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { SmartInput } from '~/components/ui/form/SmartInput'
import { useOrganization } from '~/hooks/useOrganization'
import { UpdateTaskParams, updateTaskSchema } from '~/schemas/UpdateTaskSchema'
import { CreateTaskInput, usePulseStore } from '~/store/usePulseStore'

import { AddToListDropdown } from '../CreateTaskForm/AddToListDropdown'
import { AssigneeDropdown } from '../CreateTaskForm/AssigneeDropdown'
import { CalendarDropdown } from '../CreateTaskForm/CalendarDropdown'
import { PriorityDropdown } from '../CreateTaskForm/PriorityDropdown'
import { StatusDropdown } from '../CreateTaskForm/StatusDropdown'
import { LoadingState } from './LoadingState'

interface UpdateTaskFormProps {
  onCancel: () => void
  onDelete: () => void
  taskId: string
}

export const UpdateTaskForm = ({
  onCancel,
  onDelete,
  taskId,
}: UpdateTaskFormProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const { pulseActions, addActionToPulse, pulseStatusOption } = usePulseStore()

  const timezone = user?.timezone ?? 'UTC'

  const formRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false)
  const hasSetInitialValuesRef = useRef(false)

  const { data: taskData, isFetching: isFetchingTask } = useGetTaskQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      taskId,
    },
  })
  const task = taskData?.task

  // Get pulse action once for initial state
  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId, taskId],
  )

  const editTaskInput = useMemo(() => {
    return pulseAction?.editTaskInput.find((input) => input.id === taskId)
  }, [pulseAction, taskId])

  // Calculate initial values - prioritize global state over API data
  const initialValues = useMemo(() => {
    if (!task) return {}

    // If we have saved state in global store, use it
    if (editTaskInput) {
      return {
        assignees: editTaskInput.assignees ?? [],
        description: editTaskInput.description ?? '',
        dueDate: editTaskInput.dueDate ?? '',
        parentId: editTaskInput.parentId ?? null,
        priority: editTaskInput.priority ?? undefined,
        status: editTaskInput.status ?? undefined,
        title: editTaskInput.title ?? '',
      }
    }

    // Otherwise use API data
    return {
      assignees: task.assignees?.map(({ user }) => user.id) ?? [],
      description: task.description ?? '',
      dueDate: task.due_date ?? '',
      parentId: task.parent?.id ?? null,
      priority: task.priority ?? undefined,
      status: task.status ?? undefined,
      title: task.title ?? '',
    }
  }, [task, editTaskInput])

  const [isShowTaskDescription, setIsShowTaskDescription] = useState(
    editTaskInput?.isShowDescription ?? (task?.description?.length ?? 0) > 0,
  )

  const {
    control,
    register,
    getValues,
    handleSubmit,
    setValue,
    reset,
    formState: { isValid },
  } = useForm<UpdateTaskParams>({
    mode: 'onChange',
    resolver: zodResolver(updateTaskSchema),
  })

  const watchedValues = useWatch({ control })

  // Initialize form when task data is loaded
  useEffect(() => {
    if (
      task &&
      Object.keys(initialValues).length > 0 &&
      !hasSetInitialValuesRef.current
    ) {
      reset(initialValues)

      setIsShowTaskDescription(
        editTaskInput?.isShowDescription ??
          (initialValues.description?.length ?? 0) > 0,
      )

      hasSetInitialValuesRef.current = true

      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true
      }
    }
  }, [task, initialValues, editTaskInput, reset])

  // Debounced function to save current form state to store
  const saveCurrentStateToStore = useMemo(() => {
    return debounce(() => {
      if (!pulseId || !task || !hasInitializedRef.current) return

      const currentValues = getValues()
      const hasContent = Object.values(currentValues).some(
        (value) => value && (typeof value === 'string' ? value.trim() : true),
      )

      if (hasContent) {
        // Determine if status is a custom status ID (string) or default status (TaskStatus enum)
        const statusValue = currentValues.status
        const isCustomStatusId =
          pulseStatusOption === PulseStatusOption.Custom &&
          typeof statusValue === 'string' &&
          !Object.values(TaskStatus).includes(statusValue as TaskStatus)

        // Extract status from currentValues to avoid type issues
        const { status: _, ...restValues } = currentValues

        const taskInput: CreateTaskInput = {
          ...restValues,
          id: taskId,
          isShowDescription: isShowTaskDescription,
          location: taskId,
          parentId: currentValues.parentId ?? undefined,
          type: TaskType.Task,
          // Only include status if it's a valid TaskStatus enum (not a custom status ID)
          ...(isCustomStatusId
            ? {}
            : { status: statusValue as TaskStatus | null | undefined }),
        }

        const currentPulseAction = pulseActions.find(
          (pulse) => pulse.id === pulseId,
        )
        const inputs = [...(currentPulseAction?.editTaskInput || [])].filter(
          (input) => input.id !== taskId,
        )

        inputs.push(taskInput)

        addActionToPulse({
          id: pulseId,
          updates: { editTaskInput: inputs },
        })
      }
    }, 500)
  }, [
    pulseId,
    taskId,
    isShowTaskDescription,
    getValues,
    addActionToPulse,
    task,
    pulseActions,
  ])

  // Save form state periodically
  useEffect(() => {
    if (!hasInitializedRef.current || !task) return

    saveCurrentStateToStore()

    return () => {
      saveCurrentStateToStore.cancel()
    }
  }, [watchedValues, isShowTaskDescription])

  // Handle description toggle
  const toggleTaskDescription = useCallback(() => {
    setIsShowTaskDescription((prev) => !prev)
  }, [])

  // Handle clicks outside form
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        // Save immediately when clicking outside
        saveCurrentStateToStore.cancel()
        saveCurrentStateToStore.flush()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [saveCurrentStateToStore])

  const { mutate: updateTask, isPending: isPendingUpdateTask } =
    useUpdateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleStatusSelect = (status: TaskStatus | string) => {
    // For custom statuses, status is a string ID; for default statuses, it's a TaskStatus enum
    setValue('status', status, { shouldValidate: true })
  }

  const handleAssigneeSelect = ({
    id: userId,
  }: {
    id: string
    name: string
  }) => {
    const currentAssignees = getValues('assignees') ?? []

    const updatedAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter((id) => id !== userId)
      : [...currentAssignees, userId]

    setValue('assignees', updatedAssignees, { shouldValidate: true })
  }

  const handleClearAssignees = () => {
    setValue('assignees', [])
  }

  const handleDateSelect = (date: Dayjs | null) => {
    if (date) {
      const currentTime = dayjs().tz(timezone)

      const dateWithCurrentTime = date
        .clone()
        .hour(currentTime.hour())
        .minute(currentTime.minute())
        .second(currentTime.second())

      setValue('dueDate', dateWithCurrentTime.format('YYYY-MM-DD HH:mm:ss'), {
        shouldValidate: true,
      })
    } else {
      setValue('dueDate', '', {
        shouldValidate: true,
      })
    }
  }

  const handlePrioritySelect = (priority: TaskPriority | null) => {
    setValue('priority', priority ?? TaskPriority.Low, { shouldValidate: true })
  }

  const handleAddToTaskList = (parentId: string | null) => {
    setValue('parentId', parentId ?? null, { shouldValidate: true })
  }

  const toggleEditTaskForm = useCallback(
    (status: boolean) => {
      if (!pulseId) {
        toast.error('Missing pulse ID.')
        return
      }

      if (status) {
        const tempEditingTask = {
          id: taskId,
          status,
        }

        const inputs = [...(pulseAction?.editingTasks || [])].filter(
          (task) => task.id !== taskId,
        )

        inputs.push(tempEditingTask)

        addActionToPulse({
          id: pulseId,
          updates: { editingTasks: inputs },
        })
      } else {
        addActionToPulse({
          id: pulseId,
          updates: {
            editingTasks: (pulseAction?.editingTasks || []).filter(
              (task) => task.id !== taskId,
            ),
          },
        })
      }
    },
    [pulseAction],
  )

  const handleCancel = useCallback(() => {
    if (pulseId) {
      addActionToPulse({
        id: pulseId,
        updates: {
          editTaskInput:
            pulseAction?.editTaskInput?.filter(
              (input) => taskId !== input.id,
            ) || [],
        },
      })
    }

    toggleEditTaskForm(false)

    onCancel()
  }, [pulseActions, addActionToPulse, pulseId, taskId, onCancel])

  const onSubmitHandler = handleSubmit((data: UpdateTaskParams) => {
    const { assignees, description, dueDate, priority, status, title } = data

    if (data.parentId && pulseId) {
      const filteredTaskLists = pulseAction?.expandedTaskList.filter(
        (list) => list != data.parentId,
      )

      filteredTaskLists?.push(data.parentId)

      addActionToPulse({
        id: pulseId,
        updates: {
          expandedTaskList: filteredTaskLists,
        },
      })
    }

    // Cancel any pending saves before submitting
    saveCurrentStateToStore.cancel()

    // Determine if status is a custom status ID (string) or default status (TaskStatus enum)
    const isCustomStatusId =
      pulseStatusOption === PulseStatusOption.Custom &&
      typeof status === 'string' &&
      !Object.values(TaskStatus).includes(status as TaskStatus)

    updateTask(
      {
        assignees,
        description,
        due_date: dueDate,
        organization_id: organizationId,
        parent_id: data.parentId,
        priority,
        // Use task_status_id for custom statuses, status for default statuses
        ...(isCustomStatusId
          ? { task_status_id: status }
          : { status: status as TaskStatus }),
        taskId,
        title,
      },
      {
        onError: () => toast.error(t('task_update_error', { ns: 'tasks' })),
        onSettled: () => handleCancel(),
        onSuccess: () => {
          toast.success(t('task_updated', { ns: 'tasks' }))
          handleCancel()
          reset()
        },
      },
    )
  })

  return (
    <div ref={formRef}>
      <Form maxWidth="lg" onSubmit={onSubmitHandler} sx={{ padding: 0 }}>
        <Card>
          <CardContent>
            {isFetchingTask ? (
              <LoadingState />
            ) : (
              <Stack divider={<Divider />} spacing={2}>
                <Stack spacing={2}>
                  <SmartInput
                    control={control}
                    name="title"
                    onSelect={handleAssigneeSelect}
                    onSubmit={onSubmitHandler}
                    placeholder={`${t('task_creation_placeholder', { ns: 'tasks' })} ${t('task', { ns: 'tasks' })}`}
                  />
                  <Stack spacing={1}>
                    <Stack
                      alignItems="center"
                      direction="row"
                      onClick={toggleTaskDescription}
                      spacing={1}
                      sx={{ color: 'text.secondary', cursor: 'pointer' }}
                    >
                      <MenuOutlined fontSize="small" />
                      <Typography color="text.secondary" variant="body2">
                        {!isShowTaskDescription &&
                        watchedValues.description?.trim()
                          ? watchedValues.description
                          : t('description')}
                      </Typography>
                    </Stack>
                    {isShowTaskDescription && (
                      <TextField
                        {...register('description')}
                        maxRows={10}
                        minRows={5}
                        multiline={true}
                        sx={{
                          '& textarea': {
                            maxHeight: '45vh',
                            resize: 'vertical',
                          },
                        }}
                      />
                    )}
                  </Stack>
                  {/* Options */}
                  <Stack direction="row" spacing={2}>
                    <StatusDropdown
                      onSelect={handleStatusSelect}
                      selectedStatus={watchedValues.status}
                    />
                    <AssigneeDropdown
                      assigneeIds={watchedValues.assignees}
                      onClear={handleClearAssignees}
                      onSelect={handleAssigneeSelect}
                    />
                    <CalendarDropdown
                      onSelect={handleDateSelect}
                      selectedDate={watchedValues.dueDate}
                    />
                    <PriorityDropdown
                      onSelect={handlePrioritySelect}
                      selectedPriority={watchedValues.priority}
                    />
                    {task?.entity?.id && (
                      <AddToListDropdown
                        entityId={task?.entity?.id}
                        onSelect={handleAddToTaskList}
                        selectedParentId={watchedValues.parentId}
                      />
                    )}
                  </Stack>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <IconButton onClick={onDelete}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                  <Stack alignSelf="end" direction="row" spacing={1}>
                    <Button onClick={handleCancel} variant="outlined">
                      {t('cancel')}
                    </Button>
                    <LoadingButton
                      disabled={!isValid || isPendingUpdateTask}
                      endIcon={<KeyboardReturnOutlined fontSize="small" />}
                      loading={isPendingUpdateTask}
                      type="submit"
                      variant="contained"
                    >
                      {t('update_task', { ns: 'tasks' })}
                    </LoadingButton>
                  </Stack>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Form>
    </div>
  )
}
