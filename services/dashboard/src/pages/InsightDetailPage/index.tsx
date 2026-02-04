import {
  ArrowBackOutlined,
  ArrowForwardOutlined,
  ArticleOutlined,
  BoltOutlined,
  CalendarTodayOutlined,
  CheckCircleOutline,
  FolderOutlined,
  LightbulbOutlined,
  LinkOutlined,
  LocationOnOutlined,
  ThumbDown,
  ThumbDownOutlined,
  ThumbUp,
  ThumbUpOutlined,
} from '@mui/icons-material'
import { CircularProgress, Divider, Typography } from '@mui/material'
import { alpha, darken, Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import {
  ActionStatus,
  InsightStatus,
  InsightType,
  PulseCategory,
  TopicReferenceType,
} from '@zunou-graphql/core/graphql'
import { useCreateTopicMutation } from '@zunou-queries/core/hooks/useCreateTopicMutation'
import { useGetInsightRecommendations } from '@zunou-queries/core/hooks/useGetInsightRecommendations'
import { useGetLiveInsightQuery } from '@zunou-queries/core/hooks/useGetLiveInsightQuery'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { useGiveLiveInsightFeedbackMutation } from '@zunou-queries/core/hooks/useGiveLiveInsightFeedbackMutation'
import { useUpdateInsightClosedMutation } from '@zunou-queries/core/hooks/useUpdateInsightClosedMutation.ts'
import { useUpdateInsightSeenMutation } from '@zunou-queries/core/hooks/useUpdateInsightSeenMutation.ts'
import zunouIcon from '@zunou-react/assets/images/zunou-icon.png'
import {
  Button,
  Chip,
  IconButton,
  LoadingButton,
} from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'

import blueBanner from '~/assets/insight-banner-blue.svg'
import orangeBanner from '~/assets/insight-banner-orange.svg'
import redBanner from '~/assets/insight-banner-red.svg'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useVitalsContext } from '~/context/VitalsContext'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'
import { useTopicStore } from '~/store/useTopicStore'
import { formatRelativeDateLabel } from '~/utils/dateUtils'

import { toTitleCase } from '../../utils/textUtils'
import { useHooks } from '../VitalsPage/useHooks'
import { EventDetailModal } from './EventDetailModal'
import { RecommendationCard } from './RecommendationCard'

const BANNER_MAP = {
  [InsightType.Risk]: redBanner,
  [InsightType.Decision]: blueBanner,
  [InsightType.Action]: orangeBanner,
}

