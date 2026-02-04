import { Close } from '@mui/icons-material'
import {
  alpha,
  Drawer,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import {
  FeedType,
  PulseCategory,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetActivitiesQuery } from '@zunou-queries/core/hooks/useGetActivitiesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import Seperator from '~/pages/manager/PulseFeedPage/components/Seperator'
import AddToPulseFeed from '~/pages/manager/PulseFeedPage/Feeds/AddToPulseFeed'
import CollabFeed from '~/pages/manager/PulseFeedPage/Feeds/CollabFeed'
import DMFeed from '~/pages/manager/PulseFeedPage/Feeds/DMFeed'
import OrganizationChartFeed from '~/pages/manager/PulseFeedPage/Feeds/OrganizationChartFeed'
import TaskAssignedFeed from '~/pages/manager/PulseFeedPage/Feeds/TaskAssignedFeed'
import TaskCreatedFeed from '~/pages/manager/PulseFeedPage/Feeds/TaskCreatedFeed'
import TeamChatFeed from '~/pages/manager/PulseFeedPage/Feeds/TeamChatFeed'
import { usePulseStore } from '~/store/usePulseStore'

import { FeedItemWrapper } from './components/FeedItemWrapper'

interface PulseFeedDrawerProps {
  open: boolean
  onClose: () => void
}

type FeedTab = 'all' | 'collabs' | 'messages' | 'tasks' | 'organization'

export const PulseFeedDrawer = ({ open, onClose }: PulseFeedDrawerProps) => {
  const { t } = useTranslation(['feed'])
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()
  const { pulseCategory, pulse } = usePulseStore()
  const { user } = useAuthContext()
  const [activeTab, setActiveTab] = useState<FeedTab>('all')

  // Get pulse name from store when not in Personal pulse
  const pulseName = useMemo(() => {
    if (pulseCategory !== PulseCategory.Personal && pulse?.name) {
      return pulse.name
    }
    return null
  }, [pulseCategory, pulse])

  const {
    data: activitiesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingActivitiesData,
    error,
  } = useGetActivitiesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      receiverId: user?.id,
      ...(pulseCategory !== PulseCategory.Personal ? { pulseId } : {}),
    },
  })

  const activities = useMemo(
    () => activitiesData?.pages.flatMap((page) => page.data) ?? [],
    [activitiesData],
  )

  const filteredActivities = useMemo(() => {
    if (activeTab === 'all') {
      return activities
    }
    if (activeTab === 'collabs') {
      return activities.filter(
        (activity) => activity.feedType === FeedType.CollabStarted,
      )
    }
    if (activeTab === 'messages') {
      return activities.filter(
        (activity) =>
          activity.feedType === FeedType.Teammesage ||
          activity.feedType === FeedType.Directmessage,
      )
    }
    if (activeTab === 'tasks') {
      return activities.filter(
        (activity) =>
          activity.feedType === FeedType.TaskAssigned ||
          activity.feedType === FeedType.TaskCreated,
      )
    }
    if (activeTab === 'organization') {
      return activities.filter(
        (activity) =>
          activity.feedType === FeedType.PulsememberAdded ||
          activity.feedType === FeedType.OrggroupCreated,
      )
    }
    return activities
  }, [activities, activeTab])

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'all':
        return "You're all caught up! No new activities."
      case 'collabs':
        return 'No collaborations yet. Start collaborating with your team!'
      case 'messages':
        return 'No messages yet. Team messages and DMs will appear here.'
      case 'tasks':
        return 'No task updates. Tasks you create or are assigned will appear here.'
      case 'organization':
        return 'No organization activities yet. Pulse member additions and org group updates will appear here.'
      default:
        return "You're all caught up! No new activities."
    }
  }

  const loadMoreActivities = (inView: boolean) => {
    if (
      inView &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoadingActivitiesData
    ) {
      fetchNextPage()
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: FeedTab) => {
    setActiveTab(newValue)
  }

  return (
    <Drawer
      PaperProps={{
        sx: {
          borderTop: '2px solid',
          borderTopColor: 'primary.main',
          width: 440,
        },
      }}
      anchor="right"
      onClose={onClose}
      open={open}
    >
      <Stack
        padding={2}
        spacing={2}
        sx={{
          '&::-webkit-scrollbar': { display: 'none' },
          height: '100%',
          msOverflowStyle: 'none',
          overflowY: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {/* Header section */}
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" gap={1}>
            <Stack
              alignItems="center"
              border={`1px solid ${alpha(theme.palette.primary.main, 0.1)}`}
              borderRadius="20px"
              color="primary.main"
              fontSize="small"
              justifyContent="center"
              px={1}
              py={0.5}
            >
              Org Feed
            </Stack>
            <Stack
              alignItems="center"
              bgcolor={alpha(theme.palette.primary.main, 0.05)}
              borderRadius="20px"
              color="primary.main"
              fontSize="small"
              justifyContent="center"
              px={2}
              py={0.5}
            >
              {filteredActivities.length} updates
            </Stack>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>

        {/* Header section */}
        <Stack spacing={0.5}>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
          >
            <Typography fontWeight="bold" variant="h5">
              {pulseName ? `${pulseName} feed` : 'Your Pulse feed'}
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Stay updated with your team&apos;s latest activities.
          </Typography>
        </Stack>

        {/* Tabs section */}
        <Stack borderBottom={1} borderColor="divider">
          <Tabs
            onChange={handleTabChange}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 500,
                minHeight: 48,
                textTransform: 'none',
              },
              minHeight: 48,
            }}
            value={activeTab}
            variant="scrollable"
          >
            <Tab label="All Activity" value="all" />
            <Tab label="Collabs" value="collabs" />
            <Tab label="Messages" value="messages" />
            <Tab label="Tasks" value="tasks" />
            <Tab label="Organization" value="organization" />
          </Tabs>
        </Stack>

        {/* Content section */}
        <Stack spacing={2}>
          {isLoadingActivitiesData ? (
            <Stack
              alignItems="center"
              height="100%"
              justifyContent="center"
              width="100%"
            >
              <LoadingSpinner />
            </Stack>
          ) : error ? (
            <Stack
              alignItems="center"
              height="100%"
              justifyContent="center"
              spacing={2}
              width="100%"
            >
              <Typography color="error" variant="h6">
                Failed to load activities
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {error.message}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {filteredActivities.length === 0 ? (
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  py={6}
                  spacing={1}
                >
                  <Typography
                    color="text.secondary"
                    textAlign="center"
                    variant="body1"
                  >
                    {getEmptyStateMessage()}
                  </Typography>
                </Stack>
              ) : (
                filteredActivities.map((activity) => {
                  switch (activity.feedType) {
                    case FeedType.Teammesage:
                      return (
                        <FeedItemWrapper key={activity.id}>
                          <TeamChatFeed
                            causer={activity.properties?.causer ?? null}
                            dateString={activity.createdAt}
                            description={activity.description}
                            messageContent={
                              activity.properties?.data?.content ?? ''
                            }
                            organizationId={activity.organizationId}
                            pulseId={activity.pulseId}
                          />
                        </FeedItemWrapper>
                      )
                    case FeedType.Directmessage:
                      return (
                        <FeedItemWrapper key={activity.id}>
                          <DMFeed
                            causer={activity.properties?.causer ?? null}
                            dateString={activity.createdAt}
                            description={activity.description}
                            messageContent={
                              activity.properties?.data?.content ?? ''
                            }
                          />
                        </FeedItemWrapper>
                      )
                    case FeedType.OrggroupCreated:
                      return (
                        <FeedItemWrapper key={activity.id}>
                          <OrganizationChartFeed
                            causer={activity.properties?.causer ?? null}
                            dateString={activity.createdAt}
                            description={activity.description}
                            organizationId={activity.organizationId}
                            pulseId={activity.pulseId}
                          />
                        </FeedItemWrapper>
                      )
                    case FeedType.TaskAssigned:
                      return (
                        <FeedItemWrapper key={activity.id}>
                          <TaskAssignedFeed
                            causer={activity.properties?.causer ?? null}
                            dateString={activity.createdAt}
                            description={activity.description}
                            organizationId={activity.organizationId}
                            pulseId={activity.pulseId}
                            task={{
                              description:
                                activity.properties?.data?.description ?? '',
                              dueDate:
                                activity.properties?.data?.due_date ?? '',
                              id: activity.properties?.data?.id ?? '',
                              priority:
                                (activity.properties?.data
                                  ?.priority as TaskPriority) ??
                                TaskPriority.Low,
                              status:
                                (activity.properties?.data
                                  ?.status as TaskStatus) ?? TaskStatus.Todo,
                              title: activity.properties?.data?.title ?? '',
                            }}
                          />
                        </FeedItemWrapper>
                      )
                    case FeedType.TaskCreated:
                      return (
                        <FeedItemWrapper key={activity.id}>
                          <TaskCreatedFeed
                            causer={activity.properties?.causer ?? null}
                            dateString={activity.createdAt}
                            description={activity.description}
                            organizationId={activity.organizationId}
                            pulseId={activity.pulseId}
                            task={{
                              description:
                                activity.properties?.data?.description ?? '',
                              dueDate:
                                activity.properties?.data?.due_date ?? '',
                              id: activity.properties?.data?.id ?? '',
                              priority:
                                (activity.properties?.data
                                  ?.priority as TaskPriority) ??
                                TaskPriority.Low,
                              status:
                                (activity.properties?.data
                                  ?.status as TaskStatus) ?? TaskStatus.Todo,
                              title: activity.properties?.data?.title ?? '',
                              type:
                                (activity.properties?.data?.type as TaskType) ??
                                TaskType.Task,
                            }}
                          />
                        </FeedItemWrapper>
                      )
                    case FeedType.PulsememberAdded:
                      return (
                        <FeedItemWrapper key={activity.id}>
                          <AddToPulseFeed
                            causer={activity.properties?.causer ?? null}
                            dateString={activity.createdAt}
                            description={activity.description}
                            organizationId={activity.organizationId}
                            pulseId={activity.pulseId}
                          />
                        </FeedItemWrapper>
                      )
                    case FeedType.CollabStarted:
                      return (
                        <FeedItemWrapper key={activity.id}>
                          <CollabFeed
                            causer={activity.properties?.causer ?? null}
                            dateString={activity.createdAt}
                            description={activity.description}
                            organizationId={activity.organizationId}
                            pulseId={activity.pulseId}
                          />
                        </FeedItemWrapper>
                      )
                    default:
                      return null
                  }
                })
              )}

              {hasNextPage && filteredActivities.length > 0 ? (
                <InView
                  onChange={loadMoreActivities}
                  threshold={0.1}
                  triggerOnce={false}
                >
                  {({ ref }) => (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      py={3}
                      ref={ref}
                    >
                      {isFetchingNextPage && <LoadingSpinner />}
                    </Stack>
                  )}
                </InView>
              ) : (
                filteredActivities.length > 0 && (
                  <Seperator text={t('feed_caught_up_message')} />
                )
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Drawer>
  )
}
