import { zodResolver } from '@hookform/resolvers/zod'
import {
  AddOutlined,
  Close,
  DeleteOutlined,
  EditOutlined,
  ShareOutlined,
} from '@mui/icons-material'
import {
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  PulseStatusOption,
  TaskPriority,
  TaskStatus,
  TaskType,
  UpdateTaskInput,
} from '@zunou-graphql/core/graphql'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import dayjs, { Dayjs } from 'dayjs'
import parse from 'html-react-parser'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'
import { UpdateTaskParams, updateTaskSchema } from '~/schemas/UpdateTaskSchema'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'
import { convertLinksToHtml, removeMentions } from '~/utils/textUtils'

import { useTaskDetail, useTaskMutations } from '../../hooks'
import { AssigneeDropdown } from '../../View/ListView/CreateTaskForm/AssigneeDropdown'
import { CalendarDropdown } from '../../View/ListView/CreateTaskForm/CalendarDropdown'
import { ColorDropdown } from '../../View/ListView/CreateTaskForm/ColorDropdown'
import { PriorityDropdown } from '../../View/ListView/CreateTaskForm/PriorityDropdown'
import { StatusDropdown } from '../../View/ListView/CreateTaskForm/StatusDropdown'
import { DependenciesField } from '../Toolbar/DependenciesField'
import { ProgressField } from '../Toolbar/ProgressField'
import { LoadingState } from './LoadingState'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
  initialMode?: 'edit' | 'delete' | null
}

type ModalMode = 'edit' | 'delete'

