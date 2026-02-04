import { Stack } from '@mui/system'
import {
  Notification,
  NotificationKind,
  PulseCategory,
  PulseMemberRole,
} from '@zunou-graphql/core/graphql'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'

import { DataSourceSidebar } from '~/components/domain/dataSource'
import BrainDumpModal from '~/components/domain/pulse/BrainDumpModal'
import { PulseFeedDrawer } from '~/components/domain/pulse/PulseFeedDrawer'
import PulseMeetingsModal from '~/components/domain/pulse/PulseMeetingsModal'
import PulseNavbar from '~/components/domain/pulse/PulseNavbar'
import PulseNotifications from '~/components/domain/pulse/PulseNotifications'
import { PulseStrategiesDrawer } from '~/components/domain/pulse/PulseStrategiesDrawer'
import { SavedMessagesDrawer } from '~/components/domain/savedMessages'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { LiveMeetingsProvider } from '~/context/LiveMeetingsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { useOrganizationGroups } from '~/hooks/useOrganizationGroups'
import { Routes } from '~/services/Routes'
import { ShowPulseWelcomeState, usePulseStore } from '~/store/usePulseStore'

import { useHooks } from './hooks'

export const PulseLayout = () => {
  useOrganizationGroups()
  const navigate = useNavigate()
  const location = useLocation()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()

  const {
    isFetchingSavedMessages,
    isLoading,
    isLoadingNotifs,
    notifications,
    panels,
    pendingNotificationCount,
    pulseMembership,
    savedMessages,
    strategiesData,
    togglePanel,
    user,
    isBrainDumpModalOpen,
    setIsBrainDumpModalOpen,
  } = useHooks()

  const { pulseWelcomeState, setPulseWelcomeState, pulseCategory } =
    usePulseStore()

  // Close the welcome message in pulse chat if open
  const closeWelcomeMessage = () => {
    if (!pulseId) return

    const updatedWelcomeState = [...pulseWelcomeState]

    const pulse = updatedWelcomeState.find((pulse) => pulse.pulseId === pulseId)

    if (pulse)
      setPulseWelcomeState(
        updatedWelcomeState.map((pulse) =>
          pulse.pulseId === pulseId
            ? { ...pulse, state: ShowPulseWelcomeState.Hidden }
            : pulse,
        ),
      )
    else {
      updatedWelcomeState.push({
        initialData: null,
        pulseId,
        state: ShowPulseWelcomeState.Hidden,
      })

      setPulseWelcomeState(updatedWelcomeState)
    }
  }

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      const taskId = notification.context?.taskId
      const notificationPulseId = notification.pulse?.id

      switch (notification.kind) {
        case NotificationKind.AssigneeCreated:
          navigate(
            pathFor({
              pathname: Routes.PulseTasks,
              query: {
                id: taskId,
                organizationId,
                pulseId: notificationPulseId,
              },
            }),
          )

          togglePanel('notifications')
          break
        case NotificationKind.ChatMention:
          navigate(
            pathFor({
              pathname: Routes.PulseTeamChat,
              query: { organizationId, pulseId: notificationPulseId },
            }),
          )

          togglePanel('notifications')
          break
        case NotificationKind.SummaryOption:
        case NotificationKind.Information:
        case NotificationKind.Survey:
        default:
          navigate(
            pathFor({
              pathname: Routes.PulseDetail,
              query: { organizationId, pulseId: notificationPulseId },
            }),
            { state: { scrollToBottom: true } },
          )
          closeWelcomeMessage()
          break
      }
    },
    [navigate, organizationId, pulseId],
  )

  const isPersonalPulse = pulseCategory === PulseCategory.Personal
  const isTasksPage = location.pathname.endsWith('/tasks')

  return (
    <LiveMeetingsProvider>
      <Stack height="100vh" minHeight="100vh">
        {!user || isLoading || !pulseMembership ? (
          <Stack alignItems="center" height="100%" justifyContent="center">
            <LoadingSpinner />
          </Stack>
        ) : (
          <Stack
            direction="row"
            flexGrow={1}
            height="100%"
            justifyContent="space-between"
            overflow="hidden"
          >
            <Stack
              direction="column"
              flexGrow={1}
              height="100%"
              overflow="hidden"
              position="relative"
              sx={{ isolation: 'isolate' }}
            >
              {!(isPersonalPulse && isTasksPage) && (
                <PulseNavbar
                  isNotificationsOpen={panels.notifications}
                  onNotificationToggle={() => {
                    togglePanel('notifications')
                  }}
                  openContentDrawer={() => togglePanel('content')}
                  openFeedDrawer={() => togglePanel('feed')}
                  openMeetingsDrawer={() => togglePanel('meetings')}
                  openSavedChat={() => togglePanel('savedMessages')}
                  openStrategiesDrawer={() => togglePanel('strategies')}
                  pendingNotificationCount={pendingNotificationCount}
                  savedMessagesCount={savedMessages.length}
                />
              )}
              <PulseNotifications
                isLoading={isLoadingNotifs}
                notifications={notifications}
                onClose={() => togglePanel('notifications')}
                onNotificationClick={handleNotificationClick}
                open={panels.notifications}
              />
              <Outlet key={location.pathname} />
            </Stack>
          </Stack>
        )}
        {pulseMembership?.role === PulseMemberRole.Owner ||
        pulseMembership?.role === PulseMemberRole.Admin ? (
          <DataSourceSidebar
            onClose={() => togglePanel('content')}
            open={panels.content}
          />
        ) : null}

        <BrainDumpModal
          isOpen={isBrainDumpModalOpen}
          onClose={() => setIsBrainDumpModalOpen(false)}
        />

        <PulseMeetingsModal
          onClose={() => togglePanel('meetings')}
          open={panels.meetings}
        />
        <PulseFeedDrawer
          onClose={() => togglePanel('feed')}
          open={panels.feed}
        />
        <PulseStrategiesDrawer
          onClose={() => togglePanel('strategies')}
          open={panels.strategies}
          strategies={strategiesData?.strategies ?? {}}
        />
        <SavedMessagesDrawer
          loading={isFetchingSavedMessages}
          onClose={() => togglePanel('savedMessages')}
          open={panels.savedMessages}
          savedMessages={savedMessages}
        />
      </Stack>
    </LiveMeetingsProvider>
  )
}
