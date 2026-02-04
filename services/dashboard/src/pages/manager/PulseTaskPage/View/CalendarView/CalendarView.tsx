import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import {
  Box,
  Stack,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { IconButton as ZunouIconButton } from '@zunou-react/components/form'
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns'
import { useState } from 'react'

import {
  useFilteredItems,
  useTimelineStore,
} from '../../store/useTimelineStore'
import { TimelineItem } from '../../types/types'
import { CalendarPeriod, Day, Month, SelectedWeek, Week } from './index'

// Styled toggle button group for period filters
const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main + '20',
      color: theme.palette.primary.main,
    },
    '&:first-of-type': {
      borderRadius: '20px 0 0 20px',
    },
    '&:last-of-type': {
      borderRadius: '0 20px 20px 0',
    },
    border: '1px solid ' + theme.palette.grey[200],
    fontWeight: 500,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    textTransform: 'none',
  },
  backgroundColor: theme.palette.common.white,
  borderRadius: '20px',
  width: 'fit-content',
}))

export const CalendarView = () => {
  const items = useFilteredItems()
  const selectedItems = useTimelineStore((state) => state.selectedItems)
  const setSelectedItems = useTimelineStore((state) => state.setSelectedItems)

  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>('month')
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [selectedWeek, setSelectedWeek] = useState<SelectedWeek>(() => {
    const today = new Date()
    const start = startOfWeek(today)
    const end = endOfWeek(today)
    return { end, start }
  })
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  const handleItemClick = (item: TimelineItem, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (selectedItems.includes(item.id)) {
        setSelectedItems(selectedItems.filter((id) => id !== item.id))
      } else {
        setSelectedItems([...selectedItems, item.id])
      }
    } else {
      setSelectedItems([item.id])
    }
  }

  const handlePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: CalendarPeriod | null,
  ) => {
    if (newPeriod !== null) {
      setCalendarPeriod(newPeriod)
      // Sync dates when switching periods
      if (newPeriod === 'day') {
        // Already have selectedDay
      } else if (newPeriod === 'week') {
        // Update week to contain the selected day
        const start = startOfWeek(selectedDay)
        const end = endOfWeek(selectedDay)
        setSelectedWeek({ end, start })
      } else if (newPeriod === 'month') {
        // Update month to match selected day
        setSelectedMonth(selectedDay)
      }
    }
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (calendarPeriod === 'month') {
      const newMonth =
        direction === 'prev'
          ? subMonths(selectedMonth, 1)
          : addMonths(selectedMonth, 1)
      setSelectedMonth(newMonth)
      setSelectedDay(startOfMonth(newMonth))
    } else if (calendarPeriod === 'week') {
      const newWeek = {
        end:
          direction === 'prev'
            ? subWeeks(selectedWeek.end, 1)
            : addWeeks(selectedWeek.end, 1),
        start:
          direction === 'prev'
            ? subWeeks(selectedWeek.start, 1)
            : addWeeks(selectedWeek.start, 1),
      }
      setSelectedWeek(newWeek)
      setSelectedDay(newWeek.start)
    } else if (calendarPeriod === 'day') {
      const newDay =
        direction === 'prev' ? subDays(selectedDay, 1) : addDays(selectedDay, 1)
      setSelectedDay(newDay)
    }
  }

  const getDayDisplay = () => {
    return format(selectedDay, 'MMMM d, yyyy')
  }

  const getWeekDisplay = () => {
    const start = selectedWeek.start
    const end = selectedWeek.end
    if (start.getFullYear() !== end.getFullYear()) {
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
    } else if (start.getMonth() !== end.getMonth()) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
    }
  }

  const getMonthDisplay = () => {
    return format(selectedMonth, 'MMMM yyyy')
  }

  return (
    <Stack flex={1} overflow="hidden" spacing={0}>
      {/* Toolbar */}
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={2}
        sx={{ p: 2 }}
      >
        {/* Date and Navigation */}
        <Stack alignItems="center" direction="row" spacing={2}>
          <Stack alignItems="center" direction="row" gap={0.5}>
            <ZunouIconButton
              onClick={() => navigatePeriod('prev')}
              size="small"
              sx={{
                p: 0,
              }}
            >
              <ChevronLeft fontSize="medium" />
            </ZunouIconButton>

            <ZunouIconButton
              onClick={() => navigatePeriod('next')}
              size="small"
              sx={{
                p: 0,
              }}
            >
              <ChevronRight fontSize="medium" />
            </ZunouIconButton>
          </Stack>
          <Typography fontWeight={600} variant="h5">
            {calendarPeriod === 'day'
              ? getDayDisplay()
              : calendarPeriod === 'week'
                ? getWeekDisplay()
                : getMonthDisplay()}
          </Typography>
        </Stack>

        {/* Period Filter */}
        <Stack>
          <StyledToggleButtonGroup
            exclusive={true}
            onChange={handlePeriodChange}
            size="small"
            value={calendarPeriod}
          >
            <ToggleButton value="day">Day</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
          </StyledToggleButtonGroup>
        </Stack>
      </Stack>

      {/* Content */}
      <Box flexGrow={1} minHeight={0}>
        {calendarPeriod === 'day' && (
          <Day
            items={items}
            onDayChange={setSelectedDay}
            onItemClick={handleItemClick}
            selectedDay={selectedDay}
            selectedItems={selectedItems}
          />
        )}
        {calendarPeriod === 'week' && (
          <Week
            items={items}
            onItemClick={handleItemClick}
            onWeekChange={setSelectedWeek}
            selectedItems={selectedItems}
            selectedWeek={selectedWeek}
          />
        )}
        {calendarPeriod === 'month' && (
          <Month
            items={items}
            onItemClick={handleItemClick}
            selectedItems={selectedItems}
            selectedMonth={selectedMonth}
          />
        )}
      </Box>
    </Stack>
  )
}
