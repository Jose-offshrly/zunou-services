import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// Extend dayjs with required plugins
dayjs.extend(utc)
dayjs.extend(timezone)

/**
 * Return time diff in string format depending on tz
 */
export const relativeTimeWithTz = (
  dateString: string,
  timezone: string,
): string => {
  try {
    // Validate timezone by attempting to use it
    const testDate = dayjs().tz(timezone)
    if (!testDate.isValid()) {
      throw new Error('Invalid timezone')
    }

    // Parse the input date and set it to the specified timezone
    const inputDate = dayjs.tz(dateString, timezone)

    // Validate the parsed date
    if (!inputDate.isValid()) {
      throw new Error('Invalid date string')
    }

    // Get current time in the same timezone
    const now = dayjs().tz(timezone)

    // Calculate the difference in various units
    const diffMinutes = now.diff(inputDate, 'minute')
    const diffHours = now.diff(inputDate, 'hour')
    const diffDays = now.diff(inputDate, 'day')
    const diffWeeks = now.diff(inputDate, 'week')

    // Return appropriate relative time string
    if (diffMinutes < 1) {
      return 'Just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes} mins ago`
    } else if (diffHours < 24) {
      if (diffHours === 1) {
        return '1 hour ago'
      }
      // Check if it's today but show time for recent hours
      if (now.isSame(inputDate, 'day')) {
        return `Today at ${inputDate.format('h:mm A')}`
      }
      return `${diffHours} hours ago`
    } else if (diffDays === 1) {
      return '1 day ago'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else if (diffWeeks === 1) {
      return '1 week ago'
    } else if (diffWeeks < 4) {
      return `${diffWeeks} weeks ago`
    } else {
      // For dates older than a month, show the actual date
      return inputDate.format('MMM D, YYYY')
    }
  } catch (error) {
    // Handle invalid timezone or date
    if (error instanceof Error) {
      return `Error: ${error.message}`
    }
    return 'Error: Invalid timezone or date'
  }
}

/**
 *  Determines whether the current time in the given timezone has exceeded
 *  the provided reference date by more than the specified number of seconds.
 */
export function hasTimeExceededThreshold(
  date: string | Date,
  tz: string,
  seconds: number,
): boolean {
  const reference = dayjs.tz(date, tz)
  const now = dayjs().tz(tz)

  if (!reference.isValid() || !now.isValid()) {
    console.warn(
      `[hasTimeExceededThreshold] Invalid timezone or date: tz='${tz}', date='${date}'`,
    )
    return false
  }

  return now.diff(reference, 'second') > seconds
}
