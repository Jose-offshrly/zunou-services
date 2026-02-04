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
import {
  InsightStatus,
  InsightType,
  PulseCategory,
} from '@zunou-graphql/core/graphql'
import { useGetLiveInsightsQuery } from '@zunou-queries/core/hooks/useGetLiveInsightsQuery'
import { Button, Chip, Form } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useRef, useState } from 'react'
import { Control, UseFormHandleSubmit } from 'react-hook-form'
import { InView } from 'react-intersection-observer'
import { useNavigate, useParams } from 'react-router-dom'

import { SlateInput } from '~/components/ui/form/SlateInput'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { ThreadMessageInput } from '~/schemas/ThreadMessageSchema'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'
import { toTitleCase } from '~/utils/textUtils'

import Actions from './Actions'
import { InsightCard } from './InsightCard'

interface Props {
  maxInputWidth?: number
  control: Control<ThreadMessageInput>
  handleSubmit: UseFormHandleSubmit<ThreadMessageInput>
  onSubmit: (data: ThreadMessageInput) => void
  isInputDisabled: boolean
}

interface FilterState {
  status: string
  type: InsightType | null
}

export default function Insights({
  maxInputWidth = 800,
  control,
  handleSubmit,
  onSubmit,
  isInputDisabled,
}: Props) {
  const navigate = useNavigate()
  const { userRole } = useAuthContext()
  const { pulseCategory } = usePulseStore()
  const { organizationId, pulseId } = useParams()
  const { user } = useAuthContext()

  const [showHeader, setShowHeader] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const headerRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)
  const isScrollingProgrammatically = useRef(false)

  const [filter, setFilter] = useState<FilterState>({
    status: 'new',
    type: null,
  })

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
        organizationId: organizationId,

        pulseId: pulseCategory === PulseCategory.Personal ? undefined : pulseId,
        // search: searchQuery,
        statuses: getStatusesForBackend(filter.status),
        type: filter.type ?? undefined,
      },
      perPage: 18,
    },
  })

  const insights =
    insightsData?.pages.flatMap((page) => page.myLiveInsights.data) ?? []
  const isEmpty = !isLoadingInsights && insights.length === 0

  const userName = user?.name ?? 'Unknown'

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    const header = headerRef.current
    const filter = filterRef.current
    if (!scrollContainer || !header || !filter) return

    const headerHeight = header.offsetHeight
    const paddingTop = 32
    const totalHeaderArea = headerHeight + 40
    const snapToPosition = totalHeaderArea + paddingTop

    let ticking = false
    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return

      // Throttle scroll events using requestAnimationFrame
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = scrollContainer.scrollTop
          const scrollDelta = currentScrollY - lastScrollY.current
          const isScrollingDown = scrollDelta > 0

          // Clear any pending timeout
          if (scrollTimeout) {
            clearTimeout(scrollTimeout)
          }

          // At the very top, always show header
          if (currentScrollY < 10) {
            setShowHeader(true)
            lastScrollY.current = currentScrollY
            ticking = false
            return
          }

          // Past the header area entirely - keep header hidden
          if (currentScrollY >= totalHeaderArea) {
            setShowHeader(false)
            lastScrollY.current = currentScrollY
            ticking = false
            return
          }

          // In the transition zone (within header area)
          const snapThreshold = headerHeight * 0.25

          // Wait for scroll to settle before snapping
          scrollTimeout = setTimeout(() => {
            if (isScrollingProgrammatically.current) return

            const finalScrollY = scrollContainer.scrollTop

            // Only snap if we're in the awkward middle zone
            if (
              finalScrollY > snapThreshold &&
              finalScrollY < totalHeaderArea
            ) {
              isScrollingProgrammatically.current = true

              // Decide direction based on position
              const midPoint = totalHeaderArea / 2
              const shouldSnapDown = finalScrollY > midPoint

              if (shouldSnapDown) {
                setShowHeader(false)
                scrollContainer.scrollTo({
                  behavior: 'smooth',
                  top: snapToPosition,
                })
              } else {
                setShowHeader(true)
                scrollContainer.scrollTo({
                  behavior: 'smooth',
                  top: 0,
                })
              }

              setTimeout(() => {
                isScrollingProgrammatically.current = false
                lastScrollY.current = scrollContainer.scrollTop
              }, 600)
            }
          }, 150) // Wait 150ms after scroll stops

          // Update opacity immediately based on scroll position
          const fadeProgress = Math.min(currentScrollY / totalHeaderArea, 1)
          if (isScrollingDown && currentScrollY < totalHeaderArea) {
            setShowHeader(fadeProgress < 0.5)
          } else if (!isScrollingDown && currentScrollY < totalHeaderArea) {
            setShowHeader(fadeProgress < 0.5)
          }

          lastScrollY.current = currentScrollY
          ticking = false
        })

        ticking = true
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [])

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

  const handleClearFilters = () => {
    setFilter({
      status: 'all',
      type: null,
    })
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

  const handleRedirectToInsight = (insightId: string) => {
    const path = `/${userRole}/${pathFor({
      pathname: Routes.PulseInsightDetails,
      query: {
        insightId,
        organizationId,
        pulseId,
      },
    })}`

    console.log(path)

    navigate(path)
  }

  const colorMap = {
    action: theme.palette.common.dandelion,
    decision: theme.palette.common.blue,
    risk: theme.palette.error.main,
  }

  return (
    <Stack
      alignItems="center"
      gap={2}
      height="100%"
      px={4}
      ref={scrollContainerRef}
      sx={{
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
      width="100%"
    >
      {/* Header with fade effect */}
      <Stack
        gap={6}
        maxWidth={maxInputWidth}
        mt={10}
        pt={4}
        ref={headerRef}
        sx={{
          opacity: showHeader ? 1 : 0,
          pointerEvents: showHeader ? 'auto' : 'none',
          transition: 'opacity 300ms',
        }}
        width="100%"
      >
        <Stack gap={1}>
          <Typography
            color="primary.main"
            fontWeight={500}
            textAlign="center"
            variant="h5"
          >
            Hello {userName}
          </Typography>

          <Typography color="text.secondary" textAlign="center" variant="body1">
            Want to act on today&apos;s insights?
          </Typography>
        </Stack>

        <Stack className="joyride-onboarding-tour-3">
          <Form maxWidth={false} onSubmit={handleSubmit(onSubmit)}>
            <SlateInput
              control={control}
              disabledSubmit={isInputDisabled}
              name="message"
              onSubmit={handleSubmit(onSubmit)}
              placeholder="How can I help you today?"
              plainTextMode={true}
              sx={{
                borderRadius: 3,
              }}
              type="PULSE_CHAT"
            />
          </Form>

          <Actions />
        </Stack>
      </Stack>

      {/* Sticky Filter - outside of flex container for proper sticky behavior */}
      <Stack
        ref={filterRef}
        sx={{
          bgcolor: 'background.default',
          opacity: showHeader ? 0 : 1,
          pointerEvents: showHeader ? 'none' : 'auto',
          position: 'sticky',
          py: 2,
          top: 0,
          transition: 'opacity 500ms',
          width: '100%',
          zIndex: 50,
        }}
      >
        <Stack
          direction="row"
          divider={<Divider flexItem={true} orientation="vertical" />}
          gap={4}
        >
          {/* STATUS */}
          <Stack alignItems="center" direction="row" gap={2}>
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
          <Stack alignItems="center" direction="row" gap={2}>
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
      </Stack>

      {/* Grid Section */}
      <Stack flex={1} gap={4} minHeight="100%" position="relative" width="100%">
        {isLoadingInsights ? (
          <Grid container={true} spacing={2}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid item={true} key={index} lg={4} md={6} xs={12}>
                <LoadingSkeleton height={200} variant="rounded" />
              </Grid>
            ))}
          </Grid>
        ) : isEmpty ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{
              height: '100%',
              minHeight: 400,
              py: 8,
              textAlign: 'center',
            }}
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
                      onClick={handleRedirectToInsight}
                      rating={feedback?.rating}
                      status={delivery_status}
                      topic={topic}
                      type={type}
                    />
                  </Grid>
                ),
              )}
            </Grid>
            {hasNextPage && (
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
            )}
            {/* Bottom padding spacer */}
            <Box sx={{ pb: 14 }} />
          </>
        )}
      </Stack>
    </Stack>
  )
}
