import { ChecklistOutlined, ListAltOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { TaskType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { usePulseStore } from '~/store/usePulseStore'

import { CreateTaskForm } from '../CreateTaskForm'

export const CreateTaskActions = () => {
  const { t } = useTranslation(['common', 'tasks'])
  const { pulseId } = useParams<{ pulseId: string }>()

  const { pulseActions, addActionToPulse } = usePulseStore()

  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const createTaskInput = useMemo(() => {
    return pulseAction?.createTaskInput.find(
      (input) => input.location === 'ROOT',
    )
  }, [pulseAction])

  const [activeTaskSectionType, setActiveTaskSectionType] =
    useState<TaskType | null>(null)

  // Sync if form is open base on saved state
  useEffect(() => {
    if (!createTaskInput?.isOpen) return

    setActiveTaskSectionType(createTaskInput?.type ?? null)
  }, [pulseAction])

  const handleOpenCreateTaskSection = () => {
    // Reset saved input state when switching type
    if (activeTaskSectionType && pulseId)
      addActionToPulse({
        id: pulseId,
        updates: {
          createTaskInput:
            pulseAction?.createTaskInput?.filter(
              (input) => input.location !== 'ROOT',
            ) || [],
        },
      })
    setActiveTaskSectionType(TaskType.Task)
  }
  const handleOpenCreateTaskListSection = () => {
    // Reset saved input state when switching type
    if (activeTaskSectionType && pulseId)
      addActionToPulse({
        id: pulseId,
        updates: {
          createTaskInput:
            pulseAction?.createTaskInput?.filter(
              (input) => input.location !== 'ROOT',
            ) || [],
        },
      })

    setActiveTaskSectionType(TaskType.List)
  }

  const handleCloseCreateTaskSection = () => setActiveTaskSectionType(null)

  const actionButtons = [
    {
      color: 'primary',
      icon: <ListAltOutlined fontSize="small" />,
      label: t('new_task', { ns: 'tasks' }),
      onClick: handleOpenCreateTaskSection,
      type: TaskType.Task,
    },
    {
      color: 'inherit',
      icon: <ChecklistOutlined fontSize="small" />,
      label: t('new_task_list', { ns: 'tasks' }),
      onClick: handleOpenCreateTaskListSection,
      type: TaskType.List,
    },
  ] as const

  const visibleButtons =
    activeTaskSectionType === null
      ? actionButtons
      : actionButtons.filter(({ type }) => type !== activeTaskSectionType)

  return (
    <Stack spacing={1}>
      {activeTaskSectionType && (
        <CreateTaskForm
          key={activeTaskSectionType}
          onCancel={handleCloseCreateTaskSection}
          taskType={activeTaskSectionType}
        />
      )}
      <Stack
        alignItems="center"
        direction="row"
        divider={<Typography>or</Typography>}
        spacing={1}
      >
        {visibleButtons.map(({ label, onClick, icon, color }) => (
          <Button
            color={color}
            key={label}
            onClick={onClick}
            startIcon={icon}
            sx={{ alignSelf: 'start' }}
          >
            {label}
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}
