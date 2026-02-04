import { Add, Close, Delete } from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useState } from 'react'

import { FilterCondition, TimelineItem } from '../../types/types'

interface FilterBuilderProps {
  filters: FilterCondition[]
  onFiltersChange: (filters: FilterCondition[]) => void
  items: TimelineItem[]
}

const fieldOptions: {
  value: keyof TimelineItem
  label: string
  type: 'text' | 'date' | 'number' | 'person' | 'status' | 'phase'
}[] = [
  { label: 'Name', type: 'text', value: 'name' },
  { label: 'Status', type: 'status', value: 'status' },
  { label: 'Phase', type: 'phase', value: 'phase' },
  { label: 'Owner', type: 'person', value: 'owner' },
  { label: 'Start Date', type: 'date', value: 'startDate' },
  { label: 'End Date', type: 'date', value: 'endDate' },
  { label: 'Progress', type: 'number', value: 'progress' },
]

const operatorOptions: {
  value: FilterCondition['operator']
  label: string
  applicableTypes: string[]
}[] = [
  { applicableTypes: ['text', 'person'], label: 'Contains', value: 'contains' },
  {
    applicableTypes: ['text', 'person', 'status', 'phase'],
    label: 'Equals',
    value: 'equals',
  },
  {
    applicableTypes: ['text', 'person', 'status', 'phase'],
    label: 'Not Equals',
    value: 'not-equals',
  },
  {
    applicableTypes: ['date', 'number'],
    label: 'Greater Than',
    value: 'greater-than',
  },
  {
    applicableTypes: ['date', 'number'],
    label: 'Less Than',
    value: 'less-than',
  },
  { applicableTypes: ['date', 'number'], label: 'Between', value: 'between' },
  {
    applicableTypes: ['text', 'date', 'number', 'person', 'status', 'phase'],
    label: 'Is Empty',
    value: 'is-empty',
  },
  {
    applicableTypes: ['text', 'date', 'number', 'person', 'status', 'phase'],
    label: 'Is Not Empty',
    value: 'is-not-empty',
  },
]

const statusOptions = [
  'not-started',
  'in-progress',
  'completed',
  'blocked',
  'on-hold',
]

const phaseOptions = [
  'planning',
  'design',
  'development',
  'testing',
  'deployment',
  'maintenance',
]

