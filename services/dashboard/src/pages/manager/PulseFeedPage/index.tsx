import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import {
  FeedType,
  PulseCategory,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '@zunou-graphql/core/graphql'
import { useGetActivitiesQuery } from '@zunou-queries/core/hooks/useGetActivitiesQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { InView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'

import FeedContainer from './components/FeedContainer'
import Seperator from './components/Seperator'
import AddToPulseFeed from './Feeds/AddToPulseFeed'
import CollabFeed from './Feeds/CollabFeed'
import DMFeed from './Feeds/DMFeed'
import OrganizationChartFeed from './Feeds/OrganizationChartFeed'
import TaskAssignedFeed from './Feeds/TaskAssignedFeed'
import TaskCreatedFeed from './Feeds/TaskCreatedFeed'
import TeamChatFeed from './Feeds/TeamChatFeed'

const PulseFeedPage = () => {
  const { t } = useTranslation(['feed'])
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseCategory } = usePulseStore()
  const { user } = useAuthContext()

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

  if (isLoadingActivitiesData) {
    return (
      <Stack
        alignItems="center"
        height="100%"
        justifyContent="center"
        width="100%"
      >
        <LoadingSpinner />
      </Stack>
    )
  }

  if (error) {
    return (
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
    )
  }

  return (
    <FeedContainer>
      {activities.map((activity) => {
        switch (activity.feedType) {
          case FeedType.Teammesage:
            return (
              <TeamChatFeed
                causer={activity.properties?.causer ?? null}
                dateString={activity.createdAt}
                description={activity.description}
                key={activity.id}
                messageContent={activity.properties?.data?.content ?? ''}
                organizationId={activity.organizationId}
                pulseId={activity.pulseId}
              />
            )
          case FeedType.Directmessage:
            return (
              <DMFeed
                causer={activity.properties?.causer ?? null}
                dateString={activity.createdAt}
                description={activity.description}
                key={activity.id}
                messageContent={activity.properties?.data?.content ?? ''}
              />
            )
          case FeedType.OrggroupCreated:
            return (
              <OrganizationChartFeed
                causer={activity.properties?.causer ?? null}
                dateString={activity.createdAt}
                description={activity.description}
                key={activity.id}
                organizationId={activity.organizationId}
                pulseId={activity.pulseId}
              />
            )
          case FeedType.TaskAssigned:
            return (
              <TaskAssignedFeed
                causer={activity.properties?.causer ?? null}
                dateString={activity.createdAt}
                description={activity.description}
                key={activity.id}
                organizationId={activity.organizationId}
                pulseId={activity.pulseId}
                task={{
                  description: activity.properties?.data?.description ?? '',
                  dueDate: activity.properties?.data?.due_date ?? '',
                  id: activity.properties?.data?.id ?? '',
                  priority:
                    (activity.properties?.data?.priority as TaskPriority) ??
                    TaskPriority.Low,
                  status:
                    (activity.properties?.data?.status as TaskStatus) ??
                    TaskStatus.Todo,
                  title: activity.properties?.data?.title ?? '',
                }}
              />
            )
          case FeedType.TaskCreated:
            return (
              <TaskCreatedFeed
                causer={activity.properties?.causer ?? null}
                dateString={activity.createdAt}
                description={activity.description}
                key={activity.id}
                organizationId={activity.organizationId}
                pulseId={activity.pulseId}
                task={{
                  description: activity.properties?.data?.description ?? '',
                  dueDate: activity.properties?.data?.due_date ?? '',
                  id: activity.properties?.data?.id ?? '',
                  priority:
                    (activity.properties?.data?.priority as TaskPriority) ??
                    TaskPriority.Low,
                  status:
                    (activity.properties?.data?.status as TaskStatus) ??
                    TaskStatus.Todo,
                  title: activity.properties?.data?.title ?? '',
                  type:
                    (activity.properties?.data?.type as TaskType) ??
                    TaskType.Task,
                }}
              />
            )
          case FeedType.PulsememberAdded:
            return (
              <AddToPulseFeed
                causer={activity.properties?.causer ?? null}
                dateString={activity.createdAt}
                description={activity.description}
                key={activity.id}
                organizationId={activity.organizationId}
                pulseId={activity.pulseId}
              />
            )
          case FeedType.CollabStarted:
            return (
              <CollabFeed
                causer={activity.properties?.causer ?? null}
                dateString={activity.createdAt}
                description={activity.description}
                key={activity.id}
                organizationId={activity.organizationId}
                pulseId={activity.pulseId}
              />
            )
          default:
            return null
        }
      })}

      {activities.length <= 0 && (
        <Typography
          color="text.secondary"
          py={2}
          textAlign="center"
          variant="body2"
        >
          {t('no_feeds_message')}
        </Typography>
      )}

      {hasNextPage ? (
        <InView
          onChange={loadMoreActivities}
          threshold={0.1}
          triggerOnce={false}
        >
          {({ ref }) => (
            <Stack alignItems="center" justifyContent="center" py={3} ref={ref}>
              {isFetchingNextPage && <LoadingSpinner />}
            </Stack>
          )}
        </InView>
      ) : (
        activities.length > 0 && (
          <Seperator text={t('feed_caught_up_message')} />
        )
      )}
    </FeedContainer>
  )
}

export default PulseFeedPage
