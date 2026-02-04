import { alpha, Stack, Typography } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from 'date-fns'
import dayjs, { Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useMemo, useState } from 'react'

import { TimelineItem } from '../../types/types'
import { SelectedWeek } from './types'
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
  selectedWeek: SelectedWeek
  items: TimelineItem[]
  selectedItems: string[]
  onItemClick: (item: TimelineItem, e: React.MouseEvent) => void
  onWeekChange: (week: SelectedWeek) => void
}

export default function Week({
  selectedWeek,
  items,
  selectedItems,
  onItemClick,
  onWeekChange,
}: Props) {
  const { user } = useAuthContext()
  const userTimezone = user?.timezone ?? 'UTC'

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    return dayjs(selectedWeek.start).tz(userTimezone)
  })

  const itemsByDate = useMemo(() => groupItemsByDate(items), [items])
  const daysOfWeek = eachDayOfInterval({
    end: selectedWeek.end,
    start: selectedWeek.start,
  })
  const hours: number[] = Array.from({ length: 24 }, (_, i) => i)

  // Update selectedDate when selectedWeek changes
  useEffect(() => {
    setSelectedDate(dayjs(selectedWeek.start).tz(userTimezone))
  }, [selectedWeek.start, userTimezone])

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
        {/* Week View - Left Side */}
        <Stack
          border={1}
          borderRadius={2}
          flex={1}
          height="100%"
          sx={{ borderColor: 'divider', overflow: 'hidden' }}
          width="100%"
        >
          {/* Week Header */}
          <Stack
            bgcolor="white"
            borderColor="divider"
            direction="row"
            sx={{ flexShrink: 0 }}
          >
            {/* Time column header */}
            <Stack width={80} />

            {/* Day headers */}
            {daysOfWeek.map((day, index) => {
              const isCurrentDay = isToday(day)
              const isSunday = day.getDay() === 0
              return (
                <Stack
                  alignItems="flex-start"
                  bgcolor={
                    isCurrentDay
                      ? alpha(theme.palette.error.light, 0.1)
                      : isSunday
                        ? 'grey.50'
                        : 'transparent'
                  }
                  borderLeft={1}
                  flex={1}
                  justifyContent="flex-start"
                  key={index}
                  p={1}
                  pb={4}
                  sx={{
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                    variant="caption"
                  >
                    {format(day, 'EEE').toUpperCase()}
                  </Typography>
                  <Typography
                    sx={{
                      alignItems: 'center',
                      borderRadius: '50%',
                      color: 'text.primary',
                      display: 'flex',
                      fontWeight: 500,
                      justifyContent: 'center',
                    }}
                    variant="h5"
                  >
                    {format(day, 'd')}
                  </Typography>
                </Stack>
              )
            })}
          </Stack>

          {/* Week Grid */}
          <Stack
            direction="row"
            flex={1}
            sx={{ overflowY: 'auto', position: 'relative' }}
          >
            {/* Time labels column */}
            <Stack
              sx={{
                bgcolor: 'white',
                borderColor: 'divider',
                borderRight: 1,
                left: 0,
                minHeight: HOUR_HEIGHT * 24,
                position: 'sticky',
                zIndex: 2,
              }}
              width={80}
            >
              {hours.map((hour) => (
                <Stack
                  key={hour}
                  sx={{
                    alignItems: 'center',
                    height: HOUR_HEIGHT,
                    justifyContent: 'flex-start',
                    position: 'relative',
                  }}
                >
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.7rem',
                      pt: 0.5,
                    }}
                    variant="caption"
                  >
                    {formatHour(hour)}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            {/* Days columns */}
            {daysOfWeek.map((day, dayIndex) => {
              const dayItems = itemsByDate.get(format(day, 'yyyy-MM-dd')) || []
              const isCurrentDay = isToday(day)
              const isSunday = day.getDay() === 0

              return (
                <Stack
                  borderLeft={1}
                  flex={1}
                  key={dayIndex}
                  sx={{
                    bgcolor: isCurrentDay
                      ? alpha(theme.palette.error.light, 0.1)
                      : isSunday
                        ? 'grey.50'
                        : 'white',
                    borderColor: 'divider',
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
                    const endMinute = item.endDate
                      ? item.endDate.getMinutes()
                      : 0

                    const startMinutes = startHour * 60 + startMinute
                    const endMinutes = endHour * 60 + endMinute
                    const duration = Math.max(endMinutes - startMinutes, 30)
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
                          left: 4,
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
                const newDate = newValue.tz(userTimezone)
                setSelectedDate(newValue)
                // Update week to contain the selected date
                const start = startOfWeek(newDate.toDate())
                const end = endOfWeek(newDate.toDate())
                onWeekChange({ end, start })
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
