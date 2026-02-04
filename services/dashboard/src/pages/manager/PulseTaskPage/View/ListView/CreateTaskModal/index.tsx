import { zodResolver } from '@hookform/resolvers/zod'
import { MenuOutlined } from '@mui/icons-material'
import { Stack, TextField, Typography } from '@mui/material'
import {
  TaskEntity,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useCreateTaskMutation } from '@zunou-queries/core/hooks/useCreateTaskMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { SmartInput } from '~/components/ui/form/SmartInput'
import { useOrganization } from '~/hooks/useOrganization'
import {
  CreateTaskParams,
  createTaskSchema,
} from '~/schemas/CreatePulseTaskSchema'
import { removeMentions } from '~/utils/textUtils'

import { AddToListDropdown } from '../CreateTaskForm/AddToListDropdown'
import { AssigneeDropdown } from '../CreateTaskForm/AssigneeDropdown'
import { CalendarDropdown } from '../CreateTaskForm/CalendarDropdown'
import { PriorityDropdown } from '../CreateTaskForm/PriorityDropdown'
import { StatusDropdown } from '../CreateTaskForm/StatusDropdown'

interface CreateTaskCardProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated?: (id: string) => void
}

const initialValues = {
  assignees: undefined,
  dueDate: undefined,
  parentId: undefined,
  priority: undefined,
  status: TaskStatus.Todo,
  title: '',
}

export const CreateTaskModal = ({
  isOpen,
  onClose,
  onTaskCreated,
}: CreateTaskCardProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()
  const { user } = useAuthContext()

  const timezone = user?.timezone ?? 'UTC'

  const [mentions, setMentions] = useState<string[]>([])

  const {
    control,
    getValues,
    handleSubmit,
    register,
    reset,
    formState: { errors, isValid },
    setValue,
  } = useForm<CreateTaskParams>({
    defaultValues: initialValues,
    mode: 'onChange',
    resolver: zodResolver(createTaskSchema),
  })

  const { assignees, dueDate, parentId, priority, status } = useWatch({
    control,
  })

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
    const isCurrentlyAssigned = currentAssignees.includes(userId)

    const updatedAssignees = isCurrentlyAssigned
      ? currentAssignees.filter((id) => id !== userId)
      : [...currentAssignees, userId]

    // set assigneeIds
    if (currentAssignees.length !== updatedAssignees.length) {
      setValue('assignees', updatedAssignees, {
        shouldValidate: true,
      })
    }

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
      setValue('dueDate', '', {
        shouldValidate: true,
      })
    }
  }

  const handlePrioritySelect = (priority: TaskPriority | null) => {
    setValue('priority', priority ?? TaskPriority.Low, { shouldValidate: true })
  }

  const handleParentSelect = (parentId: string | null) => {
    setValue('parentId', parentId ?? '', { shouldValidate: true })
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  const onSubmitHandler = handleSubmit((data: CreateTaskParams) => {
    if (!pulseId) throw new Error('Pulse ID is missing')

    const {
      assignees,
      description,
      dueDate,
      priority,
      status,
      title,
      parentId,
    } = data

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
          parent_id: parentId,
          priority,
          status,
          task_type: TaskType.Task,
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
        onSuccess: (newTask) => {
          if (newTask && onTaskCreated) {
            onTaskCreated(newTask.createTask[0].id)
          }

          toast.success(t('new_task_created', { ns: 'tasks' }))

          reset(initialValues)
          onClose()
        },
      },
    )
  })

  return (
    <CustomModalWithSubmit
      disabledSubmit={!isValid}
      isOpen={isOpen}
      isSubmitting={isPendingCreateTask}
      maxWidth={1280}
      onCancel={handleCancel}
      onClose={onClose}
      onSubmit={onSubmitHandler}
      submitOnEnter={true}
      submitText={t('create_task', { ns: 'tasks' })}
      title={t('create_task', { ns: 'tasks' })}
    >
      <Stack spacing={2}>
        {/* Title */}
        <SmartInput
          control={control}
          name="title"
          onSelect={handleAssigneeSelect}
          onSubmit={onSubmitHandler}
          placeholder={`${t('task_creation_placeholder', { ns: 'tasks' })} ${t('task', { ns: 'tasks' })}`}
        />
        {/* Description */}
        <Stack spacing={1}>
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{ color: 'text.secondary' }}
          >
            <MenuOutlined fontSize="small" />
            <Typography color="text.secondary" variant="body2">
              {t('description')}
            </Typography>
          </Stack>
          <TextField
            {...register('description')}
            autoFocus={true}
            disabled={isPendingCreateTask}
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
        </Stack>
        {/* Options */}
        <Stack direction="row" spacing={2}>
          <StatusDropdown
            disabled={isPendingCreateTask}
            onSelect={handleStatusSelect}
            selectedStatus={status}
          />
          <AssigneeDropdown
            assigneeIds={assignees}
            disabled={isPendingCreateTask}
            onClear={handleClearAssignees}
            onSelect={handleAssigneeSelect}
          />
          <CalendarDropdown
            disabled={isPendingCreateTask}
            onSelect={handleDateSelect}
            selectedDate={dueDate}
          />
          <PriorityDropdown
            disabled={isPendingCreateTask}
            onSelect={handlePrioritySelect}
            selectedPriority={priority}
          />
          <AddToListDropdown
            disabled={isPendingCreateTask}
            onSelect={handleParentSelect}
            selectedParentId={parentId}
          />
        </Stack>
        {/* Error messages */}
        <Typography color="error" variant="caption">
          {errors.title?.message ||
            errors.description?.message ||
            errors.dueDate?.message ||
            errors.priority?.message ||
            errors.assignees?.message}
        </Typography>
      </Stack>
    </CustomModalWithSubmit>
  )
}
