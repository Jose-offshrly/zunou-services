import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useEffect, useState } from 'react'

import { CustomModal } from '~/components/ui/CustomModal'
import { isMobileDevice, isPortraitMode } from '~/utils/mobileDeviceUtils'

const OrientationWarningModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenedOnce, setIsOpenedOnce] = useState(false)

  const shouldShowModal = () => {
    if (isOpenedOnce) return false
    return isMobileDevice() && isPortraitMode()
  }

  useEffect(() => {
    // Initial check
    const shouldShow = shouldShowModal()
    if (shouldShow) {
      setIsOpen(true)
      setIsOpenedOnce(true)
    }

    // Listen for orientation changes
    const handleOrientationChange = () => {
      const shouldShow = shouldShowModal()
      if (shouldShow) {
        setIsOpen(true)
        setIsOpenedOnce(true)
      } else {
        setIsOpen(false)
      }
    }

    // Listen for both resize and orientation change events
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [isOpenedOnce])

  return (
    <CustomModal
      isOpen={isOpen}
      maxWidth={600}
      minWidth={0}
      onClose={() => setIsOpen(false)}
      title="Rotate Your Device"
    >
      <Stack gap={2} width="100%">
        <Typography>
          For the best experience, please rotate your device to{' '}
          <Typography component="span" fontWeight="bold">
            landscape
          </Typography>{' '}
          mode.
        </Typography>{' '}
        <Stack>
          This will give you more space to work with all the features.
        </Stack>
      </Stack>
    </CustomModal>
  )
}

export default OrientationWarningModal
