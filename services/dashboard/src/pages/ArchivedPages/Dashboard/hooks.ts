import { useAcknowledgeMisalignmentAlertMutation } from '@zunou-queries/core/hooks/useAcknowledgeMisalignmentAlertMutation'
import { useGetMonthlyQuestionsQuery } from '@zunou-queries/core/hooks/useGetMonthlyQuestionsQuery'
import { useGetMonthlySummaryQuery } from '@zunou-queries/core/hooks/useGetMonthlySummaryQuery'
import { useGetMonthlyTimeSavedQuery } from '@zunou-queries/core/hooks/useGetMonthlyTimeSavedQuery'
import { useGetMonthlyTrendingTopicsQuery } from '@zunou-queries/core/hooks/useGetMonthlyTrendingTopicsQuery'
import { useGetUnacknowledgedMisalignmentAlertsQuery } from '@zunou-queries/core/hooks/useGetUnacknowledgedMisalignmentAlertsQuery'

import { useOrganization } from '~/hooks/useOrganization'

export const useHooks = () => {
  const { organizationId } = useOrganization()
  const date = new Date()

  const currentMonth = date.getMonth() + 1
  const currentYear = date.getFullYear()

  const { data: trendingTopicsData, isFetching: isFetchingTopicsData } =
    useGetMonthlyTrendingTopicsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        month: currentMonth,
        organizationId,
        year: currentYear,
      },
    })

  const { data: monthlySummaryData, isFetching: isFetchingMonthlySummary } =
    useGetMonthlySummaryQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        month: 9,
        organizationId,
        year: currentYear,
      },
    })

  const { data: monthlyQuestionsData, isFetching: isFetchingMonthlyQuestions } =
    useGetMonthlyQuestionsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        month: currentMonth,
        organizationId,
        year: currentYear,
      },
    })

  const { data: monthlyTimeSavedData, isFetching: isFetchingMonthlyTimeSaved } =
    useGetMonthlyTimeSavedQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        month: currentMonth,
        organizationId,
        year: currentYear,
      },
    })
  const {
    data: unacknowledgedMisalignmentAlertsData,
    isFetching: isFetchingUnacknowledgedMisalignmentAlerts,
  } = useGetUnacknowledgedMisalignmentAlertsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })

  const { mutateAsync: acknowledgeMisalignmentAlert } =
    useAcknowledgeMisalignmentAlertMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const unacknowledgedMisalignmentAlerts =
    unacknowledgedMisalignmentAlertsData?.unacknowledgedMisalignmentAlerts
      .data ?? []
  const monthlyTimeSaved = monthlyTimeSavedData?.monthlyTimeSaved ?? []
  const trendingTopics = trendingTopicsData?.monthlyTrendingTopics ?? []
  const monthlySummary = monthlySummaryData?.monthlySummary ?? []
  const monthlyQuestions = monthlyQuestionsData?.monthlyQuestions ?? []

  return {
    acknowledgeMisalignmentAlert,
    isFetchingMonthlyQuestions,
    isFetchingMonthlySummary,
    isFetchingMonthlyTimeSaved,
    isFetchingTopicsData,
    isFetchingUnacknowledgedMisalignmentAlerts,
    monthlyQuestions,
    monthlySummary,
    monthlyTimeSaved,
    organizationId,
    trendingTopics,
    unacknowledgedMisalignmentAlerts,
  }
}
