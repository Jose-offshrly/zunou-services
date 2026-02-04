import { Close } from '@mui/icons-material'
import {
  Button,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {
  CreateTaskInput,
  PulseCategory,
  PulseStatusOption,
  TaskEntity,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { CustomModalWithSubmit } from '~/components/ui/CustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'

import { useAddItemDialog } from '../hooks'
import { AssigneeDropdown } from '../View/ListView/CreateTaskForm/AssigneeDropdown'
import { CalendarDropdown } from '../View/ListView/CreateTaskForm/CalendarDropdown'
import { ColorDropdown } from '../View/ListView/CreateTaskForm/ColorDropdown'
import { PriorityDropdown } from '../View/ListView/CreateTaskForm/PriorityDropdown'
import { StatusDropdown } from '../View/ListView/CreateTaskForm/StatusDropdown'
import { DependenciesField } from './Toolbar/DependenciesField'

interface AddItemDialogProps {
  open: boolean
  onClose: () => void
  initialMode?: 'task' | 'milestone' | 'timeline-item'
  initialParentId?: string | null
  initialStatus?: TaskStatus | string
}

// Item creation mode
type ItemMode = 'task' | 'milestone' | 'timeline-item'

export const AddItemDialog = ({
  open,
  onClose,
  initialMode = 'task',
  initialParentId,
  initialStatus,
}: AddItemDialogProps) => {
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const { pulse, pulseCategory, pulseStatusOption } = usePulseStore()
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Selected pulse ID for task creation (defaults to current pulseId)
  const [selectedPulseIdForCreation, setSelectedPulseIdForCreation] = useState<
    string | undefined
  >(pulseId)

  // Update selected pulse ID when dialog opens or pulseId changes
  useEffect(() => {
    if (open && pulseId) {
      setSelectedPulseIdForCreation(pulseId)
    }
  }, [open, pulseId])

  // Use centralized hooks for data fetching and mutations
  const { allPulses, taskLists, pulseTasks, createTask, isPendingCreateTask } =
    useAddItemDialog(open, selectedPulseIdForCreation)

  // Include all tasks and task lists for dependencies, excluding only the current task
  const availableTasksForDependencies = pulseTasks.flatMap((task) =>
    task.type === TaskType.Task ? task : task.children ?? [],
  )

  // Fetch task statuses based on statusOption
  const shouldFetchDefaults = pulseStatusOption === PulseStatusOption.Default
  const shouldFetchCustom =
    pulseStatusOption === PulseStatusOption.Custom && selectedPulseIdForCreation

  const { data: taskStatusesData } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled:
      open &&
      (shouldFetchDefaults ||
        (shouldFetchCustom && selectedPulseIdForCreation) !== undefined),
    variables: shouldFetchDefaults
      ? { defaults: true }
      : shouldFetchCustom
        ? { pulseId: selectedPulseIdForCreation }
        : undefined,
  })

  const customStatuses = taskStatusesData?.taskStatuses

  const [mode, setMode] = useState<ItemMode>(initialMode)
  const [selectedListId, setSelectedListId] = useState<string | null>(
    initialParentId || null,
  )
  const [formData, setFormData] = useState({
    assignees: [] as string[],
    color: '',
    dependencies: [] as string[],
    description: '',
    dueDate: undefined as string | undefined,
    parentId: undefined as string | undefined,
    priority: undefined as TaskPriority | undefined,
    startDate: undefined as string | undefined,
    status: TaskStatus.Todo as TaskStatus | string,
    title: '',
  })
  const [showDependencies, setShowDependencies] = useState(false)

  // Update mode when initialMode changes
  useEffect(() => {
    if (open && initialMode) {
      setMode(initialMode)
    }
  }, [open, initialMode])

  // Update selectedListId and status when initialParentId/initialStatus changes and dialog opens
  useEffect(() => {
    if (open) {
      if (initialParentId) {
        setSelectedListId(initialParentId)
        setFormData((prev) => ({
          ...prev,
          parentId: initialParentId || undefined,
        }))
      }
      if (initialStatus) {
        setFormData((prev) => ({
          ...prev,
          status: initialStatus,
        }))
      }
    }
  }, [open, initialParentId, initialStatus])

  // Autofocus title input when dialog opens
  useEffect(() => {
    if (open && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        assignees: [],
        color: '',
        dependencies: [],
        description: '',
        dueDate: undefined,
        parentId: undefined,
        priority: undefined,
        startDate: undefined,
        status: TaskStatus.Todo,
        title: '',
      })
      setSelectedListId(null)
      setSelectedPulseIdForCreation(pulseId)
      setShowDependencies(false)
    }
  }, [open, pulseId])

  const isPersonalPulse = pulseCategory === PulseCategory.Personal
  const pulseName = pulse?.name || 'My Tasks'

  const handleSave = () => {
    if (!formData.title.trim()) {
      return
    }

    const pulseIdForCreation = selectedPulseIdForCreation || pulseId
    if (!pulseIdForCreation || !organizationId) {
      return
    }

    // Determine if status is a custom status ID (string) or default status (TaskStatus enum)
    const isCustomStatusId =
      pulseStatusOption === PulseStatusOption.Custom &&
      typeof formData.status === 'string' &&
      !Object.values(TaskStatus).includes(formData.status as TaskStatus)

    const taskInput = {
      assignees: formData.assignees.length > 0 ? formData.assignees : undefined,
      dependency_task_ids:
        formData.dependencies.length > 0 ? formData.dependencies : undefined,
      description: formData.description || undefined,
      entity_id: pulseIdForCreation,
      entity_type: TaskEntity.Pulse,
      organization_id: organizationId,
      priority: formData.priority,
      task_type:
        mode === 'milestone'
          ? ('MILESTONE' as unknown as TaskType)
          : TaskType.Task,
      title: formData.title,
      ...(mode !== 'milestone' && {
        due_date: formData.dueDate || undefined,
        start_date: formData.startDate || undefined,
      }),
      ...(formData.color ? { color: formData.color } : {}),
      parent_id: selectedListId || undefined,
      // Use task_status_id for custom statuses, status for default statuses
      ...(isCustomStatusId
        ? { task_status_id: formData.status }
        : { status: formData.status as TaskStatus }),
    } as CreateTaskInput

    createTask(taskInput, onClose)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (formData.title.trim()) {
        handleSave()
      }
    }
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
    // Shift+Enter allows new line (default behavior)
  }

  return (
    <CustomModalWithSubmit
      disabledSubmit={!formData.title.trim() || isPendingCreateTask}
      footerText="Press Enter to create task"
      headerContent={
        <Stack alignItems="center" direction="row" spacing={1}>
          <Typography color="text.secondary" variant="caption">
            You&apos;re creating a task in:
          </Typography>
          {isPersonalPulse ? (
            <Select
              displayEmpty={false}
              onChange={(e) => {
                const value = e.target.value
                setSelectedPulseIdForCreation(value)
                // Reset selected list when pulse changes
                setSelectedListId(null)
                setFormData((prev) => ({ ...prev, parentId: undefined }))
              }}
              size="small"
              sx={{
                '& .MuiSelect-select': {
                  fontSize: '0.75rem',
                  fontWeight: 500,
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
              value={selectedPulseIdForCreation || ''}
              variant="standard"
            >
              {allPulses.map((p: { id: string; name?: string | null }) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name || 'My Tasks'}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <Typography sx={{ fontWeight: 500 }} variant="caption">
              {pulseName}
            </Typography>
          )}
          <Typography color="text.secondary" variant="caption">
            /
          </Typography>
          <Select
            displayEmpty={true}
            onChange={(e) => {
              const value = e.target.value
              setSelectedListId(value || null)
              setFormData((prev) => ({ ...prev, parentId: value || undefined }))
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
            value={selectedListId || ''}
            variant="standard"
          >
            <MenuItem value="">
              <em>No List</em>
            </MenuItem>
            {taskLists.map((list: { id: string; title: string }) => (
              <MenuItem key={list.id} value={list.id}>
                {list.title}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      }
      isOpen={open}
      isSubmitting={isPendingCreateTask}
      maxHeight="90vh"
      maxWidth={900}
      onCancel={onClose}
      onClose={onClose}
      onSubmit={handleSave}
      submitOnEnter={true}
      submitText="Create Task"
    >
      <Stack spacing={3}>
        {/* Status Selector */}
        <Stack alignItems="center" direction="row" spacing={1}>
          <StatusDropdown
            customStatuses={
              pulseStatusOption === PulseStatusOption.Custom
                ? customStatuses
                : undefined
            }
            onSelect={(status) =>
              setFormData((prev) => ({
                ...prev,
                // For custom statuses, status is a string ID; for default statuses, it's a TaskStatus enum
                status: status || TaskStatus.Todo,
              }))
            }
            selectedStatus={formData.status}
          />
          {/* Title Input */}
          <TextField
            InputProps={{
              disableUnderline: true,
            }}
            autoFocus={true}
            fullWidth={true}
            inputRef={titleInputRef}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            onKeyDown={handleTitleKeyDown}
            placeholder="What needs to be done?"
            value={formData.title}
            variant="standard"
          />
        </Stack>

        <TextField
          fullWidth={true}
          multiline={true}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          onKeyDown={handleDescriptionKeyDown}
          placeholder="Add a description…"
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
          value={formData.description}
        />

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

          <Stack direction="row" flexWrap="wrap" gap={1.5} spacing={1.5}>
            {/* Assignee */}
            <AssigneeDropdown
              assigneeIds={formData.assignees}
              disabled={isPendingCreateTask}
              onClear={() =>
                setFormData((prev) => ({ ...prev, assignees: [] }))
              }
              onSelect={({ id }) => {
                const currentAssignees = formData.assignees
                const isCurrentlyAssigned = currentAssignees.includes(id)
                const updatedAssignees = isCurrentlyAssigned
                  ? currentAssignees.filter((assigneeId) => assigneeId !== id)
                  : [...currentAssignees, id]
                setFormData((prev) => ({
                  ...prev,
                  assignees: updatedAssignees,
                }))
              }}
            />

            {/* Start Date */}
            <CalendarDropdown
              disabled={isPendingCreateTask}
              label="Start Date"
              onSelect={(date) => {
                setFormData((prev) => ({
                  ...prev,
                  startDate: date
                    ? dayjs(date).format('YYYY-MM-DD')
                    : undefined,
                }))
              }}
              selectedDate={formData.startDate}
            />

            {/* Due Date */}
            <CalendarDropdown
              disabled={isPendingCreateTask}
              label="Due Date"
              onSelect={(date) => {
                setFormData((prev) => ({
                  ...prev,
                  dueDate: date ? dayjs(date).format('YYYY-MM-DD') : undefined,
                }))
              }}
              selectedDate={formData.dueDate}
            />

            {/* Priority */}
            <PriorityDropdown
              disabled={isPendingCreateTask}
              onSelect={(priority) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: priority || undefined,
                }))
              }
              selectedPriority={formData.priority || null}
            />

            {/* Color */}
            <ColorDropdown
              disabled={isPendingCreateTask}
              onSelect={(color) =>
                setFormData((prev) => ({ ...prev, color: color || '' }))
              }
              selectedColor={formData.color || null}
            />

            {/* Add Dependencies Button */}
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
          </Stack>

          {/* Dependencies Field */}
          {showDependencies && pulseTasks.length > 0 && (
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
                dependencies={formData.dependencies}
                disabled={isPendingCreateTask}
                onAddDependency={(taskId) => {
                  // add dependency to form data
                  if (!formData.dependencies.includes(taskId)) {
                    setFormData((prev) => ({
                      ...prev,
                      dependencies: [...prev.dependencies, taskId],
                    }))
                  }
                }}
                onRemoveDependency={(taskId) => {
                  setFormData((prev) => ({
                    ...prev,
                    dependencies: prev.dependencies.filter(
                      (id) => id !== taskId,
                    ),
                  }))
                }}
              />
            </Stack>
          )}
        </Stack>
      </Stack>
    </CustomModalWithSubmit>
  )
}
