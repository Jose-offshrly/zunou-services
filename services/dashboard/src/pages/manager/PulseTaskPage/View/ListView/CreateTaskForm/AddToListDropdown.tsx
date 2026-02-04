import {
  CheckCircle,
  PlaylistAddCheckOutlined,
  Search,
} from '@mui/icons-material'
import {
  Divider,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Typography,
} from '@mui/material'
import { Stack } from '@mui/system'
import { TaskType } from '@zunou-graphql/core/graphql'
import { useGetTasksQuery } from '@zunou-queries/core/hooks/useGetTasksQuery'
import { Button } from '@zunou-react/components/form'
import type { KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'

interface AddToListDropdownProps {
  onSelect: (parentId: string | null) => void
  selectedParentId?: string | null
  disabled?: boolean
  entityId?: string
}

export const AddToListDropdown = ({
  onSelect,
  selectedParentId,
  disabled = false,
  entityId,
}: AddToListDropdownProps) => {
  const { t } = useTranslation('tasks')
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data: tasksData } = useGetTasksQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      entityId: entityId ?? pulseId,
      organizationId,
    },
  })
  const pulseTasks = tasksData?.tasks ?? []

  const handleMouseLeave = () => {
    if (searchTerm.trim() !== '') return

    timeoutRef.current = setTimeout(() => {
      handleClose()
    }, 500)
  }

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current!)
    timeoutRef.current = null
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const taskListsOptions = pulseTasks
    .filter((task) => task.type === TaskType.List)
    .map((taskList) => ({ label: taskList.title, value: taskList.id }))

  const selectedParent =
    taskListsOptions.find((opt) => opt.value === selectedParentId) ?? null

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setSearchTerm('')
  }

  const handleSelect = (taskListId: string) => {
    onSelect(taskListId)
    handleClose()
  }

  const handleClear = () => {
    onSelect(null)
    handleClose()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
  }

  const filteredOptions = taskListsOptions.filter(
    (option) =>
      !searchTerm ||
      option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <Button
        color="inherit"
        disabled={disabled}
        onClick={handleClick}
        startIcon={<PlaylistAddCheckOutlined fontSize="small" />}
        sx={{
          borderColor: 'divider',
          maxWidth: 200,
        }}
        variant="outlined"
      >
        <Typography
          sx={{
            maxWidth: '100%',
            overflow: 'hidden',
            textAlign: 'left',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedParent ? selectedParent.label : t('add_to_list')}
        </Typography>
      </Button>

      <Menu
        MenuListProps={{
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }}
        anchorEl={anchorEl}
        autoFocus={false}
        disableAutoFocus={true}
        disableAutoFocusItem={true}
        disableEnforceFocus={true}
        onClose={handleClose}
        onMouseDown={(e) => e.stopPropagation()}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            style: {
              maxWidth: 300,
              minWidth: 160,
            },
          },
        }}
      >
        <Stack onClick={(e) => e.stopPropagation()} p={1} spacing={1}>
          <Typography variant="caption">
            Choose where you want to {selectedParent ? 'transfer' : 'place'}{' '}
            this task
          </Typography>
          <OutlinedInput
            autoFocus={true}
            onChange={handleSearchChange}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search Task List Name"
            size="small"
            startAdornment={
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            }
            sx={{ width: '100%' }}
            value={searchTerm}
          />
        </Stack>

        {filteredOptions.map(({ label, value }, index) => (
          <MenuItem
            key={index}
            onClick={() => handleSelect(value)}
            selected={value === selectedParent?.value}
            sx={{
              gap: 2,
              minHeight: 'auto',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            <ListItemText
              primary={label}
              sx={{
                '& .MuiListItemText-primary': {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                },
              }}
            />
            {value === selectedParent?.value && (
              <ListItemIcon>
                <CheckCircle color="primary" fontSize="small" />
              </ListItemIcon>
            )}
          </MenuItem>
        ))}

        {filteredOptions.length === 0 && searchTerm && (
          <MenuItem disabled={true}>
            <Typography color="text.secondary">
              No matching lists found
            </Typography>
          </MenuItem>
        )}

        <Divider />
        <MenuItem onClick={handleClear}>
          <Typography color="text.secondary">Clear</Typography>
        </MenuItem>
      </Menu>
    </>
  )
}
