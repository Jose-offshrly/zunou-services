import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { VitalsCustomModalWithSubmit } from '~/components/ui/VitalsCustomModalWithSubmit'
import { useOrganization } from '~/hooks/useOrganization'

type status = 'allowed' | 'denied'

const ConfirmTimezoneModal = () => {
  const { t } = useTranslation('vitals')
  const { user, refetchUser, isLoading } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const [isOpen, setOpen] = useState(false)

  const { mutateAsync: updateMe, isPending: isUpdateMePending } =
    useUpdateMeMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const queryClient = useQueryClient()

  const userTimezone = user?.timezone ?? 'UTC'
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Storage key with user ID to store per user
  const storageKey = `timezone_mismatch_${user?.id || 'unknown'}`

  // Create timezone pair key for consistent comparison
  const createTimezoneKey = (userTz: string, browserTz: string) =>
    `${userTz}|${browserTz}`
  const currentTimezoneKey = createTimezoneKey(userTimezone, browserTimezone)

  // Check if we should show the modal
  const shouldShowModal = () => {
    // Don't show if timezones match
    if (userTimezone === browserTimezone) return false

    if (!user?.id) return false

    try {
      const stored = localStorage.getItem(storageKey)

      // INITIAL USE: Show if no record exists for this user and there's a timezone mismatch
      if (!stored) {
        return true
      }

      const { timezoneKey } = JSON.parse(stored)

      // If the timezone pair has changed from what we stored, show modal
      if (timezoneKey !== currentTimezoneKey) {
        return true
      }

      // If same timezone pair but status is 'denied', don't show
      // If status is 'allowed', we wouldn't reach here since timezones would match
      return false
    } catch (error) {
      toast.error(t('read_tz_storage_error'))
      console.error('Error reading timezone modal storage:', error)
      return true // Show on error to be safe
    }
  }

  // Handle modal actions
  const handleUpdateTimezone = async () => {
    try {
      await updateMe({
        lastOrganizationId: organizationId,
        timezone: browserTimezone,
      })
      await refetchUser()

      // Invalidate all visible data to update datetime
      queryClient.invalidateQueries({ exact: false, queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['teamMessages', pulseId] })
      queryClient.invalidateQueries({
        queryKey: ['dataSources', organizationId, pulseId],
      })

      // Store as allowed (though this pair won't show modal again since they'd match)
      storeTimezoneDecision('allowed')
      setOpen(false)

      toast.success(t('timezone_update_success'))
    } catch (error) {
      console.error('Error updating timezone:', error)
      toast.error(t('timezone_update_error'))
    }
  }

  const handleDontChange = () => {
    // User chose to keep the mismatch - store as denied/allowed mismatch
    storeTimezoneDecision('denied')
    setOpen(false)
  }

  const storeTimezoneDecision = (status: status) => {
    try {
      const timezoneRecord = {
        browserTimezone,
        status,
        timezoneKey: currentTimezoneKey,
        updatedAt: new Date().toISOString(),
        // 'allowed' or 'denied'
        userId: user?.id,

        userTimezone,
      }

      localStorage.setItem(storageKey, JSON.stringify(timezoneRecord))
    } catch (error) {
      toast.error(t('save_tz_error'))
      console.error('Error saving timezone decision:', error)
    }
  }

  // Check on mount
  useEffect(
    () => {
      if (!user?.id) return // Wait for user to be loaded

      const checkTimezone = () => {
        if (shouldShowModal()) {
          setOpen(true)
        }
      }

      // Check immediately
      checkTimezone()

      // Check every 30 minutes for timezone changes
      const interval = setInterval(checkTimezone, 30 * 60 * 1000)

      return () => clearInterval(interval)
    },
    [
      // user?.id, userTimezone, browserTimezone
    ],
  )

  // Clean up old/invalid entries for this user (optional housekeeping)
  useEffect(() => {
    if (!user?.id) return

    try {
      // Clean up entries that might be malformed
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith('timezone_mismatch_'),
      )

      keys.forEach((key) => {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            // Remove if missing required fields
            if (!parsed.timezoneKey || !parsed.status) {
              localStorage.removeItem(key)
            }
          }
        } catch (e) {
          // Remove malformed entries
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      toast.error(t('tz_storage_cleanup_error'))
      console.error('Error cleaning up timezone storage:', error)
    }
  }, [user?.id])

  if (!isOpen || userTimezone === browserTimezone) {
    return null
  }

  return (
    <VitalsCustomModalWithSubmit
      disabledSubmit={isUpdateMePending || isLoading}
      isOpen={true}
      isSubmitting={isUpdateMePending}
      onCancel={handleDontChange}
      onClose={handleDontChange}
      onSubmit={handleUpdateTimezone}
      submitText={t('change_tz')}
      title={t('tz_mismatch')}
    >
      <Stack gap={2}>
        <Typography
          color="text.secondary"
          variant="body2"
        >{`Your current device timezone (${browserTimezone}) is different from your organization settings (${userTimezone}).`}</Typography>

        <Typography color="text.secondary" variant="body2">
          {t('update_tz_description')}
        </Typography>
      </Stack>
    </VitalsCustomModalWithSubmit>
  )
}

export default ConfirmTimezoneModal
