import { CalendarMonthOutlined } from '@mui/icons-material'
import { Divider, Menu, MenuItem, Typography } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CalendarDropdownProps {
  onSelect: (date: Dayjs | null) => void
  selectedDate?: string
  disabled?: boolean
  label?: string
}

export const CalendarDropdown = ({
  onSelect,
  selectedDate,
  disabled = false,
  label,
}: CalendarDropdownProps) => {
  const { t } = useTranslation(['common', 'tasks'])
  const { user } = useAuthContext()
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

  const userTimezone = user?.timezone ?? 'UTC'

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const handleDateSelect = (date: Dayjs | null) => {
    if (date) {
      onSelect(date)
      handleClose()
    }
  }

  const handleClear = () => {
    onSelect(null)
    handleClose()
  }

  // Helper function to parse the selected date and convert to user timezone
  const getCalendarValue = (): Dayjs | null => {
    if (!selectedDate) return null

    // Check if the string already contains timezone info (ISO 8601 format with Z or offset)
    const hasTimezone = /[+-]\d{2}:\d{2}|Z/.test(selectedDate)

    if (hasTimezone) {
      // If it has timezone info, parse it and convert to user timezone
      return dayjs(selectedDate).tz(userTimezone)
    } else {
      // If no timezone info, treat it as a date string and combine with current time
      return dayjs.tz(
        dayjs(selectedDate).format('YYYY-MM-DD') +
          ' ' +
          dayjs().format('HH:mm:ss'),
        userTimezone,
      )
    }
  }

  // Helper function to format the display date
  const getDisplayDate = (): string => {
    if (!selectedDate) return label || t('due_date', { ns: 'tasks' })

    const hasTimezone = /[+-]\d{2}:\d{2}|Z/.test(selectedDate)

    if (hasTimezone) {
      // If it has timezone, parse and format in user timezone
      return dayjs(selectedDate).tz(userTimezone).format('YYYY-MM-DD')
    } else {
      // Otherwise, just extract the date part
      return selectedDate.split(' ')[0]
    }
  }

  return (
    <>
      <Button
        color="inherit"
        disabled={disabled}
        onClick={handleClick}
        startIcon={<CalendarMonthOutlined fontSize="small" />}
        sx={{
          backgroundColor: '#fafafa',
          borderColor: 'divider',
          borderRadius: 2,
        }}
        variant="outlined"
      >
        <Typography>{getDisplayDate()}</Typography>
      </Button>
      <Menu
        MenuListProps={{
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            disablePast={true}
            onChange={handleDateSelect}
            sx={{ width: '320px' }}
            timezone={userTimezone}
            value={getCalendarValue()}
          />
        </LocalizationProvider>
        <Divider />
        <MenuItem onClick={handleClear} sx={{ mt: 1 }}>
          <Typography color="text.secondary">{t('clear')}</Typography>
        </MenuItem>
      </Menu>
    </>
  )
}
