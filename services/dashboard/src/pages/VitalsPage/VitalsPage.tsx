import { withAuthenticationRequired } from '@auth0/auth0-react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { Add } from '@mui/icons-material'
import { Box, Fab, Grid, Stack } from '@mui/material'
import {
  OrganizationUserRole,
  Pulse,
  SettingMode,
} from '@zunou-graphql/core/graphql'
import { useGetDirectMessagesQuery } from '@zunou-queries/core/hooks/useGetDirectMessagesQuery'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { motion } from 'framer-motion'
import _ from 'lodash'
import React, { useMemo } from 'react'

import ConfirmTimezoneModal from '~/components/domain/vitals/ConfirmTimezoneModal.tsx'
import { Header } from '~/components/domain/vitals/header'
import {
  WidgetKeysEnum,
  WidgetsDrawer,
} from '~/components/domain/vitals/widgets'
import { Draggable } from '~/components/domain/vitals/widgets/Widget/Draggable/Dragabble'
import { Droppable } from '~/components/domain/vitals/widgets/Widget/Droppable/Droppable'
import WidgetWrapper from '~/components/domain/vitals/widgets/WidgetWrapper/WidgetWrapper'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePusherContext } from '~/context/PusherContext'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'

import { ActiveMeetingsWidget } from './components/ActiveMeetingsWidget'
// import { DMChatWidget } from './components/DMChatWidget'
import { EmployeeActivityWidget } from './components/EmployeeActivityWidget'
import { NotificationsWidget } from './components/NotificationsWidget'
import NoWidgets from './components/NoWidgets'
import { OrgTimeLogsWidget } from './components/OrgTimeLogsWidget'
import { PulsesWidget } from './components/PulsesWidget'
import { SavedMessagesWidget } from './components/SavedMessagesWidget'
import TasksWidget from './components/TasksWidget'
import TeamChatWidget from './components/TeamChatWidget'
import { TimeLoggerWidget } from './components/TimeLoggerWidget'
import { useHooks } from './useHooks'

