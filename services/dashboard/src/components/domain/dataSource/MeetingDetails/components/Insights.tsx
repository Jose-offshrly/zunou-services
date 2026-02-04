import { Stack } from '@mui/material'
import { useGetLiveInsightsQuery } from '@zunou-queries/core/hooks/useGetLiveInsightsQuery'
import { InView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePanelsStore } from '~/store/usePanelsStore'

import MiniInsightCard from './MiniInsightCard'

interface Props {
  onClose?: () => void
}

export default function Insights({ onClose }: Props) {
  const { organizationId } = useParams()

  const { togglePanel } = usePanelsStore()

  const {
    data: insightsData,
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
      },
      perPage: 10,
    },
  })

  const insights =
    insightsData?.pages.flatMap((page) => page.myLiveInsights.data) ?? []

  const onInsightClick = () => {
    togglePanel('meetings')
    onClose?.()
  }

  if (isLoadingInsights) {
    return (
      <Stack
        alignContent="center"
        gap={2}
        justifyContent="center"
        minHeight={400}
      >
        <LoadingSpinner />
      </Stack>
    )
  }

  return (
    <Stack gap={1}>
      {insights.map((insight) => (
        <MiniInsightCard
          insight={insight}
          key={insight.id}
          onClickCallback={onInsightClick}
        />
      ))}

      {hasNextPage && (
        <InView
          onChange={(inview: boolean) => inview && fetchNextPage()}
          threshold={0.1}
          triggerOnce={false}
        >
          {({ ref }) => (
            <div
              ref={ref}
              style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'center',
                minHeight: 32,
                paddingTop: 20,
              }}
            >
              {isFetchingNextPage && <LoadingSpinner />}
            </div>
          )}
        </InView>
      )}
    </Stack>
  )
}
