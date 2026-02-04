import { Add, Close } from '@mui/icons-material'
import {
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import {
  PulseStatusOption,
  TaskPriority,
  TaskStatus,
} from '@zunou-graphql/core/graphql'
import { useGetTaskStatusesQuery } from '@zunou-queries/core/hooks/useGetTaskStatusesQuery'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { usePulseStore } from '~/store/usePulseStore'
import { useTaskStore } from '~/store/useTaskStore'

export type FilterField = 'status' | 'priority' | 'assignee' | 'dueDate'
export type FilterOperator = 'is' | 'is_not' | 'within'

const defaultStatusOptions = [
  { label: 'TODO', value: TaskStatus.Todo },
  { label: 'In Progress', value: TaskStatus.Inprogress },
  { label: 'Complete', value: TaskStatus.Completed },
]

const priorityOptions = [
  { label: 'Urgent', value: TaskPriority.Urgent },
  { label: 'High', value: TaskPriority.High },
  { label: 'Medium', value: TaskPriority.Medium },
  { label: 'Low', value: TaskPriority.Low },
]

const fieldLabels: Record<FilterField, string> = {
  assignee: 'Assignee',
  dueDate: 'Due Date',
  priority: 'Priority',
  status: 'Status',
}

const getOperatorOptions = (
  field: FilterField,
): { label: string; value: FilterOperator }[] => {
  if (field === 'dueDate') {
    return [
      { label: 'is', value: 'is' },
      { label: 'within', value: 'within' },
    ]
  }
  return [
    { label: 'is', value: 'is' },
    { label: 'is not', value: 'is_not' },
  ]
}

interface FilterPopoverProps {
  anchorEl: HTMLElement | null
  onClose: () => void
  open: boolean
}

export const FilterPopover = ({
  anchorEl,
  onClose,
  open,
}: FilterPopoverProps) => {
  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseMembers, pulseStatusOption } = usePulseStore()
  const { filters, setFilters, setIsTaskFilterActive } = useTaskStore()

  const isUsingCustomStatuses = pulseStatusOption === PulseStatusOption.Custom

  // Fetch custom statuses to show as options for filtering
  const { data: taskStatusesData } = useGetTaskStatusesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: isUsingCustomStatuses && open && !!pulseId,
    variables: {
      pulseId: pulseId!,
    },
  })

  // Get status options based on whether using custom or default statuses
  const statusOptions = useMemo(() => {
    if (isUsingCustomStatuses && taskStatusesData?.taskStatuses) {
      return taskStatusesData.taskStatuses.map((status) => ({
        label: status.label,
        value: status.id,
      }))
    }
    return defaultStatusOptions
  }, [isUsingCustomStatuses, taskStatusesData])

  // form fields for creating new filter
  const [newField, setNewField] = useState<FilterField | ''>('')
  const [newOperator, setNewOperator] = useState<FilterOperator | ''>('')
  const [newValue, setNewValue] = useState<string>('')
  const [newStartDate, setNewStartDate] = useState<Date | null>(null)
  const [newEndDate, setNewEndDate] = useState<Date | null>(null)
  const [isAddingFilter, setIsAddingFilter] = useState(false)

  const availableFields: FilterField[] = [
    'status',
    'priority',
    'assignee',
    'dueDate',
  ]

  const handleStartAddingFilter = () => {
    setIsAddingFilter(true)
    setNewField('')
    setNewOperator('')
    setNewValue('')
    setNewStartDate(null)
    setNewEndDate(null)
  }

  const handleCancelAddingFilter = () => {
    setIsAddingFilter(false)
    setNewField('')
    setNewOperator('')
    setNewValue('')
    setNewStartDate(null)
    setNewEndDate(null)
  }

  const handleFieldChange = (event: SelectChangeEvent) => {
    setNewField(event.target.value as FilterField)
    setNewOperator('')
    setNewValue('')
    setNewStartDate(null)
    setNewEndDate(null)
  }

  const handleOperatorChange = (event: SelectChangeEvent) => {
    setNewOperator(event.target.value as FilterOperator)
    setNewValue('')
    setNewStartDate(null)
    setNewEndDate(null)
  }

  const handleValueChange = (event: SelectChangeEvent) => {
    setNewValue(event.target.value)
  }

  const handleAddFilter = () => {
    if (!newField || !newOperator) return

    const updates: Record<string, unknown> = {}

    switch (newField) {
      // include or exclude either Default or Custom status based on pulse status option
      case 'status':
        if (newOperator === 'is' && newValue) {
          if (isUsingCustomStatuses) {
            updates.taskStatusId = newValue
            updates.status = null
          } else {
            updates.status = newValue as TaskStatus
            updates.taskStatusId = null
          }
        } else if (newOperator === 'is_not' && newValue) {
          if (isUsingCustomStatuses) {
            updates.excludeTaskStatusId = newValue
            updates.excludeStatus = null
          } else {
            updates.excludeStatus = newValue as TaskStatus
            updates.excludeTaskStatusId = null
          }
        }
        break
      case 'priority':
        if (newOperator === 'is' && newValue) {
          updates.priority = newValue as TaskPriority
        } else if (newOperator === 'is_not' && newValue) {
          updates.excludePriority = newValue as TaskPriority
        }
        break
      case 'assignee':
        if (newOperator === 'is' && newValue) {
          updates.assigneeId = newValue
        } else if (newOperator === 'is_not' && newValue) {
          updates.excludeAssigneeId = newValue
        }
        break
      case 'dueDate':
        if (newOperator === 'is' && newStartDate) {
          updates.date = newStartDate.toISOString().split('T')[0]
        } else if (newOperator === 'within' && newStartDate && newEndDate) {
          updates.dateRange = {
            from: newStartDate.toISOString().split('T')[0],
            to: newEndDate.toISOString().split('T')[0],
          }
        }
        break
    }

    setFilters(updates)
    setIsTaskFilterActive(true)
    handleCancelAddingFilter()
  }

  const handleRemoveFilter = (field: FilterField, isExclude = false) => {
    const updates: Record<string, unknown> = {}

    switch (field) {
      case 'status':
        if (isExclude) {
          updates.excludeStatus = null
          updates.excludeTaskStatusId = null
        } else {
          updates.status = null
          updates.taskStatusId = null
        }
        break
      case 'priority':
        if (isExclude) {
          updates.excludePriority = null
        } else {
          updates.priority = null
        }
        break
      case 'assignee':
        if (isExclude) {
          updates.excludeAssigneeId = null
        } else {
          updates.assigneeId = null
        }
        break
      case 'dueDate':
        updates.date = null
        updates.dateRange = null
        break
    }

    setFilters(updates)
    setIsTaskFilterActive(false)
  }

  const handleClearAll = () => {
    setFilters({
      assigneeId: null,
      date: null,
      dateRange: null,
      excludeAssigneeId: null,
      excludePriority: null,
      excludeStatus: null,
      excludeTaskStatusId: null,
      priority: null,
      status: null,
      taskStatusId: null,
    })
    setIsTaskFilterActive(false)
    handleCancelAddingFilter()
  }

  const handleClose = () => {
    handleCancelAddingFilter()
    onClose()
  }

  // get which filter is assigned based on the field
  const getFilterLabel = (field: FilterField, isExclude = false): string => {
    switch (field) {
      case 'status':
        if (isExclude) {
          // checks if label is a custom status or default status
          if (filters.excludeTaskStatusId) {
            return (
              statusOptions.find((o) => o.value === filters.excludeTaskStatusId)
                ?.label || ''
            )
          }
          return (
            defaultStatusOptions.find((o) => o.value === filters.excludeStatus)
              ?.label || ''
          )
        }
        if (filters.taskStatusId) {
          return (
            statusOptions.find((o) => o.value === filters.taskStatusId)
              ?.label || ''
          )
        }
        return (
          defaultStatusOptions.find((o) => o.value === filters.status)?.label ||
          ''
        )
      case 'priority':
        if (isExclude) {
          return (
            priorityOptions.find((o) => o.value === filters.excludePriority)
              ?.label || ''
          )
        }
        return (
          priorityOptions.find((o) => o.value === filters.priority)?.label || ''
        )
      case 'assignee':
        if (isExclude) {
          return (
            pulseMembers.find((m) => m.user.id === filters.excludeAssigneeId)
              ?.user.name || ''
          )
        }
        return (
          pulseMembers.find((m) => m.user.id === filters.assigneeId)?.user
            .name || ''
        )
      case 'dueDate':
        if (filters.date) return filters.date
        if (filters.dateRange)
          return `${filters.dateRange.from} - ${filters.dateRange.to}`
        return ''
    }
  }

  const getValueOptions = () => {
    switch (newField) {
      case 'status':
        return statusOptions
      case 'priority':
        return priorityOptions
      case 'assignee':
        return pulseMembers.map((member) => ({
          label: member.user.name,
          value: member.user.id,
        }))
      default:
        return []
    }
  }

  const showDatePicker = newField === 'dueDate' && newOperator !== ''
  const showDateRange = newField === 'dueDate' && newOperator === 'within'
  const showValueDropdown =
    newField !== '' && newField !== 'dueDate' && newOperator !== ''

  const activeFilters: {
    field: FilterField
    label: string
    isExclude?: boolean
  }[] = []
  if (filters.status || filters.taskStatusId)
    activeFilters.push({ field: 'status', label: getFilterLabel('status') })
  if (filters.excludeStatus || filters.excludeTaskStatusId)
    activeFilters.push({
      field: 'status',
      isExclude: true,
      label: getFilterLabel('status', true),
    })
  if (filters.priority)
    activeFilters.push({ field: 'priority', label: getFilterLabel('priority') })
  if (filters.excludePriority)
    activeFilters.push({
      field: 'priority',
      isExclude: true,
      label: getFilterLabel('priority', true),
    })
  if (filters.assigneeId)
    activeFilters.push({ field: 'assignee', label: getFilterLabel('assignee') })
  if (filters.excludeAssigneeId)
    activeFilters.push({
      field: 'assignee',
      isExclude: true,
      label: getFilterLabel('assignee', true),
    })
  if (filters.date || filters.dateRange)
    activeFilters.push({ field: 'dueDate', label: getFilterLabel('dueDate') })

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{
        horizontal: 'left',
        vertical: 'top',
      }}
      onClose={handleClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            marginLeft: -1,
            minWidth: '360px',
            padding: 2,
          },
        },
      }}
      transformOrigin={{
        horizontal: 'right',
        vertical: 'top',
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Typography fontWeight="bold" sx={{ fontSize: '16px' }}>
          Filters
        </Typography>

        <Divider />

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Stack spacing={1}>
            <Typography
              fontSize="12px"
              fontWeight="medium"
              sx={{ color: 'text.secondary' }}
            >
              Active Filters
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {activeFilters.map(({ field, label, isExclude }, index) => (
                <Chip
                  key={`${field}-${isExclude ? 'exclude' : 'include'}-${index}`}
                  label={
                    <Stack alignItems="center" direction="row" spacing={0.5}>
                      <Typography fontSize="12px">
                        {fieldLabels[field]} {isExclude ? 'is not' : 'is'}:
                      </Typography>
                      <Typography fontSize="12px" fontWeight="bold">
                        {label}
                      </Typography>
                    </Stack>
                  }
                  onDelete={() => handleRemoveFilter(field, isExclude)}
                  size="small"
                  sx={{
                    '& .MuiChip-deleteIcon': {
                      ':hover': {
                        color: 'grey.300',
                      },
                      color: 'white',
                    },
                    backgroundColor: 'primary.main',
                    color: 'white',
                  }}
                />
              ))}
            </Stack>
          </Stack>
        )}

        {/* Add New Filter Section */}
        {isAddingFilter ? (
          <Stack spacing={2}>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
            >
              <Typography
                fontSize="12px"
                fontWeight="medium"
                sx={{ color: 'text.secondary' }}
              >
                Add Filter
              </Typography>
              <IconButton onClick={handleCancelAddingFilter} size="small">
                <Close fontSize="small" />
              </IconButton>
            </Stack>

            {/* Field Dropdown */}
            <FormControl fullWidth={true} size="small">
              <InputLabel id="new-filter-field-label">Field</InputLabel>
              <Select
                label="Field"
                labelId="new-filter-field-label"
                onChange={handleFieldChange}
                value={newField}
              >
                {availableFields.map((field) => (
                  <MenuItem key={field} value={field}>
                    {fieldLabels[field]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Operator Dropdown */}
            {newField && (
              <FormControl fullWidth={true} size="small">
                <InputLabel id="new-filter-operator-label">Operator</InputLabel>
                <Select
                  label="Operator"
                  labelId="new-filter-operator-label"
                  onChange={handleOperatorChange}
                  value={newOperator}
                >
                  {getOperatorOptions(newField).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Value Dropdown */}
            {showValueDropdown && (
              <FormControl fullWidth={true} size="small">
                <InputLabel id="new-filter-value-label">Value</InputLabel>
                <Select
                  label="Value"
                  labelId="new-filter-value-label"
                  onChange={handleValueChange}
                  value={newValue}
                >
                  {getValueOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Date Picker */}
            {showDatePicker && !showDateRange && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Value"
                  onChange={(date) => setNewStartDate(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                  value={newStartDate}
                />
              </LocalizationProvider>
            )}

            {/* Date Range Pickers */}
            {showDateRange && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack direction="row" spacing={1}>
                  <DatePicker
                    label="From"
                    onChange={(date) => setNewStartDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                    value={newStartDate}
                  />
                  <DatePicker
                    label="To"
                    onChange={(date) => setNewEndDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                    value={newEndDate}
                  />
                </Stack>
              </LocalizationProvider>
            )}

            <Button
              disabled={
                !newField ||
                !newOperator ||
                (showValueDropdown && !newValue) ||
                (showDatePicker && !showDateRange && !newStartDate) ||
                (showDateRange && (!newStartDate || !newEndDate))
              }
              fullWidth={true}
              onClick={handleAddFilter}
              sx={{ textTransform: 'none' }}
              variant="contained"
            >
              Add Filter
            </Button>
          </Stack>
        ) : (
          <Button
            fullWidth={true}
            onClick={handleStartAddingFilter}
            startIcon={<Add />}
            sx={{ textTransform: 'none' }}
            variant="outlined"
          >
            Add Filter
          </Button>
        )}

        {activeFilters.length > 0 && <Divider />}

        {/* Action Buttons */}
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          {activeFilters.length > 0 && (
            <Button
              color="error"
              onClick={handleClearAll}
              sx={{ textTransform: 'none' }}
              variant="text"
            >
              Clear all
            </Button>
          )}
          <Button
            onClick={handleClose}
            sx={{ marginLeft: 'auto', textTransform: 'none' }}
            variant="text"
          >
            Done
          </Button>
        </Stack>
      </Stack>
    </Popover>
  )
}
