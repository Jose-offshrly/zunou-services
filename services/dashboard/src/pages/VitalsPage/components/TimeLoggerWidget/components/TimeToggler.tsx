import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { alpha, Box, Stack, ToggleButton, Typography } from '@mui/material'
import { useCheckInMutation } from '@zunou-queries/core/hooks/useCheckInMutation'
import { useCheckOutMutation } from '@zunou-queries/core/hooks/useCheckOutMutation'
import { useUserActiveTimesheetQuery } from '@zunou-queries/core/hooks/useUserActiveTimesheetQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { useVitalsContext } from '~/context/VitalsContext'

import { PresenceToggler } from './PresenceToggler'

dayjs.extend(duration)

export const TimeToggler = () => {
  const { t } = useTranslation('vitals')
  const { user } = useAuthContext()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [formattedTime, setFormattedTime] = useState<string>('00:00:00')
  const { setting } = useVitalsContext()
  const timezone = user?.timezone ?? 'UTC'
  const isDarkMode = setting.theme === 'dark'

  const { data: activeTimeSheetData, isLoading: isLoadingActiveTimeSheetData } =
    useUserActiveTimesheetQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { userId: user?.id },
    })
  const activeTimeSheet = activeTimeSheetData?.userActiveTimesheet

  const { mutate: checkIn } = useCheckInMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { mutate: checkOut } = useCheckOutMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const toggleAvailability = () => {
    const previousState = isCheckedIn
    setIsCheckedIn(!isCheckedIn)

    if (isCheckedIn) {
      checkOut(undefined, {
        onError: (error) => {
          setIsCheckedIn(previousState)
          toast.error(t('check_out_error'))
          console.error('Failed to check out. Error: ', error)
        },
        onSuccess: () => toast.success(t('check_out_success')),
      })
    } else {
      checkIn(undefined, {
        onError: (error) => {
          setIsCheckedIn(previousState)
          toast.error(t('check_in_error'))
          console.error('Failed to check in. Error: ', error)
        },
        onSuccess: () => {
          toast.success(t('check_in_success'))
        },
      })
    }
  }

  useEffect(() => {
    if (!activeTimeSheet) return

    const checkedInAt = dayjs
      .utc(activeTimeSheet.checked_in_at)
      .tz(timezone)
      .valueOf()

    const initialTotal = dayjs
      .duration(activeTimeSheet.total ?? 0, 'hours')
      .asSeconds()

    const formatTimeDisplay = (totalSeconds: number) => {
      const duration = dayjs.duration(totalSeconds, 'seconds')
      return [
        String(Math.floor(duration.asHours())).padStart(2, '0'),
        String(duration.minutes()).padStart(2, '0'),
        String(duration.seconds()).padStart(2, '0'),
      ].join(':')
    }

    const calculateTotalTime = () => {
      const currentTime = dayjs().tz(timezone).valueOf()
      const elapsedSeconds = Math.floor((currentTime - checkedInAt) / 1000)
      const totalSeconds = initialTotal + elapsedSeconds
      return Math.max(0, totalSeconds)
    }

    const intervalId = setInterval(() => {
      const totalSeconds = calculateTotalTime()

      setFormattedTime(formatTimeDisplay(totalSeconds))
    }, 1000)

    setFormattedTime(formatTimeDisplay(calculateTotalTime()))

    return () => clearInterval(intervalId)
  }, [activeTimeSheet, timezone])

  useEffect(() => {
    if (!isLoadingActiveTimeSheetData && activeTimeSheetData) {
      setIsCheckedIn(!!activeTimeSheetData?.userActiveTimesheet?.checked_in_at)
    }
  }, [activeTimeSheetData, isLoadingActiveTimeSheetData])

  return (
    <Stack alignItems="center" justifyContent="center" spacing={1} width="100%">
      <Box
        sx={{
          borderRadius: 44,
          height: 88,
          maxWidth: 288,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <ToggleButton
          onChange={toggleAvailability}
          selected={isCheckedIn}
          sx={{
            border: 'none',
            height: '100%',
            inset: 0,
            position: 'absolute',
            textTransform: 'none',
            width: '100%',
            zIndex: 2,
          }}
          value="check"
        />
        <Box
          onClick={toggleAvailability}
          sx={{
            alignItems: 'center',
            backgroundColor: isDarkMode ? 'grey.900' : 'common.white',
            borderRadius: '50%',
            boxShadow: isDarkMode
              ? '0px 2px 8px rgba(0,0,0,0.5)'
              : '0px 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            height: 64,
            justifyContent: 'center',
            left: isCheckedIn ? 'calc(100% - 80px)' : '16px',
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            transition: 'left 0.5s ease',
            width: 64,
            zIndex: 4,
          }}
        >
          {isCheckedIn ? (
            <ArrowBackIcon sx={{ color: 'secondary.main' }} />
          ) : (
            <ArrowForwardIcon
              sx={{
                color: isDarkMode ? 'grey.300' : 'text.primary',
              }}
            />
          )}
        </Box>
        {isCheckedIn && (
          <Typography
            sx={{
              color: 'common.white',
              left: '40px',
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 5,
            }}
            variant="subtitle2"
          >
            In {formattedTime} s
          </Typography>
        )}
        <Box
          sx={{
            background: `url(/checkin-slider-bg.svg)`,
            backgroundColor: (theme) =>
              alpha(theme.palette.secondary.main, isDarkMode ? 0.4 : 0.3),
            backgroundSize: 'cover',
            inset: 0,
            opacity: isCheckedIn ? 1 : 0,
            position: 'absolute',
            transform: isCheckedIn ? 'translateY(0%)' : 'translateY(-100%)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            background: `url(/checkout-slider-bg.svg)`,
            backgroundColor: (theme) =>
              alpha(
                isDarkMode ? theme.palette.grey[800] : theme.palette.grey[400],
                isDarkMode ? 0.6 : 0.3,
              ),
            backgroundSize: 'cover',
            inset: 0,
            opacity: isCheckedIn ? 0 : 1,
            position: 'absolute',
            transform: isCheckedIn ? 'translateY(100%)' : 'translateY(0%)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            zIndex: 0,
          }}
        />
      </Box>

      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          height: 32,
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {isCheckedIn && <PresenceToggler />}
      </Box>
    </Stack>
  )
}
