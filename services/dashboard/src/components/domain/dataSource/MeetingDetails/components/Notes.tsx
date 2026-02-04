import { GroupsOutlined, LocalOfferOutlined } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { DataSource } from '@zunou-graphql/core/graphql'
import { useGetLiveInsightsQuery } from '@zunou-queries/core/hooks/useGetLiveInsightsQuery'
import { Button, Chip } from '@zunou-react/components/form'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { usePanelsStore } from '~/store/usePanelsStore'

import { ParsedMeetingSummary } from '../MeetingDetails'
import { AssistantDropdown } from './AssistantDropdown'
import MiniInsightCard from './MiniInsightCard'
import Tldr from './Tldr'

const NotesLoader = () => (
  <Stack spacing={2}>
    <Stack spacing={1}>
      <LoadingSkeleton height={28} width={180} />
      <LoadingSkeleton height={20} width={160} />
    </Stack>

    <Stack spacing={1}>
      <LoadingSkeleton height={32} />
      <LoadingSkeleton height={24} width={200} />
    </Stack>

    <Stack direction="row" flexWrap="wrap" sx={{ gap: 1 }}>
      <LoadingSkeleton height={32} width={80} />
      <LoadingSkeleton height={32} width={100} />
      <LoadingSkeleton height={32} width={90} />
      <LoadingSkeleton height={32} width={70} />
    </Stack>

    <Stack spacing={2}>
      <LoadingSkeleton height={120} />
    </Stack>

    <Stack spacing={2}>
      <LoadingSkeleton height={100} />
    </Stack>
  </Stack>
)

const Attendees = ({ attendees }: { attendees: string[] }) => {
  const MAX_VISIBLE = 3

  const [showAll, setShowAll] = useState(false)
  const visibleAttendees = showAll ? attendees : attendees.slice(0, MAX_VISIBLE)
  const hiddenCount = attendees.length - MAX_VISIBLE

  const toggleShow = () => setShowAll((prev) => !prev)

  if (attendees.length <= 0) return null

  return (
    <Stack alignItems="center" direction="row" flexWrap="wrap" spacing={1}>
      <Stack alignItems="center" direction="row" gap={1}>
        <GroupsOutlined
          sx={{
            fontSize: 16,
          }}
        />
        <Typography variant="body2">Attendees:</Typography>
      </Stack>
      {visibleAttendees.map((email, index) => (
        <Typography color="text.secondary" key={index} variant="body2">
          {email}
          {index < visibleAttendees.length - 1 ? ',' : ''}
        </Typography>
      ))}
      {attendees.length > MAX_VISIBLE && (
        <Typography
          component="span"
          onClick={toggleShow}
          sx={{
            '&:hover': { cursor: 'pointer', textDecoration: 'underline' },
            color: 'text.secondary',
          }}
          variant="caption"
        >
          {showAll ? 'See less' : `+${hiddenCount} more`}
        </Typography>
      )}
    </Stack>
  )
}

const Keywords = ({ keywords }: { keywords: string[] }) => {
  const MAX_VISIBLE = 4

  const [showAll, setShowAll] = useState(false)
  const visibleKeywords = showAll ? keywords : keywords.slice(0, MAX_VISIBLE)
  const hiddenCount = keywords.length - MAX_VISIBLE

  const toggleShow = () => setShowAll((prev) => !prev)

  if (keywords.length <= 0) return null

  return (
    <Stack alignItems="center" direction="row" flexWrap="wrap" sx={{ gap: 1 }}>
      <Stack alignItems="center" direction="row" gap={1}>
        <LocalOfferOutlined
          sx={{
            fontSize: 16,
          }}
        />
        <Typography variant="body2">Tags:</Typography>
      </Stack>
      {visibleKeywords.map((item, index) => (
        <Chip
          color="primary"
          key={index}
          label={item}
          size="small"
          sx={{
            borderColor: 'divider',
            borderRadius: 9999,
            fontWeight: 500,
            p: 1,
          }}
          variant="outlined"
        />
      ))}
      {keywords.length > MAX_VISIBLE && (
        <Typography
          component="span"
          onClick={toggleShow}
          sx={{
            '&:hover': { cursor: 'pointer', textDecoration: 'underline' },
            color: 'text.secondary',
          }}
          variant="caption"
        >
          {showAll ? 'See less' : `+${hiddenCount} more`}
        </Typography>
      )}
    </Stack>
  )
}