export const InsightDetailPage = () => {
  const navigate = useNavigate()
  const { insightId, organizationId, pulseId } = useParams()

  const { setPulseChatMode, pulseCategory } = usePulseStore()
  const { setCurrentPulseTopic } = useTopicStore()

  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [rating, setRating] = useState<number | null>(null)

  const { user, userRole } = useAuthContext()
  const queryClient = useQueryClient()

  const timezone = user?.timezone ?? 'UTC'

  // check dark mode
  const { isLoadingSetting } = useHooks()
  const { setting } = useVitalsContext()
  const isDarkMode = setting?.theme === 'dark'

  const {
    data: insightData,
    isLoading: isLoadingLiveInsight,
    refetch: refetchLiveInsights,
  } = useGetLiveInsightQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!insightId,
    variables: {
      id: insightId,
      organizationId,
    },
  })

  const { data: insightRecommendations, isLoading: isLoadingRecommendations } =
    useGetInsightRecommendations({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!insightId,
      variables: {
        id: insightId,
        organizationId,
      },
    })

  const createTopic = useCreateTopicMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateInsightSeen = useUpdateInsightSeenMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const updateInsightClosed = useUpdateInsightClosedMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const giveLiveInsightFeedback = useGiveLiveInsightFeedbackMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const banner = insightData?.liveInsight.type
    ? BANNER_MAP[insightData.liveInsight.type]
    : orangeBanner

  const { data: pulsesData, isLoading: isPulseDataLoading } = useGetPulsesQuery(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    },
  )

  const personalPulse = pulsesData?.pulses.find(
    (pulse) => pulse.category === PulseCategory.Personal,
  )

  const insight = insightData?.liveInsight
  const recommendations =
    insightRecommendations?.GetInsightRecommendations.filter((reco) =>
      reco.actions?.[0]
        ? reco.actions[0].status === ActionStatus.Completed
        : false,
    ) ?? []

  const isLoading =
    isLoadingLiveInsight ||
    isLoadingRecommendations ||
    isPulseDataLoading ||
    isLoadingSetting

  const hasRequiredData = insight && insightRecommendations

  const handleViewEventDetail = (id: string) => {
    setActiveMeetingId(id)
  }

  const handleFeedback = (value: number) => {
    if (!organizationId || !insight?.id || (value !== 1 && value !== 5)) {
      return
    }

    const previousRating = rating
    setRating(value) // Optimistic update

    const comment = value === 1 ? 'DISLIKE' : 'LIKE'

    giveLiveInsightFeedback.mutate(
      { comment, organizationId, outboxId: insight.id, rating: value },
      {
        onError: () => setRating(previousRating), // revert if failed
      },
    )
  }

  const handleAskZunouAssistant = useCallback(async () => {
    if (isRedirecting || !organizationId || !insight) return

    if (!personalPulse?.id) {
      toast.error('Personal pulse Id is missing.')
      return
    }

    setIsRedirecting(true)

    const path = `/${userRole}/${pathFor({
      pathname: Routes.PulseDetail,
      query: {
        organizationId,
        pulseId: personalPulse.id,
      },
    })}`

    // Topic does not exist flow
    if (!insight?.topicThread) {
      await createTopic.mutateAsync(
        {
          name: insight.topic ?? 'Topic',
          organizationId,
          pulseId,
          referenceId: insight.id,
          referenceType: TopicReferenceType.Insights,
        },
        {
          onError: () => {
            toast.error('An error has occured when creating topics.')
          },
          onSuccess: async (response) => {
            await refetchLiveInsights()

            await queryClient.refetchQueries({
              queryKey: ['topics', 'PULSE_CHAT', pulseId, organizationId],
            })

            if (
              !response.createTopic.thread?.id ||
              !response.createTopic.id ||
              !response.createTopic.name
            ) {
              toast.error('Missing data for created topic.')
              return
            }

            setCurrentPulseTopic({
              hasUnread: false,
              id: response.createTopic.id,
              name: response.createTopic.name,
              threadId: response.createTopic.thread.id,
            })

            setPulseChatMode('CHAT')

            navigate(path)

            setIsRedirecting(false)
          },
        },
      )
      return
    }

    setCurrentPulseTopic({
      hasUnread: false,
      id: insight.topicThread.id,
      name: insight.topicThread.name,
      threadId: insight.topicThread.thread?.id,
    })

    setPulseChatMode('CHAT')

    navigate(path)

    setIsRedirecting(false)
  }, [
    isRedirecting,
    insight?.topic,
    insight?.pulse_id,
    navigate,
    userRole,
    organizationId,
    pulseId,
  ])

  const handleBack = () => {
    const path = `/${userRole}/${pathFor({
      pathname: Routes.PulseDetail,
      query: {
        organizationId,
        pulseId,
      },
    })}`

    navigate(path)
  }

  useEffect(() => {
    if (insight) {
      setRating(insight.feedback?.rating ?? null) // initialize rating from server
    }
  }, [insight])

  useEffect(() => {
    if (
      insight?.id &&
      insight.delivery_status !== InsightStatus.Seen &&
      insight.delivery_status !== InsightStatus.Closed
    ) {
      updateInsightSeen.mutate({ id: insight.id })
    }
  }, [insight])

  if (!insightId) return null

  return (
    <>
      {isLoading || !hasRequiredData ? (
        <Stack
          alignItems="center"
          height="100%"
          justifyContent="center"
          width="100%"
        >
          <LoadingSpinner />
        </Stack>
      ) : (
        <>
          <Stack gap={2} height="100%" overflow="hidden" p={4}>
            {/* Banner Section */}
            <Stack
              bgcolor="primary.main"
              borderRadius="8px 8px 24px 24px"
              color="common.white"
              padding={4}
              spacing={2}
              sx={{
                backgroundImage: `url(${banner})`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{
                  color: isDarkMode ? 'grey.300' : 'inherit',
                }}
              >
                <Button
                  color="inherit"
                  onClick={handleBack}
                  startIcon={<ArrowBackOutlined fontSize="small" />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Back
                </Button>

                <Stack
                  alignItems="center"
                  direction="row"
                  divider={
                    <Divider
                      flexItem={true}
                      orientation="vertical"
                      sx={{ alignSelf: 'center', height: 24 }}
                    />
                  }
                  spacing={2}
                >
                  <LoadingButton
                    disabled={
                      updateInsightSeen.isPending ||
                      updateInsightClosed.isPending
                    }
                    loading={
                      updateInsightClosed.isPending || isLoadingLiveInsight
                    }
                    onClick={() => {
                      if (
                        insight.delivery_status === InsightStatus.Closed ||
                        !insight?.id
                      ) {
                        return
                      }
                      updateInsightClosed.mutate({ id: insight.id })
                    }}
                    size="small"
                    startIcon={<CheckCircleOutline fontSize="small" />}
                    sx={{
                      ...(insight.delivery_status === InsightStatus.Closed
                        ? {
                            '&:hover': {
                              backgroundColor: (theme) =>
                                alpha(theme.palette.common.green, 0.08),
                              borderColor: 'common.lime',
                            },
                            backgroundColor: (theme) =>
                              alpha(theme.palette.common.pastelGreen, 0.9),
                            borderColor: 'common.lime',
                            borderRadius: 1.5,
                            color: 'common.lime',
                            cursor: 'default',
                            pointerEvents: 'none',
                          }
                        : {
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderColor: 'inherit',
                            },
                            borderColor: 'inherit',
                            borderRadius: 1.5,
                            color: 'inherit',
                          }),
                    }}
                    variant={
                      insight.delivery_status === InsightStatus.Closed
                        ? 'contained'
                        : updateInsightSeen.isPending ||
                            updateInsightClosed.isPending
                          ? 'contained'
                          : 'outlined'
                    }
                  >
                    {insight.delivery_status === InsightStatus.Closed
                      ? 'Completed'
                      : 'Mark as Completed'}
                  </LoadingButton>

                  {/* Like/Dislike */}
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => handleFeedback(5)}
                      size="small"
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.lime, 0.1),
                        },
                        bgcolor: 'transparent',
                        borderRadius: 2,
                        color:
                          rating === 5 ? theme.palette.common.lime : 'inherit',
                      }}
                    >
                      {rating === 5 ? (
                        <ThumbUp fontSize="small" />
                      ) : (
                        <ThumbUpOutlined fontSize="small" />
                      )}
                    </IconButton>

                    <IconButton
                      onClick={() => handleFeedback(1)}
                      size="small"
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.cherry, 0.1),
                        },
                        bgcolor: 'transparent',
                        borderRadius: 2,
                        color:
                          rating === 1
                            ? theme.palette.common.cherry
                            : 'inherit',
                      }}
                    >
                      {rating === 1 ? (
                        <ThumbDown fontSize="small" />
                      ) : (
                        <ThumbDownOutlined fontSize="small" />
                      )}
                    </IconButton>
                  </Stack>
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1}>
                {insight?.type && (
                  <Chip
                    label={toTitleCase(insight.type)}
                    size="small"
                    sx={{
                      '& .MuiChip-label': { fontSize: '0.725rem' },
                      bgcolor: alpha(theme.palette.common.white, 0.2),
                      color: 'common.white',
                      px: 0.5,
                      width: 'fit-content',
                    }}
                  />
                )}
                {insight?.delivery_status && (
                  <Chip
                    label={toTitleCase(
                      insight.delivery_status === InsightStatus.Closed
                        ? 'Completed'
                        : insight.delivery_status,
                    )}
                    size="small"
                    sx={{
                      '& .MuiChip-label': { fontSize: '0.725rem' },
                      bgcolor: alpha(theme.palette.common.white, 0.2),
                      color: 'common.white',
                      px: 0.5,
                      width: 'fit-content',
                    }}
                  />
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography variant="h5">{insight?.topic}</Typography>
                <Stack direction="row" spacing={2}>
                  {/* Meeting Date */}
                  <Stack alignItems="center" direction="row" spacing={0.5}>
                    <CalendarTodayOutlined fontSize="small" />
                    <Typography color="grey.200" variant="body2">
                      {insight &&
                        formatRelativeDateLabel(insight?.created_at, timezone)}
                    </Typography>
                  </Stack>

                  {/* Source */}
                  <Stack alignItems="center" direction="row" spacing={0.5}>
                    <LocationOnOutlined fontSize="small" />
                    <Typography color="grey.200" variant="body2">
                      From Meeting
                    </Typography>
                  </Stack>

                  {/* Pulse */}
                  {insight?.pulse && (
                    <Stack alignItems="center" direction="row" spacing={0.5}>
                      <FolderOutlined fontSize="small" />
                      <Typography color="grey.200" variant="body2">
                        {insight.pulse.name}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Stack>

            {/* Main Content */}
            <Stack direction="row" flex={1} gap={1} minHeight={0}>
              <Stack pr={2} spacing={2} sx={{ overflowY: 'auto' }} width="100%">
                {/* Description Card */}
                <Stack
                  bgcolor="common.white"
                  borderRadius={3}
                  p={2}
                  spacing={1}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <Stack direction="row" spacing={1}>
                    <ArticleOutlined fontSize="small" />
                    <Typography fontWeight="bold" variant="body1">
                      Description
                    </Typography>
                  </Stack>
                  {insight?.description ? (
                    <Typography color="text.primary" pl={0.4} variant="body2">
                      {insight.description}
                    </Typography>
                  ) : (
                    <Typography
                      color="text.secondary"
                      fontStyle="italic"
                      pl={2}
                      variant="body2"
                    >
                      No description available.
                    </Typography>
                  )}
                </Stack>

                {/* Recommendations Card */}
                <Stack
                  bgcolor="common.white"
                  borderRadius={3}
                  p={2}
                  spacing={2}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1}>
                      <BoltOutlined fontSize="small" />
                      <Typography fontWeight="bold" variant="body1">
                        Recommendations
                      </Typography>
                    </Stack>
                    {recommendations.length > 0 && (
                      <Typography pl={0.8} variant="body2">
                        Here are some suggested actions based on this meeting.
                      </Typography>
                    )}
                  </Stack>

                  {recommendations.length > 0 ? (
                    <Stack spacing={2}>
                      {recommendations.map(
                        ({
                          summary,
                          title,
                          id,
                          actions,
                          is_executed,
                          executedBy,
                          execution_result_data,
                        }) => {
                          return (
                            <RecommendationCard
                              actions={actions}
                              executed={is_executed}
                              executedBy={executedBy}
                              executionResult={execution_result_data}
                              id={id}
                              insightId={insight?.id}
                              key={id}
                              originatorPulseName={
                                insight?.pulse?.name ?? 'Unknown Pulse'
                              }
                              pulseId={insight?.pulse_id}
                              summary={summary}
                              title={title}
                            />
                          )
                        },
                      )}
                    </Stack>
                  ) : (
                    <Typography
                      color="text.secondary"
                      fontStyle="italic"
                      pl={2}
                      variant="body2"
                    >
                      No recommendations available.
                    </Typography>
                  )}
                </Stack>

                {/* Context & Background */}
                <Stack
                  bgcolor="common.white"
                  borderRadius={3}
                  p={2}
                  spacing={1}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <Stack direction="row" spacing={1}>
                    <LightbulbOutlined fontSize="small" />
                    <Typography fontWeight="bold" variant="body1">
                      Context & Background
                    </Typography>
                  </Stack>
                  <Typography
                    color={
                      insight?.explanation ? 'text.primary' : 'text.secondary'
                    }
                    fontStyle={!insight?.explanation ? 'italic' : 'normal'}
                    pl={!insight?.explanation ? 2 : 0.5}
                    variant="body2"
                  >
                    {insight?.explanation ||
                      'No context or background information available.'}
                  </Typography>
                </Stack>
              </Stack>

              {/* Right Sidebar */}
              <Stack spacing={2} width="40%">
                {insight?.meeting_id && insight?.meeting && (
                  <Stack
                    bgcolor="common.white"
                    borderRadius={3}
                    p={2}
                    spacing={1}
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack direction="row" spacing={1}>
                      <LinkOutlined fontSize="small" />
                      <Typography fontWeight="bold" variant="body1">
                        Source
                      </Typography>
                    </Stack>
                    <Typography
                      color="common.blue"
                      onClick={() =>
                        handleViewEventDetail(insight.meeting.meetingId)
                      }
                      sx={{
                        '&:hover': {
                          color: darken(theme.palette.common.blue, 0.15),
                        },
                        cursor: 'pointer',
                      }}
                      variant="body2"
                    >
                      View Meeting Event
                    </Typography>
                  </Stack>
                )}

                <Stack
                  alignItems="start"
                  bgcolor="common.white"
                  borderRadius={3}
                  component="button"
                  onClick={handleAskZunouAssistant}
                  p={2}
                  spacing={1}
                  sx={{
                    '&:hover': {
                      bgcolor: isRedirecting
                        ? 'background.default'
                        : !isDarkMode
                          ? 'action.hover'
                          : '',
                    },
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: isRedirecting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Stack
                    direction="row"
                    gap={1}
                    justifyContent="space-between"
                    width="100%"
                  >
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <Avatar
                        size="small"
                        src={zunouIcon}
                        variant="circular"
                      ></Avatar>
                      <Typography fontWeight="bold" variant="body1">
                        Ask Zunou Assistant
                      </Typography>
                    </Stack>
                    {isRedirecting ? (
                      <CircularProgress size={18} />
                    ) : (
                      <ArrowForwardOutlined fontSize="small" />
                    )}
                  </Stack>

                  {pulseCategory !== PulseCategory.Personal && (
                    <Typography
                      color="text.secondary"
                      textAlign="left"
                      variant="caption"
                    >
                      You’ll be redirected to your personal pulse.
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Stack>
          </Stack>

          {activeMeetingId && (
            <EventDetailModal
              id={activeMeetingId}
              isOpen={!!activeMeetingId}
              onClose={() => setActiveMeetingId(null)}
            />
          )}
        </>
      )}
    </>
  )
}
