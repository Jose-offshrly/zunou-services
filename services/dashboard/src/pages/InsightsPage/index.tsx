import { ArrowBackOutlined, RefreshOutlined } from '@mui/icons-material'
import {
  alpha,
  Box,
  CircularProgress,
  darken,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { InsightStatus, InsightType } from '@zunou-graphql/core/graphql'
import { useGetLiveInsightsQuery } from '@zunou-queries/core/hooks/useGetLiveInsightsQuery'
import { Button, Chip } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { debounce } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { InView } from 'react-intersection-observer'
import { useNavigate, useParams } from 'react-router-dom'

import { SearchInput } from '~/components/ui/form/SearchInput'
import { useVitalsContext } from '~/context/VitalsContext'
import { Routes } from '~/services/Routes'
import { toTitleCase } from '~/utils/textUtils'

import { EventDetailModal } from '../InsightDetailPage/EventDetailModal'
import { useHooks } from '../VitalsPage/useHooks'
import { InsightCard } from './InsightCard'

interface FilterState {
  status: string
  type: InsightType | null
}

export const InsightsPage = () => {
  const navigate = useNavigate()
  const { organizationId } = useParams()
  const { isLoading: isAuthLoading } = useAuthContext()

  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    type: null,
  })

  const { isLoadingSetting } = useHooks()
  const { setting } = useVitalsContext()
  const isDarkMode = setting?.theme === 'dark'

  // responsive typing
  const [inputValue, setInputValue] = useState('')
  // backend query debounced
  const [searchQuery, setSearchQuery] = useState('')

  // Debounce backend search
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchQuery(value)
      }, 500),
    [],
  )

  useEffect(() => {
    return () => debouncedSetSearch.cancel()
  }, [debouncedSetSearch])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value) // instant UI update
    debouncedSetSearch(value) // debounced API update
  }

  const getStatusesForBackend = (
    status: string,
  ): InsightStatus[] | undefined => {
    if (status === 'all') return undefined
    if (status === 'new')
      return [InsightStatus.Pending, InsightStatus.Delivered]
    if (status === 'seen') return [InsightStatus.Seen]
    if (status === 'completed') return [InsightStatus.Closed]
    return undefined
  }

  const {
    data,
    isLoading: isLoadingInsights,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching: isRefetchingInsights,
  } = useGetLiveInsightsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!organizationId,
    variables: {
      filter: {
        organizationId: organizationId,
        search: searchQuery,
        statuses: getStatusesForBackend(filter.status),
        type: filter.type ?? undefined,
      },
      perPage: 20,
    },
  })

  const insights = data?.pages.flatMap((page) => page.myLiveInsights.data) ?? []
  const isLoading =
    isAuthLoading ||
    isLoadingInsights ||
    isRefetchingInsights ||
    isLoadingSetting

  const colorMap = {
    action: theme.palette.common.dandelion,
    decision: theme.palette.common.blue,
    risk: theme.palette.error.main,
  }

  const pathToRecommendedInsights = pathFor({
    pathname: Routes.RecommendedInsights,
    query: { organizationId },
  })

  const handleLoadMore = (inView: boolean) => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleStatusChange = (status: string) => {
    setFilter((prev) => ({
      ...prev,
      status,
    }))
  }

  const handleTypeChange = (type: InsightType) => {
    if (type === filter.type) {
      setFilter((prev) => ({
        ...prev,
        type: null,
      }))
      return
    }

    setFilter((prev) => ({
      ...prev,
      type,
    }))
  }

  const handleClearFilters = () => {
    setFilter({
      status: 'all',
      type: null,
    })
  }

  const handleViewEvent = (e: React.MouseEvent, meetingId: string) => {
    e.stopPropagation()
    setActiveMeetingId(meetingId)
  }

  return (
    <>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Button
          onClick={() => navigate(pathToRecommendedInsights)}
          startIcon={<ArrowBackOutlined fontSize="small" />}
          sx={{
            alignSelf: 'flex-start',
            color: isDarkMode ? 'grey.300' : 'inherit',
          }}
        >
          Back to Recommended
        </Button>

        <SearchInput
          autofocus={false}
          onChange={handleSearchChange}
          onClear={() => {
            setInputValue('')
            setSearchQuery('')
            debouncedSetSearch.cancel()
          }}
          placeholder="Search"
          rounded={true}
          sx={{
            '& .MuiOutlinedInput-input': {
              color: isDarkMode ? 'grey.300' : 'inherit',
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: isDarkMode ? 'grey.500' : 'text.secondary',
              opacity: 1,
            },
            maxWidth: 400,
            width: '100%',
          }}
          value={inputValue}
        />
      </Stack>

      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{
          color: isDarkMode ? 'grey.200' : 'inherit',
          mt: 3,
        }}
      >
        <Stack
          direction="row"
          divider={<Divider flexItem={true} orientation="vertical" />}
          spacing={2}
        >
          {/* STATUS */}
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography color="inherit" variant="caption">
              STATUS
            </Typography>
            {['all', 'new', 'seen', 'completed'].map((status) => {
              const isActive = filter.status === status
              return (
                <Box
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  sx={{
                    borderBottom: '2px solid',
                    borderColor: isActive ? 'primary.main' : 'transparent',
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0.4,
                    px: 0.5,
                  }}
                >
                  <Typography
                    color={isActive ? 'primary.main' : 'inherit'}
                    variant="body2"
                  >
                    {toTitleCase(status)}
                  </Typography>
                </Box>
              )
            })}
          </Stack>

          {/* TYPE */}
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography color="inherit" variant="caption">
              TYPE
            </Typography>
            {Object.values(InsightType).map((type) => {
              const isActive = filter.type === type
              const baseColor = colorMap[type] ?? theme.palette.grey[400]
              return (
                <Chip
                  key={type}
                  label={type.toUpperCase()}
                  onClick={() => handleTypeChange(type)}
                  size="small"
                  sx={{
                    '& .MuiChip-label': { fontSize: '0.725rem' },
                    '&:hover': {
                      bgcolor: alpha(baseColor, isActive ? 0.2 : 0.1),
                    },
                    bgcolor: alpha(baseColor, 0.2),
                    borderColor: isActive
                      ? baseColor
                      : alpha(theme.palette.text.primary, 0.05),
                    color: isActive
                      ? darken(baseColor, 0.2)
                      : alpha(theme.palette.text.secondary, 0.9),
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0.4,
                    px: 0.5,
                    transition: 'all 0.2s ease',
                    width: 'fit-content',
                  }}
                  variant="outlined"
                />
              )
            })}
          </Stack>

          <Button
            onClick={handleClearFilters}
            size="small"
            sx={{ color: 'inherit', fontSize: 12 }}
          >
            CLEAR FILTERS
          </Button>
        </Stack>

        <Button
          onClick={() => refetch()}
          startIcon={<RefreshOutlined fontSize="small" />}
          sx={{
            color: 'inherit',
            fontSize: 12,
          }}
          variant="text"
        >
          REFRESH
        </Button>
      </Stack>

      <Box flex={1} overflow="auto" sx={{ flexGrow: 1, mt: 2, pr: 1 }}>
        {isLoading ? (
          <Stack alignItems="center" height="100%" justifyContent="center">
            <CircularProgress size={20} />
          </Stack>
        ) : insights.length === 0 ? (
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'center',
              minHeight: 300,
              py: 4,
            }}
          >
            <Typography color="text.secondary" variant="h6">
              No Insights Found
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
              Try adjusting your filters.
            </Typography>
          </Box>
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
                  delivery_status,
                  meeting,
                }) => (
                  <Grid item={true} key={id} lg={3} md={4} sm={6} xs={12}>
                    <InsightCard
                      createdAt={created_at}
                      description={description}
                      id={id}
                      meetingId={meeting.meetingId}
                      onViewEvent={handleViewEvent}
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
                    pt: 6,
                  }}
                >
                  {isFetchingNextPage && <CircularProgress size={20} />}
                </Box>
              )}
            </InView>
          </>
        )}
      </Box>

      {activeMeetingId && (
        <EventDetailModal
          id={activeMeetingId}
          isOpen={!!activeMeetingId}
          onClose={() => setActiveMeetingId(null)}
        />
      )}
    </>
  )
}
