import { LaptopMac } from '@mui/icons-material'
import { alpha, Stack, Switch } from '@mui/material'
import { useCheckInMutation } from '@zunou-queries/core/hooks/useCheckInMutation'
import { useCheckOutMutation } from '@zunou-queries/core/hooks/useCheckOutMutation'
import { useUserActiveTimesheetQuery } from '@zunou-queries/core/hooks/useUserActiveTimesheetQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

export const AvailabilityToggler = () => {
  const { user, userRole } = useAuthContext()
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  const isManager = userRole === UserRoleEnum.MANAGER

  const { data: activeTimeSheetData, isLoading: isLoadingActiveTimeSheetData } =
    useUserActiveTimesheetQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { userId: user?.id },
    })

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
          // Revert optimistic update on failure
          setIsCheckedIn(previousState)
          toast.error('Failed to check out')
          console.error('Failed to check out. Error: ', error)
        },
        onSuccess: () => toast.success('Checked out successfully'),
      })
    } else {
      checkIn(undefined, {
        onError: (error) => {
          // Revert optimistic update on failure
          setIsCheckedIn(previousState)
          toast.error('Failed to check in')
          console.error('Failed to check in. Error: ', error)
        },
        onSuccess: () => toast.success('Checked in successfully'),
      })
    }
  }

  // Initialize from query data
  useEffect(() => {
    if (!isLoadingActiveTimeSheetData && activeTimeSheetData) {
      setIsCheckedIn(!!activeTimeSheetData?.userActiveTimesheet?.checked_in_at)
    }
  }, [activeTimeSheetData, isLoadingActiveTimeSheetData])

  return (
    <Stack alignItems="center" display="none" gap={1} justifyContent="center">
      <LaptopMac
        sx={{
          color: isCheckedIn ? 'primary.main' : 'text.secondary',
        }}
      />
      {isLoadingActiveTimeSheetData ? (
        <Stack
          alignItems="center"
          height={38}
          justifyContent="center"
          width="100%"
        >
          <LoadingSkeleton
            height={20}
            sx={{
              backgroundColor: isManager
                ? undefined
                : alpha(theme.palette.grey[500], 0.5),
            }}
            variant="rounded"
            width="60%"
          />
        </Stack>
      ) : (
        <Switch
          checked={isCheckedIn}
          color={isManager ? 'primary' : 'secondary'}
          onChange={toggleAvailability}
        />
      )}
    </Stack>
  )
}
