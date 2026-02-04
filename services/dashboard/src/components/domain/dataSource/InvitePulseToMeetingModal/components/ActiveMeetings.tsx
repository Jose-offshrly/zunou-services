import { Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import {
  MeetingSessionStatus,
  MeetingSessionType,
  Origin,
} from '@zunou-graphql/core/graphql'
import { useMeetingSessions } from '@zunou-queries/core/hooks/useMeetingSessions'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useMeetingSessionsFilters } from '~/hooks/useMeetingSessionsFilter'
import { useOrganization } from '~/hooks/useOrganization'

import { MeetingList } from './MeetingList'
import { MeetingsToolbar } from './MeetingsToolbar'

export const ActiveMeetings = ({
  isVitalsMode = false,
}: {
  isVitalsMode?: boolean
}) => {
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { user } = useAuthContext()

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

  const queryClient = useQueryClient()

  const {
    data: meetingSessionsData,
    isLoading: isMeetingSessionsLoading,
    error,
  } = useMeetingSessions({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      ...queryVariables,
      origin: isVitalsMode ? Origin.Vitals : Origin.Pulse,
    },
  })

  const activePausedMeetings = useMemo(() => {
    return (
      meetingSessionsData?.meetingSessions.filter(
        (session) =>
          (session.status === MeetingSessionStatus.Active ||
            session.status === MeetingSessionStatus.Paused) &&
          session.type === MeetingSessionType.Meeting,
      ) ?? []
    )
  }, [meetingSessionsData])

  const filteredMeetings = useMemo(() => {
    return filterBySearchQuery(activePausedMeetings ?? [])
  }, [activePausedMeetings, searchQuery])

  useEffect(() => {
    // If there's been a change in active meetings invalidate the sidebar
    queryClient.invalidateQueries({
      queryKey: ['meetingSessions', organizationId, pulseId, user?.id],
    })
  }, [activePausedMeetings])

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
        <Typography>Error loading active meetings</Typography>
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
