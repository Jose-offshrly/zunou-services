import { CheckCircle } from '@mui/icons-material'
import { Menu, MenuItem, Stack, SvgIcon, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { TaskStatus } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import React from 'react'

import { getPulseTaskStatusColor } from '~/utils/getPulseTaskColor'
import { withStopPropagation } from '~/utils/withStopPropagation'

import {
  TaskStatusIconMap,
  taskStatusOptions,
} from '../CreateTaskForm/StatusDropdown'

interface TaskStatusSelectorProps {
  onChange?: (value: TaskStatus) => void
  status: TaskStatus
  isViewMode?: boolean
}

export const TaskStatusSelector = ({
  onChange,
  status,
  isViewMode = false,
}: TaskStatusSelectorProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isViewMode) return // ✅ block if view mode
    setAnchorEl(event.currentTarget)
  }

  const handleSelect = (event: React.MouseEvent, value: TaskStatus) => {
    event.stopPropagation()
    onChange?.(value)
    handleClose()
  }

  return (
    <Box>
      <IconButton
        onClick={withStopPropagation(handleClick)}
        sx={{
          // ✅ no pointer when view mode
          '&:hover': {
            background: isViewMode ? 'none' : undefined, // ✅ no hover effect
          },

          alignSelf: 'center',
          cursor: isViewMode ? 'default' : 'pointer',
        }}
      >
        <SvgIcon
          component={TaskStatusIconMap[status]}
          fontSize="small"
          sx={{
            color: getPulseTaskStatusColor(status),
          }}
        />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        onClose={withStopPropagation(handleClose)}
        open={!isViewMode && open} // ✅ block opening if view mode
        slotProps={{
          paper: {
            style: {
              border: `1px solid ${theme.palette.grey['200']}`,
              boxShadow: 'none',
              marginTop: -4,
              minWidth: 200,
            },
          },
        }}
      >
        {taskStatusOptions.map(({ value, label, icon }, index) => (
          <MenuItem key={index} onClick={(event) => handleSelect(event, value)}>
            <Stack direction="row" flex={1} justifyContent="space-between">
              <Stack alignItems="center" direction="row" spacing={1}>
                <SvgIcon
                  component={icon}
                  fontSize="small"
                  sx={{ color: getPulseTaskStatusColor(value) }}
                />
                <Typography>{label}</Typography>
              </Stack>
              {value === status && (
                <CheckCircle color="primary" fontSize="small" />
              )}
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}
