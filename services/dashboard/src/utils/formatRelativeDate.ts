import dayjs from 'dayjs'

export const formatRelativeDate = (date: string) => {
  const today = dayjs().startOf('day')
  const targetDate = dayjs(date).startOf('day')

  const diffDays = today.diff(targetDate, 'days')

  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else {
    return `Previous 7 days`
  }
}
