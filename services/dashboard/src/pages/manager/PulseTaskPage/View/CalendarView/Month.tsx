import { alpha, Divider, Stack, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

import { TimelineItem } from '../../types/types'
import { formatTime, getStatusColor, groupItemsByDate, WEEKDAYS } from './utils'

interface Props {
  selectedMonth: Date
  items: TimelineItem[]
  selectedItems: string[]
  onItemClick: (item: TimelineItem, e: React.MouseEvent) => void
}

export default function Month({
  selectedMonth,
  items,
  selectedItems,
  onItemClick,
}: Props) {
  const itemsByDate = groupItemsByDate(items)

  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    end: calendarEnd,
    start: calendarStart,
  })

  // Group calendar days into weeks
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  return (
    <Stack
      bgcolor="#f5f5f5"
      border={1}
      borderRadius={2}
      height="100%"
      sx={{ borderColor: 'divider', overflow: 'hidden' }}
      width="100%"
    >
      {/* Days of week header */}
      <Stack
        bgcolor="white"
        borderBottom={1}
        direction="row"
        sx={{ borderColor: 'divider', flexShrink: 0 }}
      >
        {WEEKDAYS.map((day, index) => (
          <>
            <Stack
              alignItems="center"
              bgcolor={day === 'Sun' ? 'grey.50' : undefined}
              flex={1}
              key={day}
              py={1}
            >
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                variant="caption"
              >
                {day.toUpperCase()}
              </Typography>
            </Stack>
            {index < WEEKDAYS.length - 1 && (
              <Divider flexItem={true} orientation="vertical" />
            )}
          </>
        ))}
      </Stack>

      {/* Calendar Grid */}
      <Stack flex={1} sx={{ overflowY: 'auto' }}>
        {weeks.map((week, weekIndex) => (
          <Stack
            direction="row"
            flex={1}
            key={weekIndex}
            sx={{ minHeight: 120 }}
          >
            {week.map((day, dayIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayItems = itemsByDate.get(dateKey) || []
              const isCurrentMonth = isSameMonth(day, selectedMonth)
              const dayIsToday = isToday(day)
              const dayIsSunday = day.getDay() === 0

              return (
                <Stack
                  borderBottom={weekIndex < weeks.length - 1 ? 1 : 0}
                  borderRight={dayIndex < 6 ? 1 : 0}
                  flex={1}
                  key={dateKey}
                  py={0.5}
                  sx={{
                    alignItems: 'center',
                    bgcolor: dayIsSunday ? 'grey.50' : 'white',
                    borderColor: 'divider',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day number - only show if in current month */}
                  {isCurrentMonth && (
                    <Typography
                      sx={{
                        alignItems: 'center',
                        bgcolor: dayIsToday
                          ? alpha(theme.palette.error.light, 0.8)
                          : 'transparent',
                        borderRadius: '50%',
                        color: dayIsToday ? 'common.white' : 'text.primary',
                        display: 'flex',
                        fontWeight: dayIsToday ? 600 : 400,
                        height: 20,
                        justifyContent: 'center',
                        mb: 0.5,
                        width: 20,
                      }}
                      variant="caption"
                    >
                      {format(day, 'd')}
                    </Typography>
                  )}

                  {/* Items - only show if in current month */}
                  {isCurrentMonth && (
                    <Stack
                      gap={0.5}
                      p={1}
                      sx={{
                        '&::-webkit-scrollbar': {
                          width: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          '&:hover': {
                            backgroundColor: alpha('#000', 0.3),
                          },
                          backgroundColor: alpha('#000', 0.2),
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'transparent',
                        },
                        flex: 1,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                      }}
                      width="100%"
                    >
                      {dayItems.map((item) => (
                        <Stack
                          key={item.id}
                          onClick={(e) => onItemClick(item, e)}
                          overflow="hidden"
                          sx={{
                            '&:hover': {
                              bgcolor: 'grey.100',
                            },
                            alignItems: 'center',
                            borderRadius: 0.5,
                            boxShadow: selectedItems.includes(item.id)
                              ? `0 0 0 2px ${getStatusColor(item)}`
                              : 'none',
                            cursor: 'pointer',
                            flexDirection: 'row',
                            flexShrink: 0,
                            gap: 0.5,
                            overflow: 'hidden',
                            px: 0.5,
                            py: 0.25,
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            variant="caption"
                          >
                            {item.startDate && formatTime(item.startDate)}{' '}
                            {item.name}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Stack>
              )
            })}
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
