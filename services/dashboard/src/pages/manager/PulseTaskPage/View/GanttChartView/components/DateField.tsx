import { CalendarToday } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'
import { TaskType } from '@zunou-graphql/core/graphql'
import { memo, useMemo } from 'react'

interface DateFieldProps {
  value: string
  taskType: TaskType
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
}

const ICON_SIZE_SMALL = 14

const calendarHoverStyles = {
  '& .calendar-icon': {
    opacity: 1,
  },
  textDecoration: 'underline',
}

const hiddenIconStyles = {
  flexShrink: 0,
  opacity: 0,
  transition: 'opacity 0.2s',
}

const typographySx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
}

const iconSx = { fontSize: ICON_SIZE_SMALL, ...hiddenIconStyles }

export const DateField = memo(
  ({ value, taskType, disabled = false, onClick }: DateFieldProps) => {
    const isEditable = taskType === TaskType.Task && !disabled

    const containerSx = useMemo(
      () => ({
        '&:hover': isEditable ? calendarHoverStyles : {},
        alignItems: 'center',
        cursor: isEditable ? 'pointer' : 'default',
        display: 'flex',
        gap: 0.5,
        opacity: disabled ? 0.5 : 1,
      }),
      [isEditable, disabled],
    )

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      if (disabled) return
      onClick?.(e)
    }

    return (
      <Box onClick={isEditable ? handleClick : undefined} sx={containerSx}>
        <Typography sx={typographySx} variant="caption">
          {value}
        </Typography>
        {taskType === TaskType.Task && (
          <CalendarToday className="calendar-icon" sx={iconSx} />
        )}
      </Box>
    )
  },
)
