import {
  AccessTimeOutlined,
  CheckCircle,
  Circle,
  CircleOutlined,
  KeyboardArrowDownOutlined,
  SvgIconComponent,
  Tonality,
} from '@mui/icons-material'
import { alpha, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material'
import { TaskStatus, TaskStatusType } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { toTitleCase } from '~/utils/toTitleCase'

import { TaskStatusRank } from '../../../components/Toolbar/hooks'

export const TaskStatusIconMap: Record<TaskStatus, SvgIconComponent> = {
  [TaskStatus.Completed]: CheckCircle,
  [TaskStatus.Inprogress]: Tonality,
  [TaskStatus.Overdue]: AccessTimeOutlined,
  [TaskStatus.Todo]: CircleOutlined,
}

export const TaskStatusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.Completed]: theme.palette.common.green,
  [TaskStatus.Inprogress]: theme.palette.common.dandelion,
  [TaskStatus.Todo]: theme.palette.text.primary,
  [TaskStatus.Overdue]: theme.palette.error.main,
}

export const TaskStatusLabelMap: Record<TaskStatus, string> = {
  [TaskStatus.Completed]: 'COMPLETED',
  [TaskStatus.Inprogress]: 'IN PROGRESS',
  [TaskStatus.Todo]: 'TO DO',
  [TaskStatus.Overdue]: 'OVERDUE',
}

export const taskStatusOptions = Object.values(TaskStatus)
  .filter((value) => value !== TaskStatus.Overdue)
  .map((value) => ({
    color: TaskStatusColorMap[value],
    icon: TaskStatusIconMap[value],
    label: toTitleCase(TaskStatusLabelMap[value]),
    value,
  }))
  .sort((a, b) => TaskStatusRank[a.value] - TaskStatusRank[b.value])

interface StatusDropdownProps {
  onSelect: (status: TaskStatus | string) => void
  selectedStatus?: TaskStatus | string | null
  disabled?: boolean
  customStatuses?: TaskStatusType[]
  badgeOnly?: boolean
}

export const StatusDropdown = ({
  onSelect,
  selectedStatus,
  disabled = false,
  customStatuses,
  badgeOnly = false,
}: StatusDropdownProps) => {
  const { t } = useTranslation('tasks')

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const [optimisticStatus, setOptimisticStatus] = useState<
    TaskStatus | string | null | undefined
  >(null)

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

  // Reset optimistic status when prop changes (after backend update)
  useEffect(() => {
    if (selectedStatus !== optimisticStatus) {
      setOptimisticStatus(null)
    }
  }, [selectedStatus])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (status: TaskStatus | string) => {
    setOptimisticStatus(status)
    handleClose()

    onSelect(status)
  }

  // Use custom statuses if provided, otherwise use default enum statuses
  const statusOptions = useMemo(() => {
    if (customStatuses && customStatuses.length > 0) {
      return [...customStatuses]
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((status) => ({
          color: status.color || theme.palette.text.primary,
          id: status.id,
          label: status.label,
          value: status.id,
        }))
    }
    return taskStatusOptions
  }, [customStatuses])

  // Get selected status display info
  const selectedStatusInfo = useMemo(() => {
    const statusToDisplay =
      optimisticStatus !== null ? optimisticStatus : selectedStatus

    if (!statusToDisplay) return null

    if (customStatuses && customStatuses.length > 0) {
      const customStatus = customStatuses.find((s) => s.id === statusToDisplay)
      if (customStatus) {
        return {
          color: customStatus.color || theme.palette.text.primary,
          label: customStatus.label,
        }
      }
    }

    // Fallback to enum status
    if (statusToDisplay in TaskStatusColorMap) {
      return {
        color: TaskStatusColorMap[statusToDisplay as TaskStatus],
        label: toTitleCase(TaskStatusLabelMap[statusToDisplay as TaskStatus]),
      }
    }

    return null
  }, [selectedStatus, customStatuses, optimisticStatus])

  return (
    <>
      <Button
        color="inherit"
        disabled={disabled}
        endIcon={
          !badgeOnly ? <KeyboardArrowDownOutlined fontSize="small" /> : null
        }
        onClick={handleClick}
        size="small"
        startIcon={
          <Circle
            fontSize="small"
            sx={{
              color: selectedStatusInfo?.color,
            }}
          />
        }
        sx={{
          '&.MuiButton-contained': {
            '&.Mui-disabled': {
              bgcolor: 'grey.100',
            },
          },
          bgcolor:
            selectedStatusInfo && !badgeOnly
              ? alpha(selectedStatusInfo.color, 0.2)
              : 'transparent',
          borderRadius: 2,
        }}
        variant="contained"
      >
        {!badgeOnly && (
          <Typography
            color={disabled ? 'grey.300' : selectedStatusInfo?.color || ''}
            noWrap={true}
          >
            {selectedStatusInfo?.label || t('status')}
          </Typography>
        )}
      </Button>

      <Menu
        MenuListProps={{
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }}
        anchorEl={anchorEl}
        onClick={(e) => e.stopPropagation()}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            style: {
              minWidth: 1,
            },
          },
        }}
      >
        {statusOptions.map((option) => {
          const isCustomStatus = 'id' in option
          const color = isCustomStatus
            ? option.color
            : TaskStatusColorMap[option.value]
          const label = option.label
          const value = isCustomStatus ? option.value : option.value
          const key = isCustomStatus ? option.id : option.value

          return (
            <MenuItem
              key={key}
              onClick={() => handleSelect(value)}
              sx={{ color }}
            >
              <ListItemIcon sx={{ justifyContent: 'center' }}>
                <Circle sx={{ color, height: 12, width: 12 }} />
              </ListItemIcon>
              <Typography>{label}</Typography>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
