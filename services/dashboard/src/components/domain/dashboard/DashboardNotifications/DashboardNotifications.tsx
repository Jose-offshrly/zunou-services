import { alpha, Stack, Typography } from '@mui/material'
import { Notification } from '@zunou-graphql/core/graphql'
import { useState } from 'react'

import { DashboardNotificationCard } from '~/components/domain/dashboard/DashboardNotificationCard/DashboardNotificationCard'
import { NotificationModal } from '~/components/domain/dashboard/DashboardNotificationModal/DashboardNotificationModal'

interface DashboardNotificationsProps {
  notifications: Notification[]
}

const DashboardNotifications = ({
  notifications,
}: DashboardNotificationsProps) => {
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null)

  const handleClose = () => {
    setSelectedNotification(null)
  }

  return (
    <Stack
      bgcolor="white"
      border={1}
      borderColor={(theme) => alpha(theme.palette.primary.main, 0.1)}
      borderRadius={2}
      gap={1}
      height="100%"
      overflow="auto"
      p={2}
    >
      <Typography fontSize={24} fontWeight="bold" gutterBottom={true}>
        Notifications
      </Typography>
      {notifications?.map((notification, index) => (
        <Stack flexShrink={0} key={index}>
          <DashboardNotificationCard notification={notification} />
        </Stack>
      ))}
      {selectedNotification && (
        <NotificationModal
          isOpen={false} // Temporarily disabled
          notification={selectedNotification}
          onClose={handleClose}
        />
      )}
    </Stack>
  )
}

export default DashboardNotifications
