import { Box, Typography } from '@mui/material'
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns'

import { DateRange, TimeAxisScale } from '../../types/types'

// Helper functions for quarters and years (not available in date-fns 2.30.0)
const eachQuarterOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const quarters: Date[] = []
  let current = new Date(start)
  current = startOfQuarter(current)

  while (current <= end) {
    quarters.push(new Date(current))
    current = new Date(current)
    current.setMonth(current.getMonth() + 3)
  }

  return quarters
}

const eachYearOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const years: Date[] = []
  let current = new Date(start)
  current = startOfYear(current)

  while (current <= end) {
    years.push(new Date(current))
    current = new Date(current)
    current.setFullYear(current.getFullYear() + 1)
  }

  return years
}

interface TimelineHeaderProps {
  dateRange: DateRange
  timeAxisScale: TimeAxisScale
  dayWidth: number
}

export const TimelineHeader = ({
  dateRange,
  timeAxisScale,
  dayWidth,
}: TimelineHeaderProps) => {
  const getDates = () => {
    switch (timeAxisScale) {
      case 'day':
        return eachDayOfInterval({ end: dateRange.end, start: dateRange.start })
      case 'week':
        return eachWeekOfInterval({
          end: dateRange.end,
          start: dateRange.start,
        })
      case 'month':
        return eachMonthOfInterval({
          end: dateRange.end,
          start: dateRange.start,
        })
      case 'quarter':
        return eachQuarterOfInterval({
          end: dateRange.end,
          start: dateRange.start,
        })
      case 'year':
        return eachYearOfInterval({
          end: dateRange.end,
          start: dateRange.start,
        })
      case 'multi-year':
        return eachYearOfInterval({
          end: dateRange.end,
          start: dateRange.start,
        })
      default:
        return eachDayOfInterval({ end: dateRange.end, start: dateRange.start })
    }
  }

  const formatDate = (date: Date) => {
    switch (timeAxisScale) {
      case 'day':
        return format(date, 'd')
      case 'week':
        return `${format(startOfWeek(date), 'MMM d')} - ${format(endOfWeek(date), 'd')}`
      case 'month':
        return format(date, 'MMM yyyy')
      case 'quarter':
        return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${format(date, 'yyyy')}`
      case 'year':
        return format(date, 'yyyy')
      case 'multi-year':
        return format(date, 'yyyy')
      default:
        return format(date, 'd')
    }
  }

  const getHeaderWidth = () => {
    switch (timeAxisScale) {
      case 'day':
        return dayWidth
      case 'week':
        return dayWidth * 7
      case 'month':
        return dayWidth * 30
      case 'quarter':
        return dayWidth * 90
      case 'year':
        return dayWidth * 365
      case 'multi-year':
        return dayWidth * 365
      default:
        return dayWidth
    }
  }

  const dates = getDates()
  const headerWidth = getHeaderWidth()

  // Get months for the secondary header (when showing days)
  const getMonthHeaders = () => {
    if (timeAxisScale !== 'day' && timeAxisScale !== 'week') return null

    const months: { month: string; width: number; start: number }[] = []
    let currentMonth = ''
    let currentStart = 0
    let currentWidth = 0

    dates.forEach((date, index) => {
      const monthYear = format(date, 'MMMM yyyy')
      if (monthYear === currentMonth) {
        currentWidth += headerWidth
      } else {
        if (currentMonth) {
          months.push({
            month: currentMonth,
            start: currentStart,
            width: currentWidth,
          })
        }
        currentMonth = monthYear
        currentStart = index * headerWidth
        currentWidth = headerWidth
      }
    })

    if (currentMonth) {
      months.push({
        month: currentMonth,
        start: currentStart,
        width: currentWidth,
      })
    }

    return months
  }

  const monthHeaders = getMonthHeaders()

  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Month/Year Header */}
      {monthHeaders && (
        <Box
          sx={{
            backgroundColor: 'action.hover',
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
          }}
        >
          {monthHeaders.map((header) => (
            <Box
              key={`month-${header.month}-${header.start}`}
              sx={{
                borderColor: 'divider',
                borderRight: 1,
                minWidth: header.width,
                px: 1,
                py: 0.5,
                width: header.width,
              }}
            >
              <Typography fontWeight={600} variant="caption">
                {header.month}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Day/Week Headers */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
        }}
      >
        {dates.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd')
          const isToday = dateKey === format(new Date(), 'yyyy-MM-dd')
          const isWeekend = date.getDay() === 0 || date.getDay() === 6

          const getBackgroundColor = () => {
            if (isToday) return 'primary.main'
            if (isWeekend) return 'action.hover'
            return 'transparent'
          }

          return (
            <Box
              key={dateKey}
              sx={{
                backgroundColor: getBackgroundColor(),
                borderColor: 'divider',
                borderRight: 1,
                minWidth: headerWidth,
                px: 0.5,
                py: 0.75,
                textAlign: 'center',
                width: headerWidth,
              }}
            >
              <Typography
                sx={{
                  color: isToday ? 'primary.contrastText' : 'text.secondary',
                  fontWeight: isToday ? 600 : 400,
                }}
                variant="caption"
              >
                {formatDate(date)}
              </Typography>
              {timeAxisScale === 'day' && (
                <Typography
                  display="block"
                  sx={{
                    color: isToday ? 'primary.contrastText' : 'text.disabled',
                    fontSize: '0.65rem',
                  }}
                  variant="caption"
                >
                  {format(date, 'EEE')}
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
