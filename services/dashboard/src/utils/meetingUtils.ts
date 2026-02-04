import { MeetingSessionStatus } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import dayjs, { Dayjs } from 'dayjs'

export const getMeetingStatus = ({
  timezone,
  start,
  end,
}: {
  timezone: string
  start: Dayjs
  end: Dayjs
}) => {
  const now = dayjs().tz(timezone)

  if (now.isBetween(start, end, undefined, '[]')) {
    return {
      bgColor: theme.palette.common.pastelGreen,
      label: 'Happening now',
      status: MeetingSessionStatus.Active,
      textColor: theme.palette.common.lime,
    }
  }

  if (now.isBefore(start)) {
    const diffMins = start.diff(now, 'minutes')
    const diffHours = start.diff(now, 'hours')
    const diffDays = start.diff(now, 'days')

    if (diffDays > 0) {
      return {
        bgColor: theme.palette.grey[200],
        label: `Happening in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
        status: MeetingSessionStatus.Inactive,
        textColor: theme.palette.text.secondary,
      }
    } else if (diffHours > 0) {
      return {
        bgColor: theme.palette.common.cream,
        label: `Happening in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`,
        status: MeetingSessionStatus.Inactive,
        textColor: theme.palette.text.secondary,
      }
    } else {
      return {
        bgColor: theme.palette.common.pink,
        label: `Happening in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`,
        status: MeetingSessionStatus.Inactive,
        textColor: theme.palette.error.main,
      }
    }
  }

  return {
    bgColor: theme.palette.grey[200],
    label: 'Meeting Finished',
    status: MeetingSessionStatus.Ended,
    textColor: theme.palette.text.secondary,
  }
}
