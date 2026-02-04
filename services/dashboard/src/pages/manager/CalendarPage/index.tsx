import {
  Add,
  ChevronLeft,
  ChevronRight,
  Schedule,
  Today,
  TodayOutlined,
} from '@mui/icons-material'
import {
  Badge,
  Box,
  Stack,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Button, IconButton } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingsTabIdentifier } from '~/components/domain/settings/SettingsModal'
import { useUserSettingsStore } from '~/store/useUserSettingsStore'

import CalendarView from './CalendarView'
import { CreateEventModal } from './CreateEventModal'
import ScheduleView from './ScheduleView'
import { SearchSchedule } from './SearchSchedule'

type CalendarView = 'schedule' | 'calendar'
export type ScheduleFilter = 'schedule' | 'upcoming' | 'past'
export type CalendarPeriod = 'day' | 'week' | 'month'

export interface SelectedWeek {
  startDate: string | null
  endDate: string | null
}

export interface SelectedDay {
  date: string | null
}

// Styled toggle button group for view filters
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

export const CalendarPage = () => {
  const { user } = useAuthContext()
  const { t } = useTranslation('common')

  const userTimezone = user?.timezone ?? 'UTC'
  const today = dayjs().tz(userTimezone)

  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<CalendarView>('schedule')
  const [scheduleFilter, setScheduleFilter] =
    useState<ScheduleFilter>('schedule')
  const [calendarPeriod, setCalendarPeriod] = useState<CalendarPeriod>('day')
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false)

  const [newlyCreatedEventId, setNewlyCreatedEventId] = useState<string | null>(
    null,
  )

  // Get current week (Sunday to Saturday)
  const getCurrentWeek = () => {
    const currentDay = dayjs().tz(userTimezone).day() // 0 = Sunday, 6 = Saturday
    const todayInTimezone = dayjs().tz(userTimezone)
    const startOfWeek = todayInTimezone
      .subtract(currentDay, 'day')
      .startOf('day')
    const endOfWeek = startOfWeek.add(6, 'day').endOf('day')

    return {
      endDate: endOfWeek.format('YYYY-MM-DD'),
      startDate: startOfWeek.format('YYYY-MM-DD'),
    }
  }

  const [selectedWeek, setSelectedWeek] =
    useState<SelectedWeek>(getCurrentWeek())
  const [selectedDay, setSelectedDay] = useState<SelectedDay>({
    date: today.format('YYYY-MM-DD'),
  })
  const [selectedMonth, setSelectedMonth] = useState<number>(() =>
    today.month(),
  )
  const [selectedYear, setSelectedYear] = useState<number>(() => today.year())

  // opens modal for linking calendars
  const {
    isOpen: isSettingsOpen,
    setIsOpen: setIsSettingsOpen,
    setCurrentTab,
  } = useUserSettingsStore()

  // Navigate between different time periods (day/week/month)
  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (calendarPeriod === 'month') {
      if (direction === 'prev') {
        if (selectedMonth === 0) {
          setSelectedMonth(11)
          setSelectedYear((prev) => prev - 1)
        } else {
          setSelectedMonth((prev) => prev - 1)
        }
      } else {
        if (selectedMonth === 11) {
          setSelectedMonth(0)
          setSelectedYear((prev) => prev + 1)
        } else {
          setSelectedMonth((prev) => prev + 1)
        }
      }
    } else if (calendarPeriod === 'week') {
      if (selectedWeek.startDate) {
        const days = direction === 'prev' ? -7 : 7
        const newWeekStart = dayjs(selectedWeek.startDate)
          .tz(userTimezone)
          .add(days, 'day')
        const newWeekEnd = newWeekStart.add(6, 'day').endOf('day')

        setSelectedWeek({
          endDate: newWeekEnd.format('YYYY-MM-DD'),
          startDate: newWeekStart.format('YYYY-MM-DD'),
        })
      }
    } else if (calendarPeriod === 'day') {
      if (selectedDay.date) {
        const days = direction === 'prev' ? -1 : 1
        const newDay = dayjs(selectedDay.date).tz(userTimezone).add(days, 'day')

        setSelectedDay({
          date: newDay.format('YYYY-MM-DD'),
        })
      }
    }
  }

  const displayedDate = dayjs()
    .tz(userTimezone)
    .year(selectedYear)
    .month(selectedMonth)

  // Format day display (e.g., "January 9, 2026")
  const getDayDisplay = () => {
    if (!selectedDay.date) return ''
    return dayjs(selectedDay.date).tz(userTimezone).format('MMMM D, YYYY')
  }

  // Format week display (e.g., "Jan 5 - Jan 11, 2026")
  const getWeekDisplay = () => {
    if (!selectedWeek.startDate || !selectedWeek.endDate) return ''

    const start = dayjs(selectedWeek.startDate).tz(userTimezone)
    const end = dayjs(selectedWeek.endDate).tz(userTimezone)

    if (start.year() !== end.year()) {
      return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`
    } else if (start.month() !== end.month()) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
    } else {
      return `${start.format('MMM D')} - ${end.format('D, YYYY')}`
    }
  }

  // Open settings modal for linking calendars
  const toggleSettingsOpen = () => {
    setCurrentTab(SettingsTabIdentifier['LINKED ACCOUNTS'])
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: CalendarView | null,
  ) => {
    if (newView !== null) {
      setView(newView)
    }
  }

  const handleScheduleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: ScheduleFilter | null,
  ) => {
    if (newFilter !== null) {
      setScheduleFilter(newFilter)
    }
  }

  const handleCalendarPeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: CalendarPeriod | null,
  ) => {
    if (newPeriod !== null) {
      setCalendarPeriod(newPeriod)
    }
  }

  const handleGoToCurrentDay = () => {
    if (calendarPeriod === 'day') {
      setSelectedDay({
        date: today.format('YYYY-MM-DD'),
      })
    } else if (calendarPeriod === 'week') {
      const currentWeek = getCurrentWeek()
      setSelectedWeek(currentWeek)
    } else if (calendarPeriod === 'month') {
      setSelectedMonth(today.month())
      setSelectedYear(today.year())
    }
  }

  const isAlreadyOnCurrentPeriod = () => {
    if (calendarPeriod === 'day') {
      return selectedDay.date === today.format('YYYY-MM-DD')
    } else if (calendarPeriod === 'week') {
      const currentWeek = getCurrentWeek()
      return (
        selectedWeek.startDate === currentWeek.startDate &&
        selectedWeek.endDate === currentWeek.endDate
      )
    } else if (calendarPeriod === 'month') {
      return selectedMonth === today.month() && selectedYear === today.year()
    }
    return false
  }

  const getGoToButtonText = () => {
    if (calendarPeriod === 'day') {
      return 'Go to current day'
    } else if (calendarPeriod === 'week') {
      return 'Go to current week'
    } else {
      return 'Go to current month'
    }
  }

  return (
    <Stack flex={1} overflow="hidden" px={8} py={4} spacing={0}>
      {/* Toolbar */}
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={2}
      >
        {/* Date and View Toggle */}
        <Stack alignItems="center" direction="row" spacing={2}>
          {view === 'calendar' && (
            <Stack alignItems="center" direction="row" gap={0.5}>
              <IconButton
                onClick={() => navigatePeriod('prev')}
                size="small"
                sx={{
                  p: 0,
                }}
              >
                <ChevronLeft fontSize="medium" />
              </IconButton>

              <IconButton
                onClick={() => navigatePeriod('next')}
                size="small"
                sx={{
                  p: 0,
                }}
              >
                <ChevronRight fontSize="medium" />
              </IconButton>
            </Stack>
          )}
          <Typography fontWeight={600} variant="h5">
            {view === 'schedule'
              ? scheduleFilter === 'past'
                ? 'Past Events'
                : today.format('MMMM D, YYYY')
              : calendarPeriod === 'day'
                ? getDayDisplay()
                : calendarPeriod === 'week'
                  ? getWeekDisplay()
                  : displayedDate.format('MMMM YYYY')}
          </Typography>
          <ToggleButtonGroup
            exclusive={true}
            onChange={handleViewChange}
            size="small"
            sx={{
              '& .MuiToggleButtonGroup-grouped': {
                '&.Mui-selected': {
                  '&:hover': {
                    backgroundColor: theme.palette.common.white,
                  },
                  backgroundColor: theme.palette.common.white,
                },
                border: 0,
              },
              backgroundColor: theme.palette.grey[200],
              borderRadius: '20px',
              padding: '4px',
            }}
            value={view}
          >
            <ToggleButton
              sx={{
                borderRadius: '16px 0px 0px 16px !important',
                px: 1,
              }}
              value="schedule"
            >
              <Schedule
                sx={{
                  color:
                    view === 'schedule' ? 'primary.main' : 'text.secondary',
                  fontSize: 20,
                }}
              />
            </ToggleButton>
            <ToggleButton
              sx={{
                borderRadius: '0px 16px 16px 0px !important',
                px: 1,
              }}
              value="calendar"
            >
              <TodayOutlined
                sx={{
                  color:
                    view === 'calendar' ? 'primary.main' : 'text.secondary',
                  fontSize: 20,
                }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {view === 'calendar' && (
          <Button
            disabled={isAlreadyOnCurrentPeriod()}
            onClick={handleGoToCurrentDay}
            variant="outlined"
          >
            {getGoToButtonText()}
          </Button>
        )}

        {/* View Filter */}
        <Stack>
          {view === 'schedule' ? (
            <StyledToggleButtonGroup
              exclusive={true}
              onChange={handleScheduleFilterChange}
              size="small"
              value={scheduleFilter}
            >
              <ToggleButton value="schedule">{t('schedule')}</ToggleButton>
              <ToggleButton value="upcoming">{t('upcoming')}</ToggleButton>
              <ToggleButton value="past">{t('past')}</ToggleButton>
            </StyledToggleButtonGroup>
          ) : (
            <StyledToggleButtonGroup
              exclusive={true}
              onChange={handleCalendarPeriodChange}
              size="small"
              value={calendarPeriod}
            >
              <ToggleButton value="day">{t('day')}</ToggleButton>
              <ToggleButton value="week">{t('week')}</ToggleButton>
              <ToggleButton value="month">{t('month')}</ToggleButton>
            </StyledToggleButtonGroup>
          )}
        </Stack>

        {/* Search, Sync Calendar Icon and Create Event Button */}
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="flex-end"
          spacing={1}
        >
          {view === 'schedule' && (
            <Stack alignItems="flex-end">
              <SearchSchedule
                onSearch={(value) => setSearchQuery(value)}
                searchQuery={searchQuery}
              />
            </Stack>
          )}
          <Stack>
            <Button onClick={toggleSettingsOpen}>
              <Badge
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                badgeContent={
                  <Today
                    sx={{
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      color: 'primary.main',
                      fontSize: 18,
                      padding: '2px',
                    }}
                  />
                }
                overlap="circular"
              >
                <Avatar
                  placeholder={user?.name}
                  size="small"
                  src={user?.gravatar}
                  variant="circular"
                />
              </Badge>
            </Button>
          </Stack>
          <Button
            onClick={() => setIsCreateEventModalOpen(true)}
            startIcon={<Add fontSize="small" />}
            sx={{
              textTransform: 'none',
            }}
            variant="contained"
          >
            {t('create_event')}
          </Button>
        </Stack>
      </Stack>

      {/* Create Event Modal */}
      <CreateEventModal
        onClose={(createdEventId) => {
          setIsCreateEventModalOpen(false)
          if (createdEventId) {
            setNewlyCreatedEventId(createdEventId)
          }
        }}
        open={isCreateEventModalOpen}
      />

      {/* Content */}
      <Box flexGrow={1} minHeight={0}>
        <Stack
          alignItems="center"
          height="100%"
          justifyContent="start"
          overflow="auto"
          paddingTop={4}
        >
          {view === 'schedule' ? (
            <ScheduleView
              newlyCreatedEventId={newlyCreatedEventId}
              onNewEventHandled={() => setNewlyCreatedEventId(null)} // reset the newly created ID once the modal has been opened
              scheduleFilter={scheduleFilter}
              searchQuery={searchQuery}
            />
          ) : (
            <CalendarView
              calendarPeriod={calendarPeriod}
              selectedDay={selectedDay}
              selectedMonth={selectedMonth}
              selectedWeek={selectedWeek}
              selectedYear={selectedYear}
              setSelectedDay={setSelectedDay}
            />
          )}
        </Stack>
      </Box>
    </Stack>
  )
}

export default CalendarPage
