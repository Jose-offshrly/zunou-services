import { BoltOutlined, CloseOutlined } from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Task } from '@zunou-graphql/core/graphql'
import { useState } from 'react'

interface DependenciesFieldProps {
  disabled?: boolean
  dependencies: string[]
  availableTasks: Task[]
  currentTaskId?: string
  onRemoveDependency?: (taskId: string) => void
  onAddDependency?: (taskId: string) => void
}

export const DependenciesField = ({
  disabled,
  dependencies,
  availableTasks,
  currentTaskId,
  onRemoveDependency,
  onAddDependency,
}: DependenciesFieldProps) => {
  const [inputValue, setInputValue] = useState('')

  // Filter out the current task and already selected dependencies
  const availableOptions = availableTasks.filter(
    (task) => task.id !== currentTaskId && !dependencies.includes(task.id),
  )

  const selectedTasks = availableTasks.filter((task) =>
    dependencies.includes(task.id),
  )

  const handleTaskSelect = (task: Task | null) => {
    if (task && onAddDependency) {
      onAddDependency(task.id)
      setInputValue('')
    }
  }

  return (
    <Box
      sx={{
        alignItems: 'flex-start',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{ width: '100%' }}
      >
        <Stack alignItems="center" direction="row" spacing={1}>
          <BoltOutlined sx={{ color: 'text.secondary' }} />
          <Typography color="text.secondary" variant="body2">
            Dependencies
          </Typography>
        </Stack>
      </Stack>
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
        sx={{ mt: 1, width: '100%' }}
      >
        {selectedTasks.map((task) => (
          <Box
            key={task.id}
            sx={{
              alignItems: 'center',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '4px',
              display: 'flex',
              gap: 0.5,
              px: 1,
              py: 0.5,
            }}
          >
            <Stack direction="row" spacing={0.5}>
              <Typography fontWeight="fontWeightMedium" variant="caption">
                {task.task_number && `${task.task_number}: `}
              </Typography>
              <Typography variant="caption">{task.title}</Typography>
            </Stack>
            {onRemoveDependency && (
              <IconButton
                disabled={disabled}
                onClick={() => onRemoveDependency(task.id)}
                size="small"
                sx={{ p: 0 }}
              >
                <CloseOutlined sx={{ fontSize: '14px' }} />
              </IconButton>
            )}
          </Box>
        ))}
        <Autocomplete
          autoFocus={true}
          disabled={disabled}
          getOptionLabel={(option) =>
            `${option.task_number && `${option.task_number}: `}${option.title}`
          }
          inputValue={inputValue}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(_, value) => {
            handleTaskSelect(value)
          }}
          onInputChange={(_, newInputValue) => {
            setInputValue(newInputValue)
          }}
          options={availableOptions}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Add a dependency"
              size="small"
              variant="outlined"
            />
          )}
          // make the task number in the option bold
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack direction="row" spacing={0.5}>
                {option.task_number && (
                  <Typography fontWeight="fontWeightBold" variant="body2">
                    {option.task_number}:
                  </Typography>
                )}
                <Typography variant="body2">{option.title}</Typography>
              </Stack>
            </li>
          )}
          size="small"
          sx={{
            border: '0.5px solid',
            borderColor: 'divider',
            borderRadius: '4px',
            minWidth: '100%',
          }}
          value={null}
        />
      </Stack>
    </Box>
  )
}
