import { CircularProgress, Grid } from '@mui/material'
import { Stack } from '@mui/system'
import { PageContent } from '@zunou-react/components/layout'
import { ErrorHandler } from '@zunou-react/components/utility'

import GoalsAndVision from '~/components/domain/dashboard/DashboardGoalsAndVision/DashboardGoalsAndVision'
import DashboardSentimentChart from '~/components/domain/dashboard/DashboardSentimentChart/DashboardSentimentChart'

import { useHooks } from './hooks'

const ArchivedDashboardPage = () => {
  const {
    // acknowledgeMisalignmentAlert,
    isFetchingMonthlyQuestions,
    isFetchingMonthlySummary,
    isFetchingMonthlyTimeSaved,
    isFetchingTopicsData,
    isFetchingUnacknowledgedMisalignmentAlerts,
    // monthlyQuestions,
    // monthlySummary,
    // monthlyTimeSaved,
    // organizationId,
    // trendingTopics,
    // unacknowledgedMisalignmentAlerts,
  } = useHooks()

  return (
    <ErrorHandler error={null}>
      <PageContent>
        {isFetchingMonthlyQuestions ||
        isFetchingMonthlySummary ||
        isFetchingTopicsData ||
        isFetchingMonthlyTimeSaved ||
        isFetchingUnacknowledgedMisalignmentAlerts ? (
          <Stack alignItems="center" flex={1} justifyContent="center">
            <CircularProgress />
          </Stack>
        ) : (
          <Stack height="100vh" overflow="hidden">
            <Grid container={true} flexGrow={1} height="100%" spacing={2}>
              <Grid container={true} gap={2} item={true} md={9} xs={12}>
                {/* <DashboardStatsSection
                  statistics={monthlySummary}
                  title="Human Resources"
                /> */}
                <Grid container={true} spacing={2}>
                  <Grid item={true} md={6} xs={12}>
                    <GoalsAndVision />
                  </Grid>
                  <Grid item={true} md={6} xs={12}>
                    <DashboardSentimentChart />
                  </Grid>
                </Grid>
                {/* <DashboardStatsSection
                  statistics={monthlySummary}
                  title="Product"
                /> */}
              </Grid>
            </Grid>
          </Stack>
        )}
      </PageContent>
    </ErrorHandler>
  )
}

export default ArchivedDashboardPage
