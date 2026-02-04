import { Stack, Typography } from '@mui/material'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { useVitalsContext } from '~/context/VitalsContext'

export const Clock = () => {
  const { user } = useAuthContext()
  const [currentTime, setCurrentTime] = useState(dayjs())
  const { setting } = useVitalsContext()

  const isDarkMode = setting.theme === 'dark'
  const timezone = user?.timezone ?? 'UTC'

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().tz(timezone))
    }, 1000)

    return () => clearInterval(interval)
  }, [timezone])

  const time = currentTime.format('h:mm') // Hour:Minute
  const period = currentTime.format('A') // AM/PM
  const dateStr = currentTime.format('dddd, MMM DD') // Weekday, Month Day

  return (
    <Stack alignItems="center" flex={1} justifyContent="center">
      <Stack
        alignItems="baseline"
        direction="row"
        justifyContent="center"
        spacing={0.5}
      >
        <Typography
          sx={{
            color: 'primary.main',
            fontWeight: 'bold',
          }}
          variant="h3"
        >
          {time}
        </Typography>
        <Typography color="primary.main" variant="body1">
          {period}
        </Typography>
      </Stack>
      <Typography
        sx={{
          color: isDarkMode ? 'grey.300' : 'text.secondary',
          fontSize: 'small',
        }}
        variant="body1"
      >
        {dateStr}
      </Typography>
    </Stack>
  )
}
