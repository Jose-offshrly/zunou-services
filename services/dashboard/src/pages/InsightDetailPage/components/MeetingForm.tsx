import { EditOutlined } from '@mui/icons-material'
import CloseIcon from '@mui/icons-material/Close'
import { Box, Button, Chip, IconButton, Stack } from '@mui/material'
import { TaskPriority, TaskStatus } from '@zunou-graphql/core/graphql'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { TextField } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { AssigneeDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/AssigneeDropdown'
import { CalendarDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/CalendarDropdown'
import { PriorityDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/PriorityDropdown'
import { StatusDropdown } from '~/pages/manager/PulseTaskPage/View/ListView/CreateTaskForm/StatusDropdown'

interface ActionItem {
  title: string
  description: string
  assignees: { name: string }[]
  status: string
  priority: string
  due_date: string | null
}

// Helper function to parse JSON string or return array as-is
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseArrayField = (value: any): any[] => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// Helper function to convert string to TaskStatus (case-insensitive)
const stringToTaskStatus = (status: string | undefined): TaskStatus => {
  if (!status) return TaskStatus.Todo

  const normalized = status.toLowerCase().replace(/\s+/g, '')

  switch (normalized) {
    case 'todo':
    case 'notstarted':
      return TaskStatus.Todo
    case 'inprogress':
    case 'ongoing':
      return TaskStatus.Inprogress
    case 'done':
    case 'completed':
      return TaskStatus.Completed
    default:
      return TaskStatus.Todo
  }
}

// Helper function to convert string to TaskPriority (case-insensitive)
const stringToTaskPriority = (priority: string | undefined): TaskPriority => {
  if (!priority) return TaskPriority.Medium

  const normalized = priority.toLowerCase()

  switch (normalized) {
    case 'low':
      return TaskPriority.Low
    case 'medium':
      return TaskPriority.Medium
    case 'high':
      return TaskPriority.High
    case 'urgent':
      return TaskPriority.Urgent
    default:
      return TaskPriority.Medium
  }
}

interface Props {
  pulseId: string
}

export default function MeetingForm({ pulseId }: Props) {
  const { control, watch, setValue } = useFormContext()
  const { user } = useAuthContext()

  const timezone = user?.timezone ?? 'UTC'

  const summary = watch('meeting_summary') ?? ''
  const rawActionItems = watch('meeting_action_items') ?? []
  const rawPotentialStrategies = watch('meeting_potential_strategies') ?? []

  // Parse the fields to ensure they're arrays
  const actionItems = parseArrayField(rawActionItems)
  const potentialStrategies = parseArrayField(rawPotentialStrategies)

  const { data: membersData } = useGetPulseMembersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { pulseId },
  })

  const pulseMembers = membersData?.pulseMembers.data ?? []

  const [newStrategy, setNewStrategy] = useState('')
  const [newActionItem, setNewActionItem] = useState({
    assignees: [] as { name: string }[],
    description: '',
    due_date: null as string | null,
    priority: TaskPriority.Medium,
    status: TaskStatus.Todo,
    title: '',
  })

  const [editingStrategyIndex, setEditingStrategyIndex] = useState<
    number | null
  >(null)
  const [editingStrategyValue, setEditingStrategyValue] = useState('')

  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(
    null,
  )
  const [editingActionValue, setEditingActionValue] =
    useState<ActionItem | null>(null)

  // Normalize the form values on mount and when raw values change
  useEffect(() => {
    const parsedActionItems = parseArrayField(rawActionItems)
    const parsedStrategies = parseArrayField(rawPotentialStrategies)

    // Only update if the current value is a string (needs normalization)
    if (typeof rawActionItems === 'string' && rawActionItems) {
      setValue('meeting_action_items', parsedActionItems, {
        shouldValidate: false,
      })
    }

    if (typeof rawPotentialStrategies === 'string' && rawPotentialStrategies) {
      setValue('meeting_potential_strategies', parsedStrategies, {
        shouldValidate: false,
      })
    }
  }, [rawActionItems, rawPotentialStrategies, setValue])

  const handleNewActionAssigneeSelect = ({
    id: _userId,
    name,
  }: {
    id: string
    name: string
  }) => {
    const isCurrentlyAssigned = newActionItem.assignees.some(
      (assignee) => assignee.name === name,
    )

    const updatedAssignees = isCurrentlyAssigned
      ? newActionItem.assignees.filter((assignee) => assignee.name !== name)
      : [...newActionItem.assignees, { name }]

    setNewActionItem({ ...newActionItem, assignees: updatedAssignees })
  }

  const handleEditingActionAssigneeSelect = ({
    id: _userId,
    name,
  }: {
    id: string
    name: string
  }) => {
    if (!editingActionValue) return

    const isCurrentlyAssigned = editingActionValue.assignees.some(
      (assignee) => assignee.name === name,
    )

    const updatedAssignees = isCurrentlyAssigned
      ? editingActionValue.assignees.filter(
          (assignee) => assignee.name !== name,
        )
      : [
          ...editingActionValue.assignees.filter(
            (assignee) => assignee.name !== name,
          ),
          { name },
        ]

    setEditingActionValue({
      ...editingActionValue,
      assignees: updatedAssignees,
    })
  }

  const handleClearNewActionAssignees = () => {
    setNewActionItem({ ...newActionItem, assignees: [] })
  }

  const handleClearEditingActionAssignees = () => {
    if (!editingActionValue) return
    setEditingActionValue({ ...editingActionValue, assignees: [] })
  }

  const handleNewActionStatusSelect = (status: TaskStatus | string) => {
    setNewActionItem({ ...newActionItem, status: status as TaskStatus })
  }

  const handleEditingActionStatusSelect = (status: TaskStatus | string) => {
    if (!editingActionValue) return
    setEditingActionValue({
      ...editingActionValue,
      status: status as TaskStatus,
    })
  }

  const handleNewActionPrioritySelect = (priority: TaskPriority | null) => {
    setNewActionItem({
      ...newActionItem,
      priority: priority || TaskPriority.Medium,
    })
  }

  const handleEditingActionPrioritySelect = (priority: TaskPriority | null) => {
    if (!editingActionValue) return
    setEditingActionValue({
      ...editingActionValue,
      priority: priority || TaskPriority.Medium,
    })
  }

  const handleNewActionDateSelect = (date: Dayjs | null) => {
    if (date) {
      const currentTime = dayjs().tz(timezone)
      const dateWithCurrentTime = date
        .clone()
        .hour(currentTime.hour())
        .minute(currentTime.minute())
        .second(currentTime.second())

      setNewActionItem({
        ...newActionItem,
        due_date: dateWithCurrentTime.format('YYYY-MM-DD HH:mm:ss'),
      })
    } else {
      setNewActionItem({ ...newActionItem, due_date: null })
    }
  }

  const handleEditingActionDateSelect = (date: Dayjs | null) => {
    if (!editingActionValue) return

    if (date) {
      const currentTime = dayjs().tz(timezone)
      const dateWithCurrentTime = date
        .clone()
        .hour(currentTime.hour())
        .minute(currentTime.minute())
        .second(currentTime.second())

      setEditingActionValue({
        ...editingActionValue,
        due_date: dateWithCurrentTime.format('YYYY-MM-DD HH:mm:ss'),
      })
    } else {
      setEditingActionValue({ ...editingActionValue, due_date: null })
    }
  }

  const handleAddStrategy = () => {
    if (newStrategy.trim()) {
      // Ensure we're always working with arrays
      const currentStrategies = parseArrayField(potentialStrategies)
      setValue(
        'meeting_potential_strategies',
        [...currentStrategies, newStrategy.trim()],
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      )
      setNewStrategy('')
    }
  }

  const handleStartEditStrategy = (index: number, value: string) => {
    setEditingStrategyIndex(index)
    setEditingStrategyValue(value)
  }

  const handleSaveEditStrategy = () => {
    if (editingStrategyIndex !== null && editingStrategyValue.trim()) {
      const currentStrategies = parseArrayField(potentialStrategies)
      const updated = [...currentStrategies]
      updated[editingStrategyIndex] = editingStrategyValue.trim()
      setValue('meeting_potential_strategies', updated, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setEditingStrategyIndex(null)
      setEditingStrategyValue('')
    }
  }

  const handleCancelEditStrategy = () => {
    setEditingStrategyIndex(null)
    setEditingStrategyValue('')
  }

  const handleRemoveStrategy = (index: number) => {
    const currentStrategies = parseArrayField(potentialStrategies)
    const updated = currentStrategies.filter(
      (_: string, i: number) => i !== index,
    )
    setValue('meeting_potential_strategies', updated, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleAddActionItem = () => {
    if (newActionItem.title.trim() && newActionItem.description.trim()) {
      // Ensure we're always working with arrays
      const currentItems = parseArrayField(actionItems)
      setValue(
        'meeting_action_items',
        [...currentItems, { ...newActionItem }],
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      )
      setNewActionItem({
        assignees: [],
        description: '',
        due_date: null,
        priority: TaskPriority.Medium,
        status: TaskStatus.Todo,
        title: '',
      })
    }
  }

  const handleStartEditActionItem = (index: number, item: ActionItem) => {
    setEditingActionIndex(index)
    setEditingActionValue({ ...item })
  }

  const handleSaveEditActionItem = () => {
    if (
      editingActionIndex !== null &&
      editingActionValue &&
      editingActionValue.title.trim() &&
      editingActionValue.description.trim()
    ) {
      const currentItems = parseArrayField(actionItems)
      const updated = [...currentItems]
      updated[editingActionIndex] = editingActionValue
      setValue('meeting_action_items', updated, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setEditingActionIndex(null)
      setEditingActionValue(null)
    }
  }

  const handleCancelEditActionItem = () => {
    setEditingActionIndex(null)
    setEditingActionValue(null)
  }

  const handleRemoveActionItem = (index: number) => {
    const currentItems = parseArrayField(actionItems)
    const updated = currentItems.filter(
      (_: ActionItem, i: number) => i !== index,
    )
    setValue('meeting_action_items', updated, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  // Convert assignees array to ID array for AssigneeDropdown
  const getAssigneeIds = (assignees: { name: string }[]) => {
    return assignees
      .map((assignee) => {
        const member = pulseMembers.find((m) => m.user.name === assignee.name)
        return member?.id || ''
      })
      .filter(Boolean)
  }

  return (
    <Stack gap={3}>
      {/* Summary Field */}
      <Box>
        <TextField
          control={control}
          maxRows={15}
          minRows={8}
          multiline={true}
          name="meeting_summary"
          placeholder="Meeting Summary"
          sx={{
            '& textarea': {
              maxHeight: '50vh',
              resize: 'vertical',
            },
          }}
          value={summary}
        />
      </Box>

      {/* Action Items Section */}
      <Box>
        <Box sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
          Action Items
        </Box>

        {/* Display existing action items */}
        <Stack gap={2} mb={2}>
          {actionItems.map((item: ActionItem, index: number) => (
            <Box
              key={index}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                position: 'relative',
              }}
            >
              {editingActionIndex === index ? (
                // Edit mode
                <Stack gap={1.5}>
                  <input
                    onChange={(e) =>
                      setEditingActionValue((prev) =>
                        prev ? { ...prev, title: e.target.value } : null,
                      )
                    }
                    placeholder="Action Item Title"
                    style={{
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      padding: '8px 12px',
                    }}
                    type="text"
                    value={editingActionValue?.title || ''}
                  />
                  <textarea
                    onChange={(e) =>
                      setEditingActionValue((prev) =>
                        prev ? { ...prev, description: e.target.value } : null,
                      )
                    }
                    placeholder="Action Item Description"
                    rows={2}
                    style={{
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      maxHeight: '120px',
                      minHeight: '60px',
                      padding: '8px 12px',
                      resize: 'vertical',
                    }}
                    value={editingActionValue?.description || ''}
                  />
                  <Stack direction="row" flexWrap="wrap" spacing={2}>
                    <StatusDropdown
                      onSelect={handleEditingActionStatusSelect}
                      selectedStatus={stringToTaskStatus(
                        editingActionValue?.status,
                      )}
                    />

                    <AssigneeDropdown
                      assigneeIds={getAssigneeIds(
                        editingActionValue?.assignees || [],
                      )}
                      customPulseMembers={pulseMembers}
                      onClear={handleClearEditingActionAssignees}
                      onSelect={handleEditingActionAssigneeSelect}
                    />

                    <CalendarDropdown
                      onSelect={handleEditingActionDateSelect}
                      selectedDate={editingActionValue?.due_date ?? undefined}
                    />

                    <PriorityDropdown
                      onSelect={handleEditingActionPrioritySelect}
                      selectedPriority={stringToTaskPriority(
                        editingActionValue?.priority,
                      )}
                    />
                  </Stack>
                  <Stack alignItems="center" direction="row" gap={1} mt={1}>
                    <Button
                      disabled={
                        !editingActionValue?.title.trim() ||
                        !editingActionValue?.description.trim()
                      }
                      onClick={handleSaveEditActionItem}
                      size="small"
                      variant="contained"
                    >
                      Save
                    </Button>
                    <IconButton
                      onClick={handleCancelEditActionItem}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              ) : (
                // Display mode
                <>
                  <Stack
                    direction="row"
                    gap={1}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                  >
                    <IconButton
                      onClick={() => handleStartEditActionItem(index, item)}
                      size="small"
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleRemoveActionItem(index)}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Box sx={{ fontWeight: 600, mb: 0.5, pr: 10 }}>
                    {item.title}
                  </Box>
                  <Box
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.875rem',
                      mb: 1,
                    }}
                  >
                    {item.description}
                  </Box>
                  <Stack
                    alignItems="center"
                    direction="row"
                    flexWrap="wrap"
                    gap={1}
                  >
                    <Chip label={item.status} size="small" />
                    <Chip color="primary" label={item.priority} size="small" />
                    {item.due_date && (
                      <Chip
                        color="secondary"
                        label={dayjs(item.due_date).format('MMM D, YYYY')}
                        size="small"
                      />
                    )}
                    {item.assignees.map((assignee, idx) => (
                      <Chip
                        key={idx}
                        label={assignee.name}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          ))}
        </Stack>

        {/* Add new action item */}
        <Stack
          gap={1.5}
          sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2 }}
        >
          <input
            onChange={(e) =>
              setNewActionItem({ ...newActionItem, title: e.target.value })
            }
            placeholder="Action Item Title"
            style={{
              border: '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              padding: '8px 12px',
            }}
            type="text"
            value={newActionItem.title}
          />
          <textarea
            onChange={(e) =>
              setNewActionItem({
                ...newActionItem,
                description: e.target.value,
              })
            }
            placeholder="Action Item Description"
            rows={2}
            style={{
              border: '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              maxHeight: '120px',
              minHeight: '60px',
              padding: '8px 12px',
              resize: 'vertical',
            }}
            value={newActionItem.description}
          />
          <Stack direction="row" flexWrap="wrap" spacing={2}>
            <StatusDropdown
              onSelect={handleNewActionStatusSelect}
              selectedStatus={newActionItem.status}
            />

            <AssigneeDropdown
              assigneeIds={getAssigneeIds(newActionItem.assignees)}
              customPulseMembers={pulseMembers}
              onClear={handleClearNewActionAssignees}
              onSelect={handleNewActionAssigneeSelect}
            />

            <CalendarDropdown
              onSelect={handleNewActionDateSelect}
              selectedDate={newActionItem.due_date ?? undefined}
            />

            <PriorityDropdown
              onSelect={handleNewActionPrioritySelect}
              selectedPriority={newActionItem.priority}
            />
          </Stack>
          <Stack alignItems="center" direction="row" gap={1} mt={1}>
            <Button
              disabled={
                !newActionItem.title.trim() || !newActionItem.description.trim()
              }
              onClick={handleAddActionItem}
              size="small"
              variant="contained"
            >
              Add
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Potential Strategies Section */}
      <Box>
        <Box sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
          Potential Strategies
        </Box>

        {/* Display existing strategies */}
        <Stack gap={1} mb={2}>
          {potentialStrategies.map((strategy: string, index: number) => (
            <Box
              key={index}
              sx={{
                alignItems: 'flex-start',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                gap: 1,
                p: 1.5,
              }}
            >
              {editingStrategyIndex === index ? (
                // Edit mode
                <>
                  <input
                    autoFocus={true}
                    onChange={(e) => setEditingStrategyValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSaveEditStrategy()
                      }
                    }}
                    style={{
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: '4px',
                      flex: 1,
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      padding: '8px 12px',
                    }}
                    type="text"
                    value={editingStrategyValue}
                  />
                  <Button
                    disabled={!editingStrategyValue.trim()}
                    onClick={handleSaveEditStrategy}
                    size="small"
                    variant="contained"
                  >
                    Save
                  </Button>
                  <IconButton onClick={handleCancelEditStrategy} size="small">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </>
              ) : (
                // Display mode
                <>
                  <Box sx={{ flex: 1, fontSize: '0.875rem' }}>{strategy}</Box>
                  <IconButton
                    onClick={() => handleStartEditStrategy(index, strategy)}
                    size="small"
                  >
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleRemoveStrategy(index)}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          ))}
        </Stack>

        {/* Add new strategy */}
        <Stack direction="row" gap={1}>
          <input
            onChange={(e) => setNewStrategy(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddStrategy()
              }
            }}
            placeholder="Add a potential strategy..."
            style={{
              border: '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              flex: 1,
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              padding: '8px 12px',
            }}
            type="text"
            value={newStrategy}
          />
          <Button
            disabled={!newStrategy.trim()}
            onClick={handleAddStrategy}
            size="small"
            variant="contained"
          >
            Add
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}
