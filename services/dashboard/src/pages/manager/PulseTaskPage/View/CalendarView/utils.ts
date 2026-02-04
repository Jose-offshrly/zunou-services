import { format } from 'date-fns'

import { TimelineItem } from '../../types/types'

export const HOUR_HEIGHT = 100 // pixels per hour
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const formatTime = (date: Date): string => {
  const hour = date.getHours()
  const minute = date.getMinutes()
  const hourStr = hour === 0 ? '12' : hour > 12 ? `${hour - 12}` : `${hour}`
  const period = hour < 12 ? 'AM' : 'PM'
  if (minute === 0) {
    return `${hourStr} ${period}`
  }
  return `${hourStr}:${minute.toString().padStart(2, '0')}${period}`
}

export const formatHour = (hour: number): string => {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

export const getStatusColor = (item: TimelineItem) => {
  if (item.color) return item.color

  switch (item.status) {
    case 'completed':
      return '#4CAF50'
    case 'in-progress':
      return '#2196F3'
    case 'blocked':
      return '#f44336'
    case 'on-hold':
      return '#FF9800'
    default:
      return '#9E9E9E'
  }
}

export const groupItemsByDate = (
  items: TimelineItem[],
): Map<string, TimelineItem[]> => {
  const map = new Map<string, TimelineItem[]>()

  items.forEach((item) => {
    if (
      !item.startDate ||
      !(item.startDate instanceof Date) ||
      isNaN(item.startDate.getTime())
    )
      return

    // Add to start date
    const startKey = format(item.startDate, 'yyyy-MM-dd')
    if (!map.has(startKey)) map.set(startKey, [])
    map.get(startKey)!.push(item)

    // Add to end date if different from start
    const endKey =
      item.endDate &&
      item.endDate instanceof Date &&
      !isNaN(item.endDate.getTime())
        ? format(item.endDate, 'yyyy-MM-dd')
        : null
    if (endKey && endKey !== startKey) {
      if (!map.has(endKey)) map.set(endKey, [])
      // Only add if not already there
      if (!map.get(endKey)!.some((i) => i.id === item.id)) {
        map.get(endKey)!.push(item)
      }
    }
  })

  return map
}
