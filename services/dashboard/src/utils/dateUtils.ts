import dayjs, { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export const getWeekRange = (date: Dayjs | null) => {
  if (!date) return { endDate: null, startDate: null }

  const startDate = dayjs(date.startOf('week')).format('YYYY-MM-DD')
  const endDate = dayjs(date.endOf('week')).format('YYYY-MM-DD')

  return { endDate, startDate }
}

export const isInSameWeek = (dayA: Dayjs, dayB: Dayjs | null | undefined) => {
  if (!dayB) return false
  return dayA.isSame(dayB, 'week')
}

export const formatRange = (start: Dayjs | null, end: Dayjs | null) => {
  if (start && end && start.isSame(end, 'day')) {
    return start.format('MMMM D, YYYY')
  }

  return `${start ? start.format('MM/DD/YY') : 'MM/DD/YY'} - ${
    end ? end.format('MM/DD/YY') : 'MM/DD/YY'
  }`
}

export const formatRelativeDateLabel = (inputDate: string, tz?: string) => {
  const parsedDate = dayjs(inputDate)
  const now = tz ? dayjs().tz(tz) : dayjs()

  if (!parsedDate.isValid()) return ''

  const diffInHours = now.diff(parsedDate, 'hour')
  const diffInDays = now.diff(parsedDate, 'day')
  const diffInWeeks = now.diff(parsedDate, 'week')

  // Same day → use hours/minutes ago
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const diffInMinutes = now.diff(parsedDate, 'minute')
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
    }
    return `${diffInHours}h ago`
  }

  // Within 7 days → use days
  if (diffInDays < 7) {
    if (diffInDays === 1) return 'Yesterday'
    return `${diffInDays}d ago`
  }

  // Within 4 weeks → use weeks
  if (diffInWeeks < 4) {
    return `${diffInWeeks}wk${diffInWeeks > 1 ? 's' : ''} ago`
  }

  return parsedDate.format('MMM D, YYYY')
}