export const FilterBuilder = ({
  filters,
  onFiltersChange,
  items: _items,
}: FilterBuilderProps) => {
  const [newFilter, setNewFilter] = useState<Partial<FilterCondition> | null>(
    null,
  )

  const handleAddFilter = () => {
    if (!newFilter?.field || !newFilter?.operator) return

    const filter: FilterCondition = {
      field: newFilter.field,
      id: `${Date.now()}-${Math.random()}`,
      operator: newFilter.operator,
      secondValue: newFilter.secondValue,
      value: newFilter.value ?? '',
    }

    onFiltersChange([...filters, filter])
    setNewFilter(null)
  }

  const handleRemoveFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id))
  }

  const handleUpdateFilter = (
    id: string,
    updates: Partial<FilterCondition>,
  ) => {
    onFiltersChange(
      filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    )
  }

  const getAvailableOperators = (fieldType: string) => {
    return operatorOptions.filter((op) =>
      op.applicableTypes.includes(fieldType),
    )
  }

  const getFieldType = (field: keyof TimelineItem) => {
    return fieldOptions.find((f) => f.value === field)?.type || 'text'
  }

  const renderFilterValue = (filter: FilterCondition) => {
    const fieldType = getFieldType(filter.field)

    if (filter.operator === 'is-empty' || filter.operator === 'is-not-empty') {
      return null
    }

    if (filter.operator === 'between') {
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Stack direction="row" gap={1} sx={{ flex: 1 }}>
            <DatePicker
              label="From"
              onChange={(date) =>
                handleUpdateFilter(filter.id, { value: date })
              }
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { flex: 1 },
                },
              }}
              value={(filter.value as Date) || null}
            />
            <DatePicker
              label="To"
              onChange={(date) =>
                handleUpdateFilter(filter.id, { secondValue: date })
              }
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { flex: 1 },
                },
              }}
              value={(filter.secondValue as Date) || null}
            />
          </Stack>
        </LocalizationProvider>
      )
    }

    switch (fieldType) {
      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              onChange={(date) =>
                handleUpdateFilter(filter.id, { value: date })
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
              value={(filter.value as Date) || null}
            />
          </LocalizationProvider>
        )

      case 'status':
        return (
          <FormControl fullWidth={true} size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              onChange={(e) =>
                handleUpdateFilter(filter.id, { value: e.target.value })
              }
              value={filter.value || ''}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('-', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )

      case 'phase':
        return (
          <FormControl fullWidth={true} size="small">
            <InputLabel>Phase</InputLabel>
            <Select
              label="Phase"
              onChange={(e) =>
                handleUpdateFilter(filter.id, { value: e.target.value })
              }
              value={filter.value || ''}
            >
              {phaseOptions.map((phase) => (
                <MenuItem key={phase} value={phase}>
                  {phase}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )

      case 'number':
        return (
          <TextField
            fullWidth={true}
            label="Value"
            onChange={(e) =>
              handleUpdateFilter(filter.id, {
                value: parseFloat(e.target.value) || 0,
              })
            }
            size="small"
            type="number"
            value={filter.value || ''}
          />
        )

      default:
        return (
          <TextField
            fullWidth={true}
            label="Value"
            onChange={(e) =>
              handleUpdateFilter(filter.id, { value: e.target.value })
            }
            size="small"
            value={filter.value || ''}
          />
        )
    }
  }

  return (
    <Stack spacing={2}>
      {/* Active Filters */}
      {filters.length > 0 && (
        <Box>
          <Typography color="text.secondary" sx={{ mb: 1 }} variant="caption">
            Active Filters
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {filters.map((filter) => {
              const fieldLabel =
                fieldOptions.find((f) => f.value === filter.field)?.label ||
                filter.field
              const operatorLabel =
                operatorOptions.find((op) => op.value === filter.operator)
                  ?.label || filter.operator

              return (
                <Chip
                  deleteIcon={<Delete fontSize="small" />}
                  key={filter.id}
                  label={`${fieldLabel} ${operatorLabel} ${
                    filter.value ? String(filter.value) : ''
                  }`}
                  onDelete={() => handleRemoveFilter(filter.id)}
                  size="small"
                />
              )
            })}
          </Stack>
        </Box>
      )}

      {/* Existing Filters */}
      {filters.map((filter) => {
        const fieldType = getFieldType(filter.field)
        const availableOperators = getAvailableOperators(fieldType)

        return (
          <Box
            key={filter.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              position: 'relative',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" gap={1}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Field</InputLabel>
                  <Select
                    label="Field"
                    onChange={(e) => {
                      const newField = e.target.value as keyof TimelineItem
                      const newType = getFieldType(newField)
                      const newOps = getAvailableOperators(newType)
                      handleUpdateFilter(filter.id, {
                        field: newField,
                        operator: newOps[0]?.value || 'equals',
                        secondValue: undefined,
                        value: undefined,
                      })
                    }}
                    value={filter.field}
                  >
                    {fieldOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <IconButton
                  onClick={() => handleRemoveFilter(filter.id)}
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Stack>

              <FormControl fullWidth={true} size="small">
                <InputLabel>Operator</InputLabel>
                <Select
                  label="Operator"
                  onChange={(e) =>
                    handleUpdateFilter(filter.id, {
                      operator: e.target.value as FilterCondition['operator'],
                      secondValue: undefined,
                      value: undefined,
                    })
                  }
                  value={filter.operator}
                >
                  {availableOperators.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {filter.operator !== 'is-empty' &&
                filter.operator !== 'is-not-empty' && (
                  <Box>{renderFilterValue(filter)}</Box>
                )}
            </Stack>
          </Box>
        )
      })}

      {/* Add New Filter */}
      {newFilter ? (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            borderStyle: 'dashed',
            p: 2,
          }}
        >
          <Stack spacing={2}>
            <FormControl fullWidth={true} size="small">
              <InputLabel>Field</InputLabel>
              <Select
                label="Field"
                onChange={(e) => {
                  const newField = e.target.value as keyof TimelineItem
                  const newType = getFieldType(newField)
                  const newOps = getAvailableOperators(newType)
                  setNewFilter({
                    field: newField,
                    operator: newOps[0]?.value || 'equals',
                  })
                }}
                value={newFilter.field || ''}
              >
                {fieldOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {newFilter.field && (
              <FormControl fullWidth={true} size="small">
                <InputLabel>Operator</InputLabel>
                <Select
                  label="Operator"
                  onChange={(e) =>
                    setNewFilter({
                      ...newFilter,
                      operator: e.target.value as FilterCondition['operator'],
                    })
                  }
                  value={newFilter.operator || ''}
                >
                  {getAvailableOperators(getFieldType(newFilter.field)).map(
                    (option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            )}

            {newFilter.field &&
              newFilter.operator &&
              newFilter.operator !== 'is-empty' &&
              newFilter.operator !== 'is-not-empty' && (
                <Box>
                  {newFilter.operator === 'between' ? (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Stack spacing={1}>
                        <DatePicker
                          label="From"
                          onChange={(date) =>
                            setNewFilter({ ...newFilter, value: date })
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                            },
                          }}
                          value={(newFilter.value as Date) || null}
                        />
                        <DatePicker
                          label="To"
                          onChange={(date) =>
                            setNewFilter({ ...newFilter, secondValue: date })
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: 'small',
                            },
                          }}
                          value={(newFilter.secondValue as Date) || null}
                        />
                      </Stack>
                    </LocalizationProvider>
                  ) : getFieldType(newFilter.field) === 'date' ? (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Date"
                        onChange={(date) =>
                          setNewFilter({ ...newFilter, value: date })
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                          },
                        }}
                        value={(newFilter.value as Date) || null}
                      />
                    </LocalizationProvider>
                  ) : getFieldType(newFilter.field) === 'status' ? (
                    <FormControl fullWidth={true} size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        label="Status"
                        onChange={(e) =>
                          setNewFilter({ ...newFilter, value: e.target.value })
                        }
                        value={newFilter.value || ''}
                      >
                        {statusOptions.map((status) => (
                          <MenuItem key={status} value={status}>
                            {status.replace('-', ' ')}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : getFieldType(newFilter.field) === 'phase' ? (
                    <FormControl fullWidth={true} size="small">
                      <InputLabel>Phase</InputLabel>
                      <Select
                        label="Phase"
                        onChange={(e) =>
                          setNewFilter({ ...newFilter, value: e.target.value })
                        }
                        value={newFilter.value || ''}
                      >
                        {phaseOptions.map((phase) => (
                          <MenuItem key={phase} value={phase}>
                            {phase}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : getFieldType(newFilter.field) === 'number' ? (
                    <TextField
                      fullWidth={true}
                      label="Value"
                      onChange={(e) =>
                        setNewFilter({
                          ...newFilter,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      size="small"
                      type="number"
                      value={newFilter.value || ''}
                    />
                  ) : (
                    <TextField
                      fullWidth={true}
                      label="Value"
                      onChange={(e) =>
                        setNewFilter({ ...newFilter, value: e.target.value })
                      }
                      size="small"
                      value={newFilter.value || ''}
                    />
                  )}
                </Box>
              )}

            <Stack direction="row" gap={1}>
              <Button
                disabled={
                  !newFilter.field ||
                  !newFilter.operator ||
                  (newFilter.operator !== 'is-empty' &&
                    newFilter.operator !== 'is-not-empty' &&
                    !newFilter.value)
                }
                onClick={handleAddFilter}
                size="small"
                variant="contained"
              >
                Add Filter
              </Button>
              <Button
                onClick={() => setNewFilter(null)}
                size="small"
                variant="outlined"
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        <Button
          onClick={() =>
            setNewFilter({
              field: 'name',
              operator: 'contains',
            })
          }
          size="small"
          startIcon={<Add />}
          variant="outlined"
        >
          Add Filter
        </Button>
      )}
    </Stack>
  )
}
