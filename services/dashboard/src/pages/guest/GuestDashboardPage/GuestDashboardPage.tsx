import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CollectionsBookmarkOutlined } from '@mui/icons-material'
import { Box, Button, Grid, Typography, useMediaQuery } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Stack } from '@mui/system'
import { Pulse } from '@zunou-graphql/core/graphql'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { useGetSavedMessagesQuery } from '@zunou-queries/core/hooks/useGetSavedMessagesQuery'
import { useOrganizationNotificationsQuery } from '@zunou-queries/core/hooks/useOrganizationNotificationsQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleType } from '@zunou-react/types/role'
import { useState } from 'react'

import DashboardNotifications from '~/components/domain/dashboard/DashboardNotifications/DashboardNotifications'
import EmployeePulseCard from '~/components/domain/pulse/EmployeePulseCard/EmployeePulseCard'
import { SavedMessagesDrawer } from '~/components/domain/savedMessages'
import HeaderDecorator from '~/components/ui/HeaderDecorator'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'

// Separate configuration
const ROLE_BUTTONS_CONFIG: Record<
  UserRoleType,
  {
    label: string
    icon: React.ReactNode
    action: string
  }[]
> = {
  Employee: [
    {
      action: 'savedMessages',
      icon: <CollectionsBookmarkOutlined />,
      label: 'Saved',
    },
  ],
  Guest: [],
  Manager: [],
}

// Extract PulsesList into a separate component
const PulsesList = ({ pulses }: { pulses: Pulse[] }) => (
  <Stack>
    <Stack alignItems="center" justifyContent="center" spacing={3}>
      <Typography fontWeight="medium" textAlign="center" variant="h4">
        Your Pulses
      </Typography>
      <HeaderDecorator />
    </Stack>

    <Grid container={true} mt={4} spacing={3}>
      {pulses.map((pulse, index) => (
        <Grid item={true} key={index} lg={4} md={6} sm={6} xs={12}>
          <EmployeePulseCard
            notificationCount={pulse.unread_notifications ?? '0'}
            pulse={pulse}
          />
        </Grid>
      ))}
    </Grid>
  </Stack>
)

const GuestDashboardPage = () => {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const { userRole } = useAuthContext()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()

  const [openPanel, setOpenPanel] = useState<string | null>(null)

  const { data: pulsesData, isFetching: isFetchingPulses } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const { data: savedMessagesData, isFetching: isFetchingSavedMessages } =
    useGetSavedMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!user,
      variables: { userId: user?.id },
    })

  const { data: notificationsData } = useOrganizationNotificationsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId, page: 1 },
  })

  const notifications = notificationsData?.organizationNotifications.data
  const hasNotifications = notifications && notifications.length > 0
  const pulses = pulsesData?.pulses
  const savedMessages = savedMessagesData?.savedMessages.data ?? []

  return (
    <Stack minHeight="100vh" sx={{ position: 'relative' }}>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        padding={2}
      >
        <Stack direction="row" spacing={2}>
          {userRole &&
            ROLE_BUTTONS_CONFIG[userRole].map(
              ({ icon, label, action }, index) => (
                <Button
                  key={index}
                  onClick={() => setOpenPanel(action)}
                  startIcon={icon}
                  sx={{
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                      color: 'common.white',
                    },
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: '20px',
                    color: theme.palette.primary.main,
                    textTransform: 'none',
                  }}
                  variant="outlined"
                >
                  {label}
                </Button>
              ),
            )}
        </Stack>
      </Stack>

      <Stack
        flexGrow={1}
        justifyContent={isSmallScreen ? 'flex-start' : 'center'}
        maxHeight="calc(100vh - 72px)"
        overflow="hidden"
        p={isSmallScreen ? 2 : 4}
        spacing={8}
      >
        {isFetchingPulses ? (
          <LoadingSpinner />
        ) : (
          <Stack direction="row" height="100%" spacing={2}>
            <Box
              sx={{
                height: '100%',
                margin: -1,
                overflow: 'auto',
                width: hasNotifications ? '75%' : '100%',
              }}
            >
              {pulses?.length ? (
                <PulsesList pulses={pulses} />
              ) : (
                <Stack alignItems="center" justifyContent="center" spacing={3}>
                  <Typography
                    fontWeight="medium"
                    textAlign="center"
                    variant="h4"
                  >
                    No{' '}
                    <span
                      style={{
                        color: theme.palette.secondary.main,
                      }}
                    >
                      pulses
                    </span>{' '}
                    have been set up for your account.
                  </Typography>
                  <Typography textAlign="center" variant="body1">
                    Please contact your manager to be added and get started.
                  </Typography>
                </Stack>
              )}
            </Box>

            {hasNotifications && (
              <Stack height="100%" sx={{ overflow: 'hidden' }} width="25%">
                <DashboardNotifications notifications={notifications} />
              </Stack>
            )}
          </Stack>
        )}
      </Stack>

      <SavedMessagesDrawer
        loading={isFetchingSavedMessages}
        onClose={() => setOpenPanel(null)}
        open={openPanel === 'savedMessages'}
        savedMessages={savedMessages}
      />
    </Stack>
  )
}

export default withAuthenticationRequired(GuestDashboardPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
