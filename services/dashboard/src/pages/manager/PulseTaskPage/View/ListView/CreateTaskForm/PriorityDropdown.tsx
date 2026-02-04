import { FlagOutlined } from '@mui/icons-material'
import {
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { TaskPriority } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { toTitleCase } from '~/utils/toTitleCase'

import { TaskPriorityRank } from '../../../components/Toolbar/hooks'

export const PriorityColorMap: Record<TaskPriority, string> = {
  [TaskPriority.High]: theme.palette.common.dandelion,
  [TaskPriority.Low]: theme.palette.common.green,
  [TaskPriority.Medium]: theme.palette.text.primary,
  [TaskPriority.Urgent]: theme.palette.common.cherry,
}

export const taskPriorityOptions = Object.values(TaskPriority)
  .map((value) => ({
    color: PriorityColorMap[value],
    label: toTitleCase(value),
    value,
  }))
  .sort((a, b) => TaskPriorityRank[a.value] - TaskPriorityRank[b.value])

interface PriorityDropdownProps {
  onSelect: (priority: TaskPriority | null) => void
  selectedPriority?: TaskPriority | null
  disabled?: boolean
}

export const PriorityDropdown = ({
  onSelect,
  selectedPriority,
  disabled = false,
}: PriorityDropdownProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseLeave = () => {
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

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (priority: TaskPriority) => {
    onSelect(priority)
    handleClose()
  }

  const handleClear = () => {
    onSelect(null)
    handleClose()
  }

  return (
    <>
      <Button
        color="inherit"
        disabled={disabled}
        onClick={handleClick}
        startIcon={
          <FlagOutlined
            fontSize="small"
            sx={{
              color: disabled
                ? 'grey.300'
                : selectedPriority
                  ? PriorityColorMap[selectedPriority]
                  : '',
            }}
          />
        }
        sx={{
          backgroundColor: '#fafafa',
          borderColor: 'divider',
          borderRadius: 2,
        }}
        variant="outlined"
      >
        <Typography
          color={
            disabled
              ? 'grey.300'
              : selectedPriority
                ? PriorityColorMap[selectedPriority]
                : ''
          }
        >
          {selectedPriority
            ? toTitleCase(selectedPriority)
            : t('priority', { ns: 'tasks' })}
        </Typography>
      </Button>

      <Menu
        MenuListProps={{
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }}
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            style: {
              minWidth: 160,
            },
          },
        }}
      >
        {taskPriorityOptions.map(({ label, value }, index) => (
          <MenuItem
            key={index}
            onClick={() => handleSelect(value)}
            sx={{ color: PriorityColorMap[value] }}
          >
            <ListItemIcon>
              <FlagOutlined sx={{ color: PriorityColorMap[value] }} />
            </ListItemIcon>
            <Typography>{label}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleClear}>
          <ListItemIcon>
            <FlagOutlined color="disabled" />
          </ListItemIcon>
          <Typography color="text.secondary">{t('clear')}</Typography>
        </MenuItem>
      </Menu>
    </>
  )
}
