/**
 * Returns the given date in DD-MM-YYYY format.
 *
 * @param date - The date to format.
 *
 * @returns The converted date as a string.
 */
export const compactDateToString = (date?: Date): string => {
  return dateToString(date).replace(/ /g, '')
}

/**
 * Returns the given date in YYYY-MM-DD format.
 *
 * @param date - The date to format.
 *
 * @returns The converted date as a string.
 */
export const dateToGraphQLString = (date: Date): string => {
  const d = date.getDate()
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return (
    '' +
    y.toString() +
    '-' +
    (m <= 9 ? '0' + m.toString() : m.toString()) +
    '-' +
    (d <= 9 ? '0' + d.toString() : d.toString())
  )
}

/**
 * Returns the given date in DD-MM-YYYY format.
 *
 * @param date - The date to format.
 *
 * @returns The converted date as a string.
 */
export const dateToString = (date?: Date): string => {
  if (!date || !isValidDate(date)) {
    return ''
  }

  const d = date.getDate()
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return (
    y.toString() +
    '-' +
    (m <= 9 ? '0' + m.toString() : m.toString()) +
    '-' +
    (d <= 9 ? '0' + d.toString() : d.toString())
  )
}

/**
 * Returns the given date in YYYY-MM-DD HH:MM format.
 *
 * @param datetime - The datetime to format.
 *
 * @returns The converted date as a string.
 */
export const datetimeToString = (datetime: Date): string => {
  const h = datetime.getHours()
  const m = datetime.getMinutes()
  return (
    dateToString(datetime) +
    ' ' +
    (h <= 9 ? '0' + h.toString() : h.toString()) +
    ':' +
    (m <= 9 ? '0' + m.toString() : m.toString())
  )
}

/**
 * Returns true if the given date is a valid Date object, false otherwise.
 *
 * @param candidate - The date to test.
 *
 * @returns A boolean indicating validity
 */
export const isValidDate = (candidate?: Date): boolean => {
  // See https://stackoverflow.com/a/66754687/72120
  return candidate instanceof Date && !!candidate.getDate()
}

/**
 * Converts the given number of seconds into a human-readable string.
 *
 * @param seconds - The number of seconds to format.
 *
 * @returns A string representing the number of seconds
 */
export const humanizeSeconds = (seconds: number): string => {
  const minute = 60
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (seconds < hour) {
    const minutes = Math.floor(seconds / minute)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`
  } else if (seconds < 3 * day) {
    const hours = Math.floor(seconds / hour)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  } else if (seconds < 3 * week) {
    const days = Math.floor(seconds / day)
    return `${days} ${days === 1 ? 'day' : 'days'}`
  } else {
    const weeks = Math.floor(seconds / week)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
  }
}

/**
 * Returns the time since the given date as a string.
 *
 * @param timeOrString - The time to format.
 *
 * @returns The time in time-since format.
 */
export const timeSince = (timeOrString: Date | string): string => {
  let timestamp: number
  if (typeof timeOrString === 'string') {
    timestamp = Date.parse(timeOrString)
  } else {
    timestamp = Number(timeOrString)
  }

  const seconds = Math.floor((Number(new Date()) - timestamp) / 1000)
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  const months = days / 30
  const years = days / 365

  if (years >= 1) {
    return Math.floor(years).toString() + 'y'
  } else if (months >= 1) {
    return Math.floor(months).toString() + 'mon'
  } else if (days >= 1) {
    return Math.floor(days).toString() + 'd'
  } else if (hours >= 1) {
    return Math.floor(hours).toString() + 'h'
  } else if (minutes >= 1) {
    return Math.floor(minutes).toString() + 'm'
  }

  return Math.floor(seconds).toString() + 's'
}

/**
 * Returns the time since the given date as a string.
 *
 * @param timeOrString - The time to format.
 *
 * @returns The time in time-since format.
 */
export const timeSinceLong = (timeOrString: Date | string): string => {
  let timestamp: number
  if (typeof timeOrString === 'string') {
    timestamp = Date.parse(timeOrString)
  } else {
    timestamp = Number(timeOrString)
  }

  const seconds = Math.floor((Number(new Date()) - timestamp) / 1000)
  const minutes = seconds / 60
  const hours = minutes / 60
  const days = hours / 24
  const months = days / 30
  const years = days / 365

  if (Math.floor(years) > 1) {
    return `${Math.floor(years)} years ago`
  } else if (Math.floor(months) > 1) {
    return `${Math.floor(months)} months ago`
  } else if (Math.floor(days) > 1) {
    return `${Math.floor(days)} days ago`
  } else if (Math.floor(hours) > 1) {
    return `${Math.floor(hours)} hours ago`
  } else if (Math.floor(minutes) > 1) {
    return `${Math.floor(minutes)} minutes ago`
  }

  return `${Math.floor(seconds)} seconds ago`
}
