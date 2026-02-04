import { Stack } from '@mui/system'
import { TaskPriority, TaskStatus } from '@zunou-graphql/core/graphql'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { TextField } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { SmartInput } from '~/components/ui/form/SmartInput'
import { AssigneeDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/AssigneeDropdown'
import { CalendarDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/CalendarDropdown'
import { PriorityDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/PriorityDropdown'
import { StatusDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/StatusDropdown'

interface Props {
  pulseId: string
}

export default function TaskForm({ pulseId }: Props) {
  const { control, watch, setValue } = useFormContext()
  const { user } = useAuthContext()
  const { t } = useTranslation(['common', 'tasks'])

  const timezone = user?.timezone ?? 'UTC'

  // Use watch instead of getValues for reactive updates
  const taskAssignees = watch('task_assignees') ?? []
  const taskStatus = watch('task_status') ?? TaskStatus.Todo
  const taskPriority = watch('task_priority') ?? TaskPriority.Low
  const taskDueDate = watch('task_dueDate')
  const taskDescription = watch('task_description')

  const mentionsFromTitle = watch('task_mention')

  const { data: membersData } = useGetPulseMembersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { pulseId },
  })

  const pulseMembers = membersData?.pulseMembers.data ?? []

  const handleAssigneeSelect = ({
    id: userId,
    name,
  }: {
    id: string
    name: string
  }) => {
    const isCurrentlyAssigned = taskAssignees.some(
      (assignee: { id: string }) => assignee.id === userId,
    )

    const updatedAssignees = isCurrentlyAssigned
      ? taskAssignees.filter(
          (assignee: { id: string }) => assignee.id !== userId,
        )
      : [...taskAssignees, { id: userId }]

    if (taskAssignees.length !== updatedAssignees.length) {
      setValue('task_assignees', updatedAssignees, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }

    // Fix: Ensure mentionsFromTitle is an array, then add the new name
    const currentMentions = mentionsFromTitle ?? []
    setValue('task_mention', [...currentMentions, name], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleStatusSelect = (status: TaskStatus | string) => {
    setValue('task_status', status as TaskStatus, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleClearAssignees = () => {
    setValue('task_assignees', [], { shouldDirty: true, shouldValidate: true })
  }

  const handleDateSelect = (date: Dayjs | null) => {
    if (date) {
      const currentTime = dayjs().tz(timezone)
      const dateWithCurrentTime = date
        .clone()
        .hour(currentTime.hour())
        .minute(currentTime.minute())
        .second(currentTime.second())

      setValue(
        'task_dueDate',
        dateWithCurrentTime.format('YYYY-MM-DD HH:mm:ss'),
        { shouldDirty: true, shouldValidate: true },
      )
    } else {
      setValue('task_dueDate', '', { shouldValidate: true })
    }
  }

  const handlePrioritySelect = (priority: TaskPriority | null) => {
    setValue('task_priority', priority, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <Stack gap={2}>
      <SmartInput
        control={control}
        customPulseMembers={pulseMembers}
        name="task_title"
        onSelect={handleAssigneeSelect}
        placeholder={`${t('task_creation_placeholder', { ns: 'tasks' })} ${t('task', { ns: 'tasks' })}`}
      />

      <TextField
        control={control}
        maxRows={10}
        minRows={5}
        multiline={true}
        name="task_description"
        placeholder="Description"
        sx={{
          '& textarea': {
            maxHeight: '40vh',
            resize: 'vertical',
          },
        }}
        value={taskDescription}
      />
      <Stack direction="row" spacing={2}>
        <StatusDropdown
          onSelect={handleStatusSelect}
          selectedStatus={taskStatus}
        />

        <AssigneeDropdown
          assigneeIds={taskAssignees?.map(
            (assignee: string | { id: string }) =>
              typeof assignee === 'string' ? assignee : assignee?.id,
          )}
          customPulseMembers={pulseMembers}
          onClear={handleClearAssignees}
          onSelect={handleAssigneeSelect}
        />

        <CalendarDropdown
          onSelect={handleDateSelect}
          selectedDate={taskDueDate}
        />

        <PriorityDropdown
          onSelect={handlePrioritySelect}
          selectedPriority={taskPriority}
        />
      </Stack>
    </Stack>
  )
}
