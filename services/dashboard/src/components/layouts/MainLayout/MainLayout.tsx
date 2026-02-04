import { withAuthenticationRequired } from '@auth0/auth0-react'
import {
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from '@mui/icons-material'
import { Box, Icon, Stack, Tooltip } from '@mui/material'
import { Pulse } from '@zunou-graphql/core/graphql'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
// import zunouLogoTransparent from '@zunou-react/assets/images/zunou-icon-white-transparent.svg'
import { Page, PageRightPane } from '@zunou-react/components/layout'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
// import { pathFor } from '@zunou-react/services/Routes'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Outlet } from 'react-router-dom'

// import { FloatingNav } from '~/components/domain/navigation/FloatingNav'
import OrientationWarningModal from '~/components/domain/pulse/OrientationWarningModal'
import ConfirmTimezoneModal from '~/components/domain/vitals/ConfirmTimezoneModal.tsx'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { useSidebarColor } from '~/hooks/useSidebarColor'
// import { Routes } from '~/services/Routes'
import { useLeftMenuStore } from '~/store/useLeftMenuStore'
import { BackgroundColorEnum } from '~/types/background'
import { getPulseIcon } from '~/utils/getPulseIcon'

import { LeftMenuV2, MenuLink } from './components/LeftMenuV2'

const MainLayout = () => {
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const { isExpanded, setIsExpanded } = useLeftMenuStore()
  const [isHoveringMenu, setIsHoveringMenu] = useState(false)

  const { data: orgUserData } = useGetOrganizationUserQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId: user?.id,
    },
  })
  const orgUser = orgUserData?.organizationUser

  const { backgroundColor } = useSidebarColor(orgUser)

  const isInverted = backgroundColor !== BackgroundColorEnum.WHITE

  const { data: pulsesData, isLoading: isPulseDataLoading } = useGetPulsesQuery(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    },
  )

  const pulseLinks =
    pulsesData?.pulses.map((pulse: Pulse) => ({
      baseUrl: `pulse/${pulse.id}`,
      category: pulse.category,
      hasGuest: pulse.hasGuest ?? false,
      icon: <Icon component={getPulseIcon(pulse.icon)} fontSize="small" />,
      label: pulse.name,
      pulseId: pulse.id,
    })) ?? []

  usePusherChannel({
    channelName: organizationId && `calendar-sync.user.${user?.id}`,
    eventName: '.google-calendar-token-revoked',
    onEvent: () =>
      toast.error(
        'Google Calendar refresh token is invalid or expired. Please reconnect your Google Calendar.',
      ),
  })

  // const pathToRecommendedInsights = pathFor({
  //   pathname: Routes.RecommendedInsights,
  //   query: { organizationId },
  // })

  if (!orgUser)
    return (
      <Stack
        alignItems="center"
        height="100vh"
        justifyContent="center"
        width="100%"
      >
        <LoadingSpinner />
      </Stack>
    )

  return (
    <Page>
      {/* <FloatingNav
        logoSrc={zunouLogoTransparent}
        pathTo={pathToRecommendedInsights}
      /> */}
      <Stack
        sx={{ display: 'flex', flexDirection: 'row', position: 'relative' }}
      >
        <Box
          onMouseEnter={() => setIsHoveringMenu(true)}
          onMouseLeave={() => setIsHoveringMenu(false)}
          sx={{ height: '100dvh', overflow: 'visible', position: 'relative' }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              animate={{ width: 'auto' }}
              exit={{ width: isExpanded ? 240 : 80 }}
              initial={{ width: isExpanded ? 80 : 240 }}
              key={isExpanded ? 'expanded' : 'collapsed'}
              style={{ height: '100dvh', overflow: 'hidden' }}
              transition={{
                duration: 0.3,
                ease: 'easeInOut',
              }}
            >
              <LeftMenuV2
                backgroundColor={backgroundColor}
                collapsed={!isExpanded}
                isInverted={isInverted}
                isLoading={isPulseDataLoading}
                links={pulseLinks as MenuLink[]}
              />
            </motion.div>
          </AnimatePresence>

          {/* Toggle button - visible only when hovering over menu */}
          <Tooltip
            disableInteractive={true}
            placement="right"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <Stack
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: '50%',
                boxShadow: '0 0 6px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
                display: 'flex',
                height: 32,
                justifyContent: 'center',
                opacity: isHoveringMenu ? 1 : 0,
                pointerEvents: isHoveringMenu ? 'auto' : 'none',
                position: 'absolute',
                right: -16,
                top: '14%',
                transition: 'opacity 0.2s ease-in-out',
                width: 32,
                zIndex: 50,
              }}
            >
              {isExpanded ? (
                <KeyboardDoubleArrowLeft fontSize="small" />
              ) : (
                <KeyboardDoubleArrowRight fontSize="small" />
              )}
            </Stack>
          </Tooltip>
        </Box>
      </Stack>

      <PageRightPane>
        <Outlet />
      </PageRightPane>
      <ConfirmTimezoneModal />
      <OrientationWarningModal />
    </Page>
  )
}

const MainLayoutWithAuth = withAuthenticationRequired(MainLayout, {
  onRedirecting: () => <div>Signing in...</div>,
})

export { MainLayout, MainLayoutWithAuth }
