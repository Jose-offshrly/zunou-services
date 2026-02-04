import { Close } from '@mui/icons-material'
import { Divider, IconButton, Slide, Stack, Typography } from '@mui/material'
import { Notification, PulseCategory } from '@zunou-graphql/core/graphql'
import { useClearNotificationsMutation } from '@zunou-queries/core/hooks/useClearNotificationsMutation'
import { useClearOrganizationNotificationsMutation } from '@zunou-queries/core/hooks/useClearOrganizationNotifications'
import { Button } from '@zunou-react/components/form'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { PulseNotificationCard } from '~/components/domain/pulse/PulseNotificationCard'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useHooks } from '~/pages/manager/PulseDetailPage/hooks'
import { usePulseStore } from '~/store/usePulseStore'

interface PulseNotificationsProps {
  isLoading?: boolean
  open: boolean
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onClose?: () => void
}

const PulseNotifications = ({
  isLoading,
  open,
  notifications,
  onNotificationClick,
  onClose,
}: PulseNotificationsProps) => {
  const { t } = useTranslation('pulse')
  const { pulseId } = useParams()
  const { activeThreadId } = useHooks()
  const { organizationId } = useParams() as { organizationId: string }
  const { pulse } = usePulseStore()

  const containerRef = useRef<HTMLDivElement>(null)

  const isPersonalPulse = pulse?.category === PulseCategory.Personal

  // this clears only notifications for a specific pulse
  const { mutate: clearPulseNotifications, isPending: isClearingPulse } =
    useClearNotificationsMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      pulseId: pulseId,
    })

  // clears all notifications from all pulses
  const { mutate: clearOrgNotifications, isPending: isClearingOrg } =
    useClearOrganizationNotificationsMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      organizationId: organizationId,
    })

  const isClearing = isClearingOrg || isClearingPulse

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement
        const isNotificationButton = target.closest(
          '[data-notification-button]',
        )

        if (!isNotificationButton) {
          onClose?.()
        }
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  const handleClearAll = () => {
    if (notifications.length === 0 || isClearing) return

    if (isPersonalPulse) {
      clearOrgNotifications()
    } else {
      clearPulseNotifications()
    }
  }

  return (
    <Slide direction="left" in={open} mountOnEnter={true} unmountOnExit={true}>
      <Stack
        bgcolor="common.white"
        boxSizing="border-box"
        height="100vh"
        justifyContent="flex-start"
        maxWidth={320}
        minHeight={120}
        p={3}
        position="absolute"
        ref={containerRef}
        right={0}
        spacing={1}
        sx={{ boxShadow: '-2px 0px 6px 0px rgba(0, 0, 0, 0.08)' }}
        top={0}
        width={320}
        zIndex={1100}
      >
        {/* Modal Header */}
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography color={'text.primary'} fontWeight={'fontWeightMedium'}>
            Notifications
          </Typography>
          <IconButton aria-label="close" onClick={onClose}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        <Divider variant="middle" />

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 16,
              fontWeight: 500,
              px: 2,
              textAlign: 'center',
            }}
          >
            {t('feed_up_to_date_message')}
          </Typography>
        ) : (
          <>
            <Button
              disabled={isClearing}
              onClick={handleClearAll}
              sx={{ alignSelf: 'end', color: 'text.secondary' }}
              variant="text"
            >
              Clear All
            </Button>
            {isLoading && notifications.length > 0 && open ? (
              <LoadingSkeleton height={80} width="100%" />
            ) : (
              <Stack
                spacing={1}
                sx={{
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  flexGrow: 1,
                  msOverflowStyle: 'none',
                  overflowY: 'auto',
                  scrollbarWidth: 'none',
                }}
              >
                {notifications.map((notification) => (
                  <Stack flexShrink={0} key={notification.id}>
                    <PulseNotificationCard
                      notification={notification}
                      onNotificationClick={onNotificationClick}
                      threadId={activeThreadId ?? undefined}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Slide>
  )
}

export default PulseNotifications