const VitalsPageContent = () => {
  const {
    widgets,
    setWidgets,
    isWidgetsDraftMode,
    setWidgetsDraftMode,
    background,
    updateWidgetColumn,
    setWidgetsOrderUpdates,
    setting,
    selectedBgDraft,
    isSettingDraftMode,
    showLoader,
  } = useVitalsContext()

  const {
    widgetsData,
    isLoadingWidgets,
    settingData,
    isLoadingSetting,
    isLoadingBackgrounds,
    applyingWidgets,
  } = useHooks()

  const { user } = useAuthContext()
  const { organizationId } = useOrganization()

  const { usePusherNotification } = usePusherContext()

  const isGuest =
    user?.organizationUsers.data.find(
      (orgUser) => orgUser.organizationId === organizationId,
    )?.role === OrganizationUserRole.Guest

  // Direct messages
  const { data: directMessages } = useGetDirectMessagesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    organizationId,
  })

  const directMessageIds = directMessages?.map((thread) => thread.id) ?? []

  // Memoize channelIds and eventNames for direct messages
  const directChannelIds = useMemo(() => directMessageIds, [directMessageIds])
  const directEventNames = useMemo(() => ['.direct-message-sent'], [])

  usePusherNotification({
    channelIds: directChannelIds,
    eventNames: directEventNames,
    type: 'direct',
  })

  // Team messages
  const { data } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const pulseIds: string[] = data?.pulses?.map((pulse: Pulse) => pulse.id) ?? []

  // Memoize channelIds and eventNames for team messages
  const teamChannelIds = useMemo(() => pulseIds, [pulseIds])
  const teamEventNames = useMemo(() => ['.pulse-message-sent'], [])

  usePusherNotification({
    channelIds: teamChannelIds,
    eventNames: teamEventNames,
    type: 'team',
  })

  const widgetContainerBg =
    background && setting.mode === SettingMode.Image
      ? 'rgba(255, 255, 255, 0.1)'
      : setting?.theme === 'dark'
        ? theme.palette.grey[900]
        : 'white'

  const backgroundColor =
    setting.mode === SettingMode.Color
      ? setting?.color ?? theme.palette.primary.main
      : setting?.color

  const backgroundImage =
    setting.mode === SettingMode.Image
      ? isSettingDraftMode && selectedBgDraft
        ? `url(${selectedBgDraft?.image_url})`
        : `url(${background?.image_url})`
      : 'none'

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Minimum drag distance to start dragging
      },
    }),
  )

  const handleEditWidgets = () => {
    setWidgetsDraftMode(!isWidgetsDraftMode)
  }

  const onDragStart = (event: DragStartEvent) => {
    console.log(event.active)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Instead of using arrayMove, directly reorder based on the rect strategy
      const updatedWidgets = widgets.slice() // Create a copy
      const oldIndex = updatedWidgets.findIndex(
        (widget) => widget.name === active.id,
      )
      const newIndex = updatedWidgets.findIndex(
        (widget) => widget.name === over.id,
      )

      // Remove the dragged item from its original position
      const [removedWidget] = updatedWidgets.splice(oldIndex, 1)

      // Insert the widget at the new position
      updatedWidgets.splice(newIndex, 0, removedWidget)

      // Update orders for all widgets
      const reorderedWidgets = updatedWidgets.map((widget, index) => ({
        ...widget,
        order: `${index + 1}`,
      }))

      // Update state and persist changes
      setWidgetsOrderUpdates(
        reorderedWidgets.map((widget) => ({
          order: widget.order,
          widgetId: widget.id,
        })),
      )
      setWidgets(reorderedWidgets)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderWidget = (
    widgetName: WidgetKeysEnum | 'happening-now' | 'ping-board',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: any,
  ) => {
    switch (widgetName) {
      case WidgetKeysEnum.EmployeeActivity:
        return <EmployeeActivityWidget {...props} />
      case WidgetKeysEnum.ActiveMeetings:
        return <ActiveMeetingsWidget {...props} />
      case WidgetKeysEnum.Notifications:
        return <NotificationsWidget {...props} />
      case WidgetKeysEnum.Pulses:
        return <PulsesWidget {...props} />
      case WidgetKeysEnum.Saved:
        return <SavedMessagesWidget {...props} />
      case WidgetKeysEnum.TimeLogger:
        return <TimeLoggerWidget {...props} />
      // case WidgetKeysEnum.DMChat:
      //   return <DMChatWidget {...props} />
      case WidgetKeysEnum.TeamChat:
        return <TeamChatWidget {...props} />
      case WidgetKeysEnum.Tasks:
        return <TasksWidget {...props} />
      case WidgetKeysEnum.OrgTimeLogsWidget:
        return <OrgTimeLogsWidget {...props} />
      default:
        return null
    }
  }

  const activeWidgetIds = widgets.map((widget) => widget.name)

  if (
    showLoader ||
    ((isLoadingWidgets || isLoadingSetting || isLoadingBackgrounds || !user) &&
      !settingData &&
      !widgetsData)
  )
    return (
      <Stack
        alignItems="center"
        bgcolor={theme.palette.primary.main}
        height="100vh"
        justifyContent="center"
        width="100vw"
      >
        <LoadingSpinner color={theme.palette.primary.contrastText} size={30} />
      </Stack>
    )

  return (
    <Stack
      sx={{
        backgroundAttachment: 'fixed',
        backgroundColor: backgroundColor,
        backgroundImage: backgroundImage,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        px: 4,
        py: 2,
        spacing: 3,
      }}
    >
      <Header isGuest={isGuest} onEditWidgets={handleEditWidgets} />
      <Stack
        sx={{
          '&::-webkit-scrollbar': {
            background: 'transparent',
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundClip: 'content-box',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            border: '2px solid transparent',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          borderRadius: 3,
          flex: 1,
          marginTop: 1,
          marginX: 0,
          overflow: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
          scrollbarWidth: 'thin',
        }}
      >
        {/* Don't show empty state unless cached data is also empty*/}
        {(_.isEqual(widgets, widgetsData?.widgets) ||
          isWidgetsDraftMode ||
          applyingWidgets) && (
          <Stack
            borderRadius={3}
            marginBottom={10}
            marginTop={2}
            padding={2}
            sx={{
              // Use darker bg if empty
              backgroundColor:
                widgets.length === 0
                  ? 'rgba(41, 40, 40, 0.5)'
                  : widgetContainerBg,
              border: 1,
              borderColor: 'divider',
              position: 'relative',
            }}
          >
            {widgets.length === 0 && !isLoadingWidgets ? (
              <NoWidgets isGuest={isGuest} />
            ) : (
              <WidgetWrapper>
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  onDragStart={onDragStart}
                  sensors={sensors}
                >
                  <SortableContext
                    items={activeWidgetIds}
                    strategy={rectSortingStrategy}
                  >
                    <Grid
                      container={true}
                      spacing={1}
                      sx={{
                        maxWidth: '100%',
                        transition: 'all 0.3s ease-in-out',
                      }}
                    >
                      {widgets.map(({ id, name, columns }) => {
                        return (
                          <Grid
                            animate={{ opacity: 1, y: 0 }}
                            component={motion.div}
                            exit={{ opacity: 0, y: -20 }}
                            initial={{ opacity: 0, y: 20 }}
                            item={true}
                            key={name}
                            layout={true}
                            lg={(Number(columns) || 1) > 1 ? 6 : 3}
                            md={(Number(columns) || 1) > 1 ? 8 : 4}
                            sm={(Number(columns) || 1) > 1 ? 12 : 6}
                            sx={{ transition: 'all 0.3s ease-in-out' }}
                            xs={12}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                transition: 'all 0.3s ease-in-out',
                              }}
                            >
                              <Droppable id={name}>
                                <Draggable id={name}>
                                  {renderWidget(name as WidgetKeysEnum, {
                                    id: name,
                                    isExpanded: (Number(columns) || 1) > 1,
                                    onExpand: () => {
                                      updateWidgetColumn(
                                        id,
                                        name,
                                        columns === '1' ? '2' : '1',
                                      )
                                    },
                                    widgetId: id,
                                  })}
                                </Draggable>
                              </Droppable>
                            </Box>
                          </Grid>
                        )
                      })}
                    </Grid>
                  </SortableContext>
                </DndContext>
              </WidgetWrapper>
            )}
          </Stack>
        )}
      </Stack>
      <Fab
        color="secondary"
        onClick={() => setIsDrawerOpen(true)}
        sx={{
          bottom: 30,
          color: 'common.white',
          display: isWidgetsDraftMode && !isGuest ? 'flex' : 'none',
          position: 'fixed',
          right: 30,
        }}
      >
        <Add />
      </Fab>
      <WidgetsDrawer
        isGuest={isGuest}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
      />
    </Stack>
  )
}

const VitalsPage = () => {
  return (
    <>
      <VitalsPageContent />

      <ConfirmTimezoneModal />
    </>
  )
}

export default withAuthenticationRequired(VitalsPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
