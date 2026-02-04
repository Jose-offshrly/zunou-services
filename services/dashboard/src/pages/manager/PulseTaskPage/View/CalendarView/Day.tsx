import { Stack, Typography } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { format } from 'date-fns'
import dayjs, { Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useMemo, useState } from 'react'

import { TimelineItem } from '../../types/types'
import {
  formatHour,
  formatTime,
  getStatusColor,
  groupItemsByDate,
  HOUR_HEIGHT,
} from './utils'

// Extend dayjs with timezone support
dayjs.extend(utc)
dayjs.extend(timezone)

interface Props {
  selectedDay: Date
  items: TimelineItem[]
  selectedItems: string[]
  onItemClick: (item: TimelineItem, e: React.MouseEvent) => void
  onDayChange: (day: Date) => void
}

export default function Day({
  selectedDay,
  items,
  selectedItems,
  onItemClick,
  onDayChange,
}: Props) {
  const { user } = useAuthContext()
  const userTimezone = user?.timezone ?? 'UTC'

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    return dayjs(selectedDay).tz(userTimezone)
  })

  const itemsByDate = useMemo(() => groupItemsByDate(items), [items])
  const dayItems = itemsByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []
  const hours: number[] = Array.from({ length: 24 }, (_, i) => i)

  // Update selectedDate when selectedDay prop changes
  useEffect(() => {
    setSelectedDate(dayjs(selectedDay).tz(userTimezone))
  }, [selectedDay, userTimezone])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack
        borderRadius={2}
        direction="row"
        gap={1}
        height="100%"
        overflow="hidden"
        width="100%"
      >
        {/* Day View - Left Side */}
        <Stack
          bgcolor="common.white"
          border={1}
          borderRadius={2}
          flex={1}
          height="100%"
          sx={{
            borderColor: 'divider',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {/* Time labels */}
          <Stack
            sx={{
              left: 0,
              position: 'absolute',
              top: 0,
              zIndex: 2,
            }}
          >
            {hours.map((hour) => (
              <Stack
                key={hour}
                sx={{
                  height: HOUR_HEIGHT,
                  justifyContent: 'flex-start',
                  p: 1,
                }}
              >
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                  }}
                  variant="body2"
                >
                  {formatHour(hour)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* Calendar grid */}
          <Stack
            sx={{
              minHeight: HOUR_HEIGHT * 24,
              position: 'relative',
            }}
          >
            {/* Hour lines */}
            {hours.map((hour) => (
              <Stack
                borderTop={1}
                key={hour}
                sx={{
                  borderColor: 'divider',
                  height: HOUR_HEIGHT,
                }}
              />
            ))}

            {/* Items for this day */}
            {dayItems.map((item) => {
              if (!item.startDate) return null

              const startHour = item.startDate.getHours()
              const startMinute = item.startDate.getMinutes()
              const endHour = item.endDate
                ? item.endDate.getHours()
                : startHour + 1
              const endMinute = item.endDate ? item.endDate.getMinutes() : 0

              const startMinutes = startHour * 60 + startMinute
              const endMinutes = endHour * 60 + endMinute
              const duration = Math.max(endMinutes - startMinutes, 30) // Minimum 30 minutes
              const top = (startMinutes / 60) * HOUR_HEIGHT
              const height = (duration / 60) * HOUR_HEIGHT

              return (
                <Stack
                  key={item.id}
                  onClick={(e) => onItemClick(item, e)}
                  sx={{
                    '&:hover': {
                      boxShadow: 2,
                      opacity: 0.8,
                    },
                    bgcolor: getStatusColor(item),
                    borderRadius: 1,
                    boxShadow: selectedItems.includes(item.id)
                      ? `0 0 0 2px ${getStatusColor(item)}`
                      : 'none',
                    color: 'white',
                    cursor: 'pointer',
                    height: Math.max(height, 20),
                    left: 55,
                    opacity: 0.9,
                    overflow: 'hidden',
                    p: 0.5,
                    position: 'absolute',
                    right: 4,
                    top,
                    zIndex: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}
                    variant="caption"
                  >
                    {formatTime(item.startDate)}
                    {item.endDate && ` - ${formatTime(item.endDate)}`}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}
                    variant="caption"
                  >
                    {item.name}
                  </Typography>
                </Stack>
              )
            })}
          </Stack>
        </Stack>

        {/* Calendar - Right Side */}
        <Stack
          bgcolor="common.white"
          border={1}
          borderRadius={2}
          height="100%"
          sx={{
            borderColor: 'divider',
          }}
          width="320px"
        >
          <DateCalendar
            onChange={(newValue: Dayjs | null) => {
              if (newValue) {
                const newDate = newValue.tz(userTimezone).toDate()
                setSelectedDate(newValue)
                onDayChange(newDate)
              }
            }}
            timezone={userTimezone}
            value={selectedDate}
          />
        </Stack>
      </Stack>
    </LocalizationProvider>
  )
}