export const TaskDetailModal = ({
  isOpen,
  onClose,
  taskId,
  initialMode = null,
}: TaskDetailModalProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { user, userRole } = useAuthContext()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pulseStatusOption } = usePulseStore()

  const [mode, setMode] = useState<ModalMode | null>(initialMode)
  const [mentions, setMentions] = useState<string[]>([])
  const [color, setColor] = useState<string>('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = mode === 'edit'
  const isDeleteMode = mode === 'delete'

  // Use centralized hooks for data fetching
  const { task, isLoadingTask, taskLists, pulseTasks, pulseName } =
    useTaskDetail(taskId)

  // Use centralized hooks for mutations
  const { deleteTask, updateTask, isPendingDeleteTask, isPendingUpdateTask } =
    useTaskMutations()

  // Fetch task statuses based on statusOption
  const shouldFetchDefaults = pulseStatusOption === PulseStatusOption.Default
  const shouldFetchCustom =
    pulseStatusOption === PulseStatusOption.Custom && Boolean(pulseId)

  const { data: taskStatusesData } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: isOpen && (shouldFetchDefaults || shouldFetchCustom),
    variables: shouldFetchDefaults
      ? { defaults: true }
      : shouldFetchCustom && pulseId
        ? { pulseId }
        : undefined,
  })

  const customStatuses = taskStatusesData?.taskStatuses

  const getInitialFormValues = useCallback((): UpdateTaskParams => {
    // For custom statuses, we need to get the task_status_id from the task
    // For default statuses, we use the status enum value
    // Note: We store the custom status ID as a string in the status field temporarily
    // and convert it to task_status_id when submitting
    let initialStatus: TaskStatus | string = task?.status ?? TaskStatus.Todo

    // If using custom statuses and task has task_status_id, use that
    if (
      pulseStatusOption === PulseStatusOption.Custom &&
      task &&
      'task_status_id' in task &&
      task.task_status_id
    ) {
      initialStatus = task.task_status_id
    }

    return {
      assignees: task?.assignees?.map(({ user }) => user.id) ?? [],
      color: task?.color ?? undefined,
      dependencies: task?.dependencies?.map((dep) => dep.id) ?? [],
      description: task?.description ?? '',
      dueDate: task?.due_date ?? undefined,
      parentId: task?.parent?.id ?? null,
      priority: task?.priority ?? undefined,
      progress: task?.progress ?? undefined,
      startDate: task?.start_date ?? undefined,
      status: initialStatus as TaskStatus,
      title: task?.title ?? '',
    }
  }, [task, pulseStatusOption])

  const {
    control,
    getValues,
    handleSubmit,
    setValue,
    reset,
    formState: { isValid, isDirty },
    trigger,
  } = useForm<UpdateTaskParams>({
    mode: 'onChange',
    resolver: zodResolver(updateTaskSchema),
  })

  const {
    assignees,
    description,
    startDate,
    dueDate,
    parentId,
    priority,
    status,
    title,
    color: formColor,
    progress: formProgress,
    dependencies: formDependencies,
  } = useWatch({ control })

  // State for additional fields (Progress and Dependencies)
  const [progress, setProgress] = useState<string>('0')
  const [dependencies, setDependencies] = useState<string[]>([])
  const [showProgress, setShowProgress] = useState(false)
  const [showDependencies, setShowDependencies] = useState(true)
  const [addFieldAnchorEl, setAddFieldAnchorEl] = useState<null | HTMLElement>(
    null,
  )

  const isAddFieldMenuOpen = Boolean(addFieldAnchorEl)
  const canShowAddFieldButton = !(showProgress && showDependencies)

  // Include all tasks and task lists for dependencies, excluding only the current task
  const availableTasksForDependencies = pulseTasks
    .flatMap((task) =>
      task.type === TaskType.Task ? task : task.children ?? [],
    )
    .filter((t) => t.id !== taskId)

  // Find the current task list title based on parent ID
  // When viewing, use task's parent; when editing, use form state's parentId
  const parentIdToUse = isEditMode ? parentId : task?.parent?.id
  const currentTaskList = parentIdToUse
    ? taskLists.find((list) => list.id === parentIdToUse)
    : null
  const currentTaskListTitle = currentTaskList?.title || 'No List'

  useEffect(() => {
    if (!task || isLoadingTask) return

    const initialValues = getInitialFormValues()
    reset(initialValues, { keepDefaultValues: false, keepDirty: false })
    // Keep state in sync with form for backward compatibility
    setColor(initialValues.color || '')
    setProgress(initialValues.progress || '0')
    // Initialize dependencies from task if available
    setDependencies(initialValues.dependencies || [])
    // Trigger validation after reset
    trigger()
  }, [task, isLoadingTask, reset, getInitialFormValues, trigger])

  // Show progress/dependencies when entering edit mode or when they exist
  useEffect(() => {
    if (isEditMode) {
      // Always show both fields in edit mode
      setShowProgress(true)
      setShowDependencies(true)
    } else {
      // In view mode, only show if they have values
      setShowProgress(!!task?.progress && task.progress !== '0')
      setShowDependencies(dependencies.length > 0)
    }
  }, [isEditMode, task?.progress, dependencies])

  // Update mode when initialMode changes and modal opens
  useEffect(() => {
    if (isOpen && initialMode !== null) {
      setMode(initialMode)
    } else if (!isOpen) {
      // Reset mode when modal closes
      setMode(null)
    }
  }, [isOpen, initialMode])

  // Autofocus title input when entering edit mode
  useEffect(() => {
    if (isEditMode && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [isEditMode])

  const handleStatusSelect = ({ status }: { status: TaskStatus | string }) => {
    // For custom statuses, status is a string ID; for default statuses, it's a TaskStatus enum
    // We need to store it as-is without casting to preserve custom status IDs
    setValue('status', status, { shouldDirty: true, shouldValidate: true })

    if (!isEditMode) {
      // Use setTimeout to ensure form state is updated before submitting
      setTimeout(() => {
        handleDirectSubmit()
      }, 0)
    }
  }

  const handleCopyDeeplink = (taskId: string) => {
    navigator.clipboard.writeText(
      `${window.location.origin}/${userRole?.toLowerCase()}/${pathFor({
        pathname: Routes.PulseTasks,
        query: {
          organizationId,
          pulseId,
        },
      })}?taskId=${taskId}`,
    )

    toast.success(t('link_copied'))
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
        shouldDirty: true,
        shouldValidate: true,
      })

      if (!isEditMode) {
        // Use setTimeout to ensure form state is updated before submitting
        setTimeout(() => {
          handleDirectSubmit()
        }, 0)
      }
    }

    // set mentions (always update mentions when selecting an assignee)
    setMentions((prev) => [...prev, name])
  }

  const handleClearAssignees = () => {
    setValue('assignees', [], { shouldDirty: true, shouldValidate: true })

    if (!isEditMode) {
      // Use setTimeout to ensure form state is updated before submitting
      setTimeout(() => {
        handleDirectSubmit()
      }, 0)
    }
  }

  const handleStartDateSelect = ({ date }: { date: Dayjs | null }) => {
    setValue('startDate', date?.format('YYYY-MM-DD') ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    })

    if (!isEditMode) handleDirectSubmit()
  }

  const handleDateSelect = ({ date }: { date: Dayjs | null }) => {
    setValue('dueDate', date?.format('YYYY-MM-DD') ?? '', {
      shouldDirty: true,
      shouldValidate: true,
    })

    if (!isEditMode) handleDirectSubmit()
  }

  const handlePrioritySelect = ({
    priority,
  }: {
    priority: TaskPriority | null
  }) => {
    setValue('priority', priority ?? TaskPriority.Low, {
      shouldDirty: true,
      shouldValidate: true,
    })

    if (!isEditMode) handleDirectSubmit()
  }

  const handleParentTaskSelect = ({
    parentId,
  }: {
    parentId: string | null
  }) => {
    setValue('parentId', parentId ?? null, {
      shouldDirty: true,
      shouldValidate: true,
    })

    if (!isEditMode) handleDirectSubmit()
  }

  const handleColorSelect = (selectedColor: string | null) => {
    const colorValue = selectedColor || ''
    setColor(colorValue)
    setValue('color', colorValue || undefined, {
      shouldDirty: true,
      shouldValidate: true,
    })

    if (!isEditMode) {
      // Update task with color when not in edit mode
      handleDirectSubmit()
    }
  }

  // Handlers for additional fields
  const handleAddFieldClick = (event: React.MouseEvent<HTMLElement>) => {
    setAddFieldAnchorEl(event.currentTarget)
  }

  const handleAddFieldClose = () => {
    setAddFieldAnchorEl(null)
  }

  const handleAddProgress = () => {
    setShowProgress(true)
    handleAddFieldClose()
  }

  const handleAddDependencies = () => {
    setShowDependencies(true)
    handleAddFieldClose()
  }

  const handleRemoveProgress = () => {
    setShowProgress(false)
  }

  const handleProgressChange = (newProgress: string) => {
    setProgress(newProgress)
    setValue('progress', newProgress || undefined, {
      shouldDirty: true,
      shouldValidate: true,
    })
    // Auto-save progress when not in edit mode (if backend supports it)
    if (!isEditMode) {
      // Progress will be saved when form is submitted
    }
  }

  const handleAddDependency = (taskId: string) => {
    if (!dependencies.includes(taskId)) {
      const updatedDependencies = [...dependencies, taskId]
      setDependencies(updatedDependencies)
      setValue('dependencies', updatedDependencies, {
        shouldDirty: true,
        shouldValidate: true,
      })
      // Enter edit mode if not already in it
      if (!isEditMode) {
        setMode('edit')
      }
    }
  }

  const handleRemoveDependency = (taskId: string) => {
    const updatedDependencies = dependencies.filter((id) => id !== taskId)
    setDependencies(updatedDependencies)
    setValue('dependencies', updatedDependencies, {
      shouldDirty: true,
      shouldValidate: true,
    })
    // Enter edit mode if not already in it
    if (!isEditMode) {
      setMode('edit')
    }
  }

  const handleDeleteTask = () => {
    deleteTask(
      taskId,
      () => {
        setMode(null)
        onClose()
      },
      () => {
        setMode(null)
      },
    )
  }

  const onSubmitHandler = useCallback(
    (data: UpdateTaskParams) => {
      console.log('onSubmitHandler called with data:', data)
      const {
        assignees,
        description,
        startDate,
        dueDate,
        parentId,
        priority,
        status,
        title,
        color: formColor,
        progress: formProgress,
        dependencies: _formDependencies, // Used in DependenciesField via useWatch (line ~790)
      } = data

      const cleanedTitle = removeMentions(mentions, title)

      // Determine if status is a custom status ID (string) or default status (TaskStatus enum)
      const isCustomStatusId =
        pulseStatusOption === PulseStatusOption.Custom &&
        typeof status === 'string' &&
        !Object.values(TaskStatus).includes(status as TaskStatus)

      const updateInput: UpdateTaskInput = {
        assignees,
        color: formColor || undefined,
        dependency_task_ids: dependencies.length > 0 ? dependencies : [],
        description,
        due_date: dueDate,
        organization_id: organizationId,
        parent_id: parentId || undefined,
        priority,
        progress: formProgress || undefined,
        start_date: startDate || undefined,
        taskId,
        title: cleanedTitle,
      }

      // Use task_status_id for custom statuses, status for default statuses
      if (isCustomStatusId) {
        updateInput.task_status_id = status
      } else {
        updateInput.status = status as TaskStatus
      }

      updateTask(
        updateInput,
        () => {
          setMode(null)
          reset()
        },
        () => {
          setMode(null)
        },
      )
    },
    [
      updateTask,
      organizationId,
      taskId,
      reset,
      mentions,
      dependencies,
      pulseStatusOption,
    ],
  )
  const handleDirectSubmit = handleSubmit(
    (data) => {
      console.log('handleDirectSubmit - form is valid, calling onSubmitHandler')
      onSubmitHandler(data)
    },
    (errors) => {
      console.log('handleDirectSubmit - form validation errors:', errors)
    },
  )

  const handleCancel = () => {
    if (mode === 'edit') {
      reset(getInitialFormValues())
    }

    setMode(null)
    onClose()
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (title?.trim()) {
        handleDirectSubmit()
      }
    }
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <CustomModalWithSubmit
      disabledSubmit={
        isEditMode
          ? !isValid || !isDirty || isPendingUpdateTask
          : !isValid || isPendingUpdateTask
      }
      footerText={isEditMode ? 'Press Enter to save task' : undefined}
      headerActions={[
        ...(!isEditMode
          ? [
              {
                icon: EditOutlined,
                onClick: () => setMode('edit'),
              },
            ]
          : []),
        ...(!isDeleteMode
          ? [
              {
                icon: DeleteOutlined,
                onClick: () => setMode('delete'),
              },
            ]
          : []),
        {
          icon: ShareOutlined,
          onClick: () => handleCopyDeeplink(taskId),
        },
      ]}
      headerContent={
        !isLoadingTask && task ? (
          <Stack spacing={1}>
            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography color="text.secondary" variant="caption">
                {isEditMode ? `Editing task no.` : `Viewing task no.`}
              </Typography>
              <Typography sx={{ fontWeight: 500 }} variant="caption">
                {task?.task_number || 'BUJ-1'}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                in
              </Typography>
              <Typography sx={{ fontWeight: 500 }} variant="caption">
                {pulseName}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                /
              </Typography>
              {isEditMode ? (
                <Select
                  disabled={!isEditMode || isPendingUpdateTask}
                  displayEmpty={true}
                  onChange={(e) => {
                    const value = e.target.value
                    handleParentTaskSelect({
                      parentId: value || null,
                    })
                  }}
                  size="small"
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: '0.75rem',
                      minHeight: 'auto',
                      py: 0.5,
                    },
                    '&:after': {
                      borderBottom: 'none',
                    },
                    '&:before': {
                      borderBottom: 'none',
                    },
                    '&:hover:not(.Mui-disabled):before': {
                      borderBottom: 'none',
                    },
                    minWidth: 140,
                  }}
                  value={parentId || ''}
                  variant="standard"
                >
                  <MenuItem value="">
                    <em>No List</em>
                  </MenuItem>
                  {taskLists.map((list) => (
                    <MenuItem key={list.id} value={list.id}>
                      {list.title}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <Typography color="text.primary" variant="caption">
                  {currentTaskListTitle}
                </Typography>
              )}
            </Stack>
            {isEditMode ? (
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <TextField
                    {...field}
                    InputProps={{
                      disableUnderline: true,
                    }}
                    autoFocus={true}
                    fullWidth={true}
                    inputRef={titleInputRef}
                    onKeyDown={handleTitleKeyDown}
                    placeholder={`${t('task_creation_placeholder', { ns: 'tasks' })} ${t('task', { ns: 'tasks' })}`}
                    variant="standard"
                  />
                )}
              />
            ) : (
              <Typography color="text.primary" variant="h5">
                {task?.title}
              </Typography>
            )}
            <Typography color="text.secondary" variant="caption">
              Created by: {task?.createdBy?.name ?? 'unknown'}
            </Typography>
          </Stack>
        ) : undefined
      }
      isEditable={!!mode}
      isOpen={isOpen}
      isSubmitting={isPendingDeleteTask || isPendingUpdateTask}
      maxHeight="90vh"
      maxWidth={isDeleteMode ? 400 : 900}
      onCancel={handleCancel}
      onClose={onClose}
      onSubmit={isEditMode ? handleDirectSubmit : handleDeleteTask}
      submitOnEnter={true}
      submitText={mode === 'delete' ? 'Delete' : 'Save'}
      type={isDeleteMode ? 'warning' : 'default'}
    >
      {isLoadingTask ? (
        <LoadingState />
      ) : isDeleteMode ? (
        <Stack>
          <Typography
            component="div"
            gutterBottom={true}
            sx={{ color: theme.palette.error.main }}
          >
            {t('warning')}
          </Typography>
          <Typography>
            {t('delete_task_confirmation', { ns: 'tasks' })}
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={3}>
          {/* Description */}
          {isEditMode ? (
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth={true}
                  multiline={true}
                  onKeyDown={handleDescriptionKeyDown}
                  placeholder={t('enter_task_description', { ns: 'tasks' })}
                  rows={4}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: 'small',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        border: 'none',
                      },
                      '&.Mui-focused fieldset': {
                        border: 'none',
                      },
                      '&:hover fieldset': {
                        border: 'none',
                      },
                    },
                    backgroundColor: '#fafafa',
                  }}
                />
              )}
            />
          ) : description ? (
            <Typography
              sx={{
                maxHeight: '50%',
                overflow: 'auto',
                whiteSpace: 'pre-line',
              }}
              variant="body2"
            >
              {parse(convertLinksToHtml(description))}
            </Typography>
          ) : (
            <Typography
              color="text.secondary"
              component="span"
              fontStyle="italic"
              variant="caption"
            >
              {t('no_task_description', { ns: 'tasks' })}
            </Typography>
          )}

          {/* Divider */}
          <Divider sx={{ my: 1 }} />

          {/* Details Section */}
          <Stack spacing={2}>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: 'small',
              }}
              variant="body2"
            >
              DETAILS
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={0.5} spacing={0.5}>
              <StatusDropdown
                customStatuses={
                  pulseStatusOption === PulseStatusOption.Custom
                    ? customStatuses
                    : undefined
                }
                disabled={isPendingUpdateTask}
                onSelect={(status) => handleStatusSelect({ status })}
                selectedStatus={status}
              />

              <AssigneeDropdown
                assigneeIds={assignees}
                disabled={isPendingUpdateTask}
                onClear={handleClearAssignees}
                onSelect={handleAssigneeSelect}
              />

              <CalendarDropdown
                disabled={isPendingUpdateTask}
                label="Start Date"
                onSelect={(date) => handleStartDateSelect({ date })}
                selectedDate={startDate}
              />

              <CalendarDropdown
                disabled={isPendingUpdateTask}
                label="Due Date"
                onSelect={(date) => handleDateSelect({ date })}
                selectedDate={dueDate}
              />

              <PriorityDropdown
                disabled={isPendingUpdateTask}
                onSelect={(priority) => handlePrioritySelect({ priority })}
                selectedPriority={priority}
              />

              <ColorDropdown
                disabled={isPendingUpdateTask}
                onSelect={handleColorSelect}
                selectedColor={formColor || color || null}
              />

              {/* Add Field Button */}
              {canShowAddFieldButton && isEditMode && (
                <>
                  <IconButton
                    onClick={handleAddFieldClick}
                    size="small"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <AddOutlined />
                  </IconButton>
                  <Menu
                    anchorEl={addFieldAnchorEl}
                    anchorOrigin={{
                      horizontal: 'left',
                      vertical: 'bottom',
                    }}
                    onClose={handleAddFieldClose}
                    open={isAddFieldMenuOpen}
                    transformOrigin={{
                      horizontal: 'left',
                      vertical: 'top',
                    }}
                  >
                    {!showProgress && (
                      <MenuItem onClick={handleAddProgress}>Progress</MenuItem>
                    )}
                    {!showDependencies && (
                      <MenuItem onClick={handleAddDependencies}>
                        Dependencies
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
            </Stack>

            {/* Dependencies Button */}
            {!showDependencies && pulseTasks.length > 0 && (
              <Button
                color="inherit"
                onClick={() => setShowDependencies(true)}
                sx={{
                  backgroundColor: '#fafafa',
                  borderColor: 'divider',
                  borderRadius: 2,
                  maxWidth: 160,
                }}
                variant="outlined"
              >
                <Typography textTransform="none">Dependencies</Typography>
              </Button>
            )}

            {/* Progress Component */}
            {showProgress && (
              <ProgressField
                disabled={isPendingUpdateTask}
                onChange={isEditMode ? handleProgressChange : undefined}
                onRemove={
                  isEditMode
                    ? handleRemoveProgress
                    : () => {
                        // No-op for view mode
                      }
                }
                progress={
                  isEditMode
                    ? formProgress || progress || '0'
                    : task?.progress || '0'
                }
              />
            )}

            {/* Dependencies Component */}
            {showDependencies && (
              <Stack
                sx={{
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={() => setShowDependencies(false)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    zIndex: 1,
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
                <DependenciesField
                  availableTasks={availableTasksForDependencies}
                  currentTaskId={taskId}
                  dependencies={
                    isEditMode
                      ? formDependencies || dependencies
                      : (() => {
                          const taskDeps = (
                            task as { dependencies?: { id: string }[] }
                          )?.dependencies
                          return Array.isArray(taskDeps)
                            ? taskDeps.map((dep) => dep.id)
                            : []
                        })()
                  }
                  disabled={isPendingUpdateTask}
                  onAddDependency={handleAddDependency}
                  onRemoveDependency={handleRemoveDependency}
                />
              </Stack>
            )}
          </Stack>

          {/* Updated By Footer */}
          {task?.updatedBy && (
            <Stack alignItems="end" direction="row" justifyContent="flex-end">
              <Typography color="text.secondary" variant="body2">
                {`Updated by ${task?.updatedBy.name} at ${dayjs
                  .utc(task?.updatedAt)
                  .tz(user?.timezone ?? 'UTC')
                  .format('MMMM DD, YYYY h:mmA')}`}
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
    </CustomModalWithSubmit>
  )
}
