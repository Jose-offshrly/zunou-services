import { useGetLiveInsightsQuery } from '@zunou-queries/core/hooks/useGetLiveInsightsQuery'
import { useEffect, useRef, useState } from 'react'

import { useOrganization } from '~/hooks/useOrganization'

interface Props {
  hasMessages: boolean
  isLoadingMessages: boolean
}

export const useInsights = ({ hasMessages, isLoadingMessages }: Props) => {
  const { organizationId } = useOrganization()

  const hasInitialized = useRef(false)

  const [showOnboardingMessage, setShowOnboardingMessage] = useState(false)

  const { data: liveInsightsData, isLoading: isLoadingInsights } =
    useGetLiveInsightsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!organizationId,
      variables: {
        filter: {
          organizationId,
        },
        perPage: 1,
      },
    })

  const insights =
    liveInsightsData?.pages.flatMap((page) => page.myLiveInsights.data) ?? []

  useEffect(() => {
    if (isLoadingInsights || isLoadingMessages || hasInitialized.current) return

    hasInitialized.current = true

    const hasLiveInsight = insights.length > 0

    if (!hasLiveInsight && !hasMessages) setShowOnboardingMessage(true)
  }, [liveInsightsData, isLoadingInsights, isLoadingMessages, hasMessages])

  return {
    insightsLength: insights.length,
    setShowOnboardingMessage,
    showOnboardingMessage,
  }
}
