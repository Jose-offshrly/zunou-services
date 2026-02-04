import { zodResolver } from '@hookform/resolvers/zod'
import { KeyboardReturnOutlined, MenuOutlined } from '@mui/icons-material'
import { Divider, Stack, TextField, Typography } from '@mui/material'
import {
  TaskEntity,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useCreateTaskMutation } from '@zunou-queries/core/hooks/useCreateTaskMutation'
import { Button, Form, LoadingButton } from '@zunou-react/components/form'
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
import {
  CreateTaskParams,
  createTaskSchema,
} from '~/schemas/CreatePulseTaskSchema'
import { CreateTaskInput, usePulseStore } from '~/store/usePulseStore'
import { removeMentions } from '~/utils/textUtils'

import { AddToListDropdown } from './AddToListDropdown'
import { AssigneeDropdown } from './AssigneeDropdown'
import { CalendarDropdown } from './CalendarDropdown'
import { PriorityDropdown } from './PriorityDropdown'
import { StatusDropdown } from './StatusDropdown'

interface CreateTaskFormProps {
  onCancel: () => void
  parentId?: string | null
  taskType?: TaskType
}

export const CreateTaskForm = ({
  onCancel,
  parentId,
  taskType,
}: CreateTaskFormProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const { pulseActions, addActionToPulse } = usePulseStore()

  const timezone = user?.timezone ?? 'UTC'
  const defaultStatus =
    parentId || taskType === TaskType.Task ? TaskStatus.Todo : null

  const [mentions, setMentions] = useState<string[]>([])
  const [isShowTaskDescription, setIsShowTaskDescription] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const hasInitializedRef = useRef(false)

  // Get pulse action once for initial state
  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const createTaskInput = useMemo(() => {
    return pulseAction?.createTaskInput.find((input) =>
      parentId ? input.location === parentId : input.location === 'ROOT',
    )
  }, [pulseAction])

  // Calculate initial values only once
  const initialValues = useMemo(() => {
    if (!createTaskInput) {
      return {
        parentId: parentId ?? '',
        status: defaultStatus,
      }
    }

    return {
      assignees: createTaskInput?.assignees,
      description: createTaskInput?.description,
      dueDate: createTaskInput?.dueDate,
      parentId: createTaskInput?.parentId,
      priority: createTaskInput?.priority,
      status: createTaskInput?.status ?? defaultStatus,
      title: createTaskInput?.title,
    }
  }, [])

  const {
    control,
    register,
    getValues,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateTaskParams>({
    defaultValues: initialValues,
    mode: 'onChange',
    resolver: zodResolver(createTaskSchema),
  })

  const watchedValues = useWatch({ control })

  // One-time initialization on mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Set initial description visibility from store if available
      if (createTaskInput?.isShowDescription) {
        setIsShowTaskDescription(true)
      }
      hasInitializedRef.current = true
    }
  }, [pulseAction])

  // Debounced function to save current form state to store
  const saveCurrentStateToStore = useMemo(() => {
    return debounce(() => {
      if (!pulseId) return

      const currentValues = getValues()
      const hasContent = Object.values(currentValues).some(
        (value) => value && (typeof value === 'string' ? value.trim() : true),
      )

      if (hasContent) {
        const task: CreateTaskInput = {
          ...currentValues,
          isOpen: true,
          isShowDescription: isShowTaskDescription,
          location: parentId || 'ROOT',
          type: taskType,
        }

        const inputs = [...(pulseAction?.createTaskInput || [])].filter(
          (input) =>
            parentId ? input.location !== parentId : input.location !== 'ROOT',
        )

        inputs.push(task)

        addActionToPulse({
          id: pulseId,
          updates: { createTaskInput: inputs },
        })
      }
    }, 500)
  }, [pulseId, taskType, isShowTaskDescription, getValues, addActionToPulse])

  // Save form state periodically while user is working
  useEffect(() => {
    if (!hasInitializedRef.current) return

    saveCurrentStateToStore()

    // Cleanup on unmount
    return () => {
      saveCurrentStateToStore.cancel()
    }
  }, [watchedValues, saveCurrentStateToStore])

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

  const { mutate: createTask, isPending: isPendingCreateTask } =
    useCreateTaskMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleStatusSelect = (status: TaskStatus | string) => {
    setValue('status', status as TaskStatus)
  }

  const handleAssigneeSelect = ({
    id: userId,
    name,
  }: {
    id: string
    name: string
  }) => {
    const currentAssignees = getValues('assignees') ?? []
    const updatedAssignees = currentAssignees.includes(userId)
      ? currentAssignees.filter((id) => id !== userId)
      : [...currentAssignees, userId]

    setValue('assignees', updatedAssignees, { shouldValidate: true })

    // set mentions
    setMentions((prev) => [...prev, name])
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
      setValue('dueDate', '', { shouldValidate: true })
    }
  }

  const handlePrioritySelect = (priority: TaskPriority | null) => {
    setValue('priority', priority, { shouldValidate: true })
  }

  const handleParentSelect = (parentId: string | null) => {
    setValue('parentId', parentId ?? '', { shouldValidate: true })
  }

  const handleCancel = useCallback(() => {
    if (pulseId) {
      addActionToPulse({
        id: pulseId,
        updates: {
          createTaskInput:
            pulseAction?.createTaskInput?.filter((input) =>
              parentId
                ? input.location !== parentId
                : input.location !== 'ROOT',
            ) || [],
        },
      })
    }

    onCancel()
  }, [pulseAction, addActionToPulse, pulseId])

  const onSubmitHandler = handleSubmit((data: CreateTaskParams) => {
    const {
      assignees,
      description,
      dueDate,
      priority,
      status,
      title,
      parentId: formParentId,
    } = data

    if (!pulseId) throw new Error('Pulse ID is missing')

    // Cancel any pending saves before submitting
    saveCurrentStateToStore.cancel()

    const cleanedTitle = removeMentions(mentions, title)

    createTask(
      [
        {
          assignees,
          description,
          due_date: dueDate,
          entity_id: pulseId,
          entity_type: TaskEntity.Pulse,
          organization_id: organizationId,
          parent_id: parentId || formParentId,
          priority,
          status,
          task_type: taskType ?? TaskType.Task,
          title: cleanedTitle,
        },
      ],
      {
        onError: (error) => {
          const message = error?.response?.errors?.[0]?.message
          if (message) {
            toast.error(message)
          } else {
            toast.error(t('task_creation_error', { ns: 'tasks' }))
          }
        },
        onSettled: () => handleCancel(),
        onSuccess: () => {
          toast.success(t('new_task_created', { ns: 'tasks' }))
          reset()
        },
      },
    )
  })

  return (
    <Form
      maxWidth="lg"
      onSubmit={onSubmitHandler}
      sx={{ alignSelf: 'center', padding: 0, width: '100%' }}
    >
      <Card>
        <CardContent>
          <Stack divider={<Divider />} spacing={2}>
            <Stack spacing={2}>
              <SmartInput
                control={control}
                name="title"
                onSelect={handleAssigneeSelect}
                onSubmit={onSubmitHandler}
                placeholder={`${t('task_creation_placeholder', { ns: 'tasks' })} ${taskType === TaskType.Task ? t('task', { ns: 'tasks' }) : t('task_list', { ns: 'tasks' })}`}
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
                    {t('description')}
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

              {taskType === TaskType.Task && (
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
                  {!parentId && (
                    <AddToListDropdown
                      onSelect={handleParentSelect}
                      selectedParentId={watchedValues.parentId}
                    />
                  )}
                </Stack>
              )}

              {/* Error messages */}
              <Typography color="error" variant="caption">
                {errors.title?.message ||
                  errors.description?.message ||
                  errors.dueDate?.message ||
                  errors.priority?.message ||
                  errors.assignees?.message}
              </Typography>
            </Stack>

            <Stack alignSelf="end" direction="row" spacing={1}>
              <Button onClick={handleCancel} variant="outlined">
                {t('cancel')}
              </Button>
              <LoadingButton
                disabled={!isValid || isPendingCreateTask}
                endIcon={<KeyboardReturnOutlined fontSize="small" />}
                loading={isPendingCreateTask}
                type="submit"
                variant="contained"
              >
                {taskType === TaskType.List
                  ? t('create_task_list', { ns: 'tasks' })
                  : t('create_task', { ns: 'tasks' })}
              </LoadingButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Form>
  )
}
