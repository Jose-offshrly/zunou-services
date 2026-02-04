import { Groups } from '@mui/icons-material'
import { Divider, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Stack } from '@mui/system'
import { Meeting as TMeeting } from '@zunou-graphql/core/graphql'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

import { MeetingListIdentifier } from './ManageMeetings'
import { Meeting } from './Meeting'
import SearchFilterMeetings from './SearchFilterMeetings'

// Filter options abstracted as a constant
const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Fireflies', value: 'fireflies' },
  { label: 'Manual', value: 'manual' },
]

const EmptyMeetings = ({ type }: { type: MeetingListIdentifier }) => {
  const { t } = useTranslation('sources')

  return (
    <Stack
      alignItems="center"
      gap={2}
      height="100%"
      justifyContent="center"
      pt={2}
      width="100%"
    >
      <Stack
        sx={{
          alignItems: 'center',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          borderRadius: '50%',
          display: 'flex',
          height: 80,
          justifyContent: 'center',
          width: 80,
        }}
      >
        <Groups color="primary" sx={{ fontSize: 40 }} />
      </Stack>
      <Stack alignItems="center">
        <Typography
          color="text.secondary"
          sx={{ textAlign: 'center' }}
          variant="caption"
        >
          {t('no_meetings_found')}
        </Typography>
        {type === MeetingListIdentifier.ALL && (
          <Typography
            color="text.secondary"
            sx={{ textAlign: 'center' }}
            variant="caption"
          >
            {t('no_meetings_add_prompt')}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}

interface MeetingListProps {
  meetings: TMeeting[] | null
  isLoading: boolean
  type: MeetingListIdentifier
}

export const MeetingsList = ({
  meetings,
  isLoading,
  type,
}: MeetingListProps) => {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const { pulseId } = useParams<{ pulseId: string }>()

  // State
  const [filteredMeetings, setFilteredMeetings] = useState<TMeeting[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterValue, setFilterValue] = useState('all')

  // Refs
  const meetingsRef = useRef<TMeeting[] | null>(null)

  // Derived state
  const isFilterActive = useMemo(
    () => searchQuery !== '' || filterValue !== 'all',
    [searchQuery, filterValue],
  )

  const meetingsToRender = useMemo(
    () => (isFilterActive ? filteredMeetings : meetings || []),
    [isFilterActive, filteredMeetings, meetings],
  )

  // Data fetching
  const { data: firefliesIntegrationData } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'fireflies',
      userId: user?.id,
    },
  })

  // Filter functions
  const applyFilters = useCallback((query: string, filter: string) => {
    if (!meetingsRef.current) {
      setFilteredMeetings([])
      return
    }

    // setIsDelaying(true)
    const meetingsSrc = meetingsRef.current || []
    const regex = new RegExp(query, 'i')

    const filtered = meetingsSrc.filter(
      (meeting) =>
        regex.test(meeting.title) &&
        (filter === 'all' || filter === String(meeting.source)),
    )

    setFilteredMeetings(filtered)
    // setIsDelaying(false)
  }, [])

  const handleSearchFilterChange = useCallback(
    (query: string, filter: string) => {
      const newIsFilterActive = query !== '' || filter !== 'all'

      setSearchQuery(query)
      setFilterValue(filter)

      if (newIsFilterActive) {
        applyFilters(query, filter)
      }
    },
    [applyFilters],
  )

  // Effects
  useEffect(() => {
    meetingsRef.current = meetings

    if (isFilterActive) {
      applyFilters(searchQuery, filterValue)
    }
  }, [meetings, isFilterActive, searchQuery, filterValue, applyFilters])

  const renderMeetingItems = () =>
    meetingsToRender.map((meeting) => (
      <Meeting
        datetime={meeting.date}
        id={meeting.id}
        integrationId={firefliesIntegrationData?.integration?.id ?? null}
        key={meeting.id}
        mode={type}
        organizer={meeting?.organizer ?? 'Unknown'}
        source={meeting.source}
        status={meeting.status}
        title={meeting.title}
      />
    ))

  return (
    <Stack gap={2} height="100%" width="100%">
      <SearchFilterMeetings
        filterOptions={FILTER_OPTIONS}
        initialFilter={filterValue}
        initialQuery={searchQuery}
        onSubmit={handleSearchFilterChange}
        placeholder={t('search')}
      />

      <Stack
        divider={!isLoading && <Divider />}
        height="100%"
        overflow="auto"
        pr={4}
        py={1}
        spacing={1}
      >
        {isLoading && (
          <Stack
            alignItems="center"
            height="100%"
            justifyContent="center"
            width="100%"
          >
            <LoadingSpinner />
          </Stack>
        )}

        {!isLoading && (
          <>
            {meetingsToRender.length > 0 ? (
              renderMeetingItems()
            ) : (
              <EmptyMeetings type={type} />
            )}
          </>
        )}
      </Stack>
    </Stack>
  )
}
