import { Stack, Typography } from '@mui/material'
import { MeetingSessionStatus, Origin } from '@zunou-graphql/core/graphql'
import { useMeetingSessions } from '@zunou-queries/core/hooks/useMeetingSessions'
import { useMemo } from 'react'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useMeetingSessionsFilters } from '~/hooks/useMeetingSessionsFilter'

import { MeetingList } from './MeetingList'
import { MeetingsToolbar } from './MeetingsToolbar'

export const UpcomingMeetings = ({
  isVitalsMode = false,
}: {
  isVitalsMode?: boolean
}) => {
  const {
    endDate,
    filterBySearchQuery,
    handleSelectDateRange,
    handleTypeChange,
    queryVariables,
    searchQuery,
    setSearchQuery,
    startDate,
    type,
  } = useMeetingSessionsFilters()

  const {
    data: meetingSessionsData,
    isLoading: isMeetingSessionsLoading,
    error,
  } = useMeetingSessions({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      ...queryVariables,
      origin: isVitalsMode ? Origin.Vitals : Origin.Pulse,
      status: MeetingSessionStatus.Inactive,
    },
  })

  const filteredMeetings = useMemo(() => {
    return filterBySearchQuery(meetingSessionsData?.meetingSessions ?? [])
  }, [meetingSessionsData, searchQuery])

  return (
    <Stack height="100%" pt={1} spacing={2}>
      <MeetingsToolbar
        endDate={endDate}
        isVitalsMode={isVitalsMode}
        onDateRangeChange={handleSelectDateRange}
        onSearchChange={setSearchQuery}
        onTypeChange={handleTypeChange}
        searchQuery={searchQuery}
        selectedType={type}
        startDate={startDate}
      />
      {error ? (
        <Typography>Error loading upcoming meetings</Typography>
      ) : isMeetingSessionsLoading ? (
        <Stack
          alignItems="center"
          height="100%"
          justifyContent="center"
          width="100%"
        >
          <LoadingSpinner />
        </Stack>
      ) : (
        <MeetingList
          isQueried={Boolean(searchQuery)}
          isVitalsMode={isVitalsMode}
          meetings={filteredMeetings}
        />
      )}
    </Stack>
  )
}