interface NotesProps {
  dataSource: DataSource | undefined
  isLoadingDataSource: boolean
  parsedSummary: ParsedMeetingSummary | null
  onCreateTasks?: () => void
  onViewAllInsights?: () => void
  onClose?: () => void
}

const Notes = ({
  dataSource,
  isLoadingDataSource,
  parsedSummary,
  onCreateTasks,
  onViewAllInsights,
  onClose,
}: NotesProps) => {
  const { t } = useTranslation('sources')
  // const { user } = useAuthContext()

  // const timezone = user?.timezone ?? 'UTC'

  const { organizationId } = useParams()

  const { togglePanel } = usePanelsStore()

  const { data: insightsData, isLoading: isLoadingInsights } =
    useGetLiveInsightsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!organizationId && !!dataSource?.meeting?.id,
      variables: {
        filter: {
          // statuses: [
          //   InsightStatus.Pending,
          //   InsightStatus.Delivered,
          //   InsightStatus.Seen,
          //   InsightStatus.Closed,
          // ],
          meetingId: dataSource?.meeting?.id,

          organizationId,
        },
        perPage: 2,
      },
    })

  const insights =
    insightsData?.pages.flatMap((page) => page.myLiveInsights.data) ?? []

  const onInsightClick = () => {
    onClose?.()
    togglePanel('meetings')
  }

  return (
    <Stack height="100%" spacing={2}>
      {isLoadingDataSource ? (
        <NotesLoader />
      ) : !dataSource?.summary ? (
        <Stack
          alignItems="center"
          height="100%"
          justifyContent="center"
          p={2}
          spacing={2}
        >
          <Typography color="text.secondary" variant="body1">
            {t('no_meeting_summary_available')}
          </Typography>
        </Stack>
      ) : (
        <Stack direction="row" gap={2}>
          {/* Main Content */}
          <Stack flex={6} gap={2}>
            <Stack
              alignItems="start"
              borderBottom={1}
              borderColor="divider"
              gap={2}
              justifyContent="start"
              pb={2}
            >
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="end"
                width="100%"
              >
                {/* <Stack>
                <Typography
                  color="text.primary"
                  fontSize={20}
                  fontWeight="bold"
                >
                  {parsedSummary?.title}
                </Typography>
                <Typography color="text.secondary" fontSize={14}>
                   Receive UTC from BE convert to user's tz
                  {dayjs.utc(parsedSummary?.date).tz(timezone).format('LLL')}
                </Typography>
              </Stack> */}
              </Stack>

              <Attendees attendees={parsedSummary?.attendees ?? []} />

              <Keywords keywords={parsedSummary?.keywords ?? []} />
            </Stack>

            <Stack spacing={1}>
              <Typography fontWeight="bold">Overview</Typography>
              <ul>
                {parsedSummary?.overview.map((item, index) => (
                  <li key={index}>
                    <Typography color="text.secondary" variant="body2">
                      {item}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Stack>

            <Stack spacing={1}>
              <Typography fontWeight="bold">
                {t('potential_strategy')}
              </Typography>
              <ul>
                {parsedSummary?.strategies.map((strategy, index) => (
                  <li key={index}>
                    <Typography color="text.secondary" variant="body2">
                      {strategy}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Stack>
          </Stack>

          {/* Side Content */}
          <Stack flex={3} gap={2} height="100%" justifyContent="start">
            <Tldr content={dataSource.tldr ?? undefined}>
              <AssistantDropdown
                dataSourceId={dataSource.id}
                dataSourceName={dataSource.name}
                dataSourceStatus={dataSource.status}
                onCreateTasks={onCreateTasks}
              />
            </Tldr>

            <Stack gap={1}>
              <Stack
                alignItems="center"
                direction="row"
                gap={2}
                justifyContent="space-between"
              >
                <Typography fontWeight="bold">Insights</Typography>

                <Button
                  onClick={onViewAllInsights}
                  size="small"
                  sx={{
                    color: 'grey.500',
                  }}
                  variant="text"
                >
                  View All
                </Button>
              </Stack>

              {isLoadingInsights ? (
                <Stack alignContent="center" gap={2} justifyContent="center">
                  <LoadingSkeleton height={80} />
                  <LoadingSkeleton height={80} />
                </Stack>
              ) : (
                <Stack gap={1}>
                  {insights.map((insight) => (
                    <MiniInsightCard
                      insight={insight}
                      key={insight.id}
                      onClickCallback={onInsightClick}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}

export default Notes
