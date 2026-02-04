import { MeetingSession } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { DateRange } from '~/components/domain/dataSource/InvitePulseToMeetingModal/components/DateRangePicker'
import { MeetingFilterType } from '~/components/domain/dataSource/InvitePulseToMeetingModal/components/MeetingsToolbar'

const STORAGE_KEY = 'meetings_date_range'

export const useMeetingSessionsFilters = () => {
  const { user } = useAuthContext()
  const { pulseId, organizationId } = useParams<{
    pulseId: string
    organizationId: string
  }>()
  const timezone = user?.timezone ?? 'UTC'

  const initialRange = useMemo(getInitialRange, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState<Dayjs | null>(
    initialRange.startDate,
  )
  const [endDate, setEndDate] = useState<Dayjs | null>(initialRange.endDate)
  const [type, setSelectedType] = useState<MeetingFilterType>(
    MeetingFilterType.All,
  )

  const queryVariables = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vars: Record<string, any> = {
      organizationId,
      pulseId,
    }

    if (startDate && endDate) {
      if (startDate.isSame(endDate, 'day')) {
        vars.onDate = startDate.format('YYYY-MM-DD')
      } else {
        vars.dateRange = [
          startDate.format('YYYY-MM-DD'),
          endDate.format('YYYY-MM-DD'),
        ]
      }
    }

    return vars
  }, [organizationId, pulseId, startDate, endDate])

  const handleSelectDateRange = ({ start, end }: DateRange) => {
    const newStart = start?.tz(timezone).startOf('day') ?? null
    const newEnd = end?.tz(timezone).endOf('day') ?? null

    const hasChanged =
      (newStart && !newStart.isSame(startDate)) ||
      (newEnd && !newEnd.isSame(endDate))

    if (hasChanged) {
      setStartDate(newStart)
      setEndDate(newEnd)

      if (newStart && newEnd) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            end: newEnd.toISOString(),
            start: newStart.toISOString(),
          }),
        )
      }
    }
  }

  const handleTypeChange = (type: MeetingFilterType) => {
    setSelectedType(type)
  }

  const filterBySearchQuery = (meetings: MeetingSession[]) => {
    const query = searchQuery.toLowerCase()
    return meetings.filter(
      (meeting) =>
        !query ||
        meeting.name?.toLowerCase().includes(query) ||
        meeting.description?.toLowerCase().includes(query),
    )
  }

  return {
    endDate,
    filterBySearchQuery,
    handleSelectDateRange,
    handleTypeChange,
    queryVariables,
    searchQuery,
    setSearchQuery,
    startDate,
    type,
  }
}

const getInitialRange = (): { startDate: Dayjs; endDate: Dayjs } => {
  const saved = sessionStorage.getItem(STORAGE_KEY)

  if (saved) {
    try {
      const { start, end } = JSON.parse(saved) as {
        start: string
        end: string
      }

      if (start && end) {
        return {
          endDate: dayjs(end).endOf('day'),
          startDate: dayjs(start).startOf('day'),
        }
      }
    } catch {
      // ignore malformed data
    }
  }

  return {
    endDate: dayjs().endOf('day'),
    startDate: dayjs().startOf('day'),
  }
}
