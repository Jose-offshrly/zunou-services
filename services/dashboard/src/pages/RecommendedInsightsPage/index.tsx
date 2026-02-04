import { ArrowForwardOutlined } from '@mui/icons-material'
import { Box, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { InsightStatus } from '@zunou-graphql/core/graphql'
import { useGetLiveInsightsQuery } from '@zunou-queries/core/hooks/useGetLiveInsightsQuery'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { InView } from 'react-intersection-observer'
import { useNavigate, useParams } from 'react-router-dom'

import { useVitalsContext } from '~/context/VitalsContext'
import { Routes } from '~/services/Routes'

import { InsightCard } from '../manager/PulseDetailPage/components/Insights/InsightCard'
import { useHooks } from '../VitalsPage/useHooks'

export const RecommendedInsightsPage = () => {
  const navigate = useNavigate()
  const { organizationId } = useParams()
  const { isLoading: isAuthLoading } = useAuthContext()

  // we use this so we can initialize setting data
  const { isLoadingSetting } = useHooks()
  const { setting } = useVitalsContext()
  const isDarkMode = setting?.theme === 'dark'

  const {
    data,
    isLoading: isLoadingInsights,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetLiveInsightsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!organizationId,
    variables: {
      filter: {
        organizationId,
        statuses: [
          InsightStatus.Pending,
          InsightStatus.Delivered,
          InsightStatus.Seen,
        ],
      },
      perPage: 18,
    },
  })

  const insights = data?.pages.flatMap((page) => page.myLiveInsights.data) ?? []

  const isLoading = isAuthLoading || isLoadingInsights || isLoadingSetting
  const isEmpty = !isLoading && insights.length === 0

  const navigateToAllInsights = () =>
    navigate(
      pathFor({
        pathname: Routes.Insights,
        query: {
          organizationId,
        },
      }),
    )

  const handleLoadMore = (inView: boolean) => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{ color: isDarkMode ? 'grey.300' : 'inherit' }}
      >
        <Stack>
          <Typography fontWeight="bold" variant="body1">
            Recommended for you
          </Typography>
          <Typography variant="body2">
            Most important items requiring your attention
          </Typography>
        </Stack>
        {!isLoading && (
          <Button
            color="inherit"
            endIcon={<ArrowForwardOutlined fontSize="small" />}
            onClick={navigateToAllInsights}
            variant="text"
          >
            See all
          </Button>
        )}
      </Stack>

      <Box flex={1} overflow="auto" sx={{ flexGrow: 1, mt: 2, pr: 1 }}>
        {isLoading ? (
          <Stack alignItems="center" height="100%" justifyContent="center">
            <CircularProgress size={20} />
          </Stack>
        ) : isEmpty ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ height: '100%', minHeight: 400, py: 8, textAlign: 'center' }}
          >
            <Stack alignItems="center" spacing={1}>
              <Typography color="text.secondary" variant="h6">
                No Insights Available
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Check back later for personalized recommendations.
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <>
            <Grid container={true} spacing={2}>
              {insights.map(
                ({
                  created_at,
                  description,
                  id,
                  topic,
                  type,
                  feedback,
                  delivery_status,
                }) => (
                  <Grid item={true} key={id} lg={4} md={6} xs={12}>
                    <InsightCard
                      createdAt={created_at}
                      description={description}
                      id={id}
                      rating={feedback?.rating}
                      status={delivery_status}
                      topic={topic}
                      type={type}
                    />
                  </Grid>
                ),
              )}
            </Grid>

            <InView onChange={handleLoadMore} threshold={0.1}>
              {({ ref }) => (
                <Box
                  ref={ref}
                  sx={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    pb: 2,
                    pt: 4,
                  }}
                >
                  {isFetchingNextPage && <CircularProgress size={20} />}
                </Box>
              )}
            </InView>
          </>
        )}
      </Box>
    </>
  )
}
