import {
  MeetingSession,
  MeetingSessionStatus,
  MeetingSessionType,
  Origin,
} from '@zunou-graphql/core/graphql'
import { useGetCollabsQuery } from '@zunou-queries/core/hooks/useGetCollabsQuery'
import { useMeetingSessions } from '@zunou-queries/core/hooks/useMeetingSessions'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

interface LiveMeetingsContextValue {
  activeMeetings: MeetingSession[]
  activeCollabs: MeetingSession[]
  totalLive: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meetingSessionsError: any
  isCollabsLoading: boolean
  isMeetingSessionsLoading: boolean
  refetchMeetingSessions: () => void
  refetchCollab: () => void
}

const LiveMeetingsContext = createContext<LiveMeetingsContextValue | undefined>(
  undefined,
)

interface LiveMeetingsProviderProps {
  children: ReactNode
}

export const LiveMeetingsProvider = ({
  children,
}: LiveMeetingsProviderProps) => {
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()

  // Only fetch if we have pulseId
  const shouldFetch = Boolean(pulseId && organizationId)

  const {
    data: meetingSessionsData,
    isLoading: isMeetingSessionsLoading,
    error: meetingSessionsError,
    refetch: refetchMeetingSessions,
  } = useMeetingSessions({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: shouldFetch,
    variables: {
      organizationId,
      origin: Origin.Pulse,
      pulseId,
    },
  })

  const {
    data: collabsData,
    isLoading: isCollabsLoading,
    refetch: refetchCollab,
  } = useGetCollabsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: shouldFetch,
    variables: {
      default: true,
      organizationId,
      pulseId,
    },
  })

  const activeMeetings = useMemo(
    () =>
      meetingSessionsData?.meetingSessions.filter(
        (session) =>
          (session.status === MeetingSessionStatus.Active ||
            session.status === MeetingSessionStatus.Paused) &&
          session.invite_pulse &&
          session.type === MeetingSessionType.Meeting,
      ) ?? [],
    [meetingSessionsData],
  )

  const activeCollabs = useMemo(() => collabsData?.collabs ?? [], [collabsData])

  const totalLive = useMemo(
    () => activeMeetings.length + activeCollabs.length,
    [activeMeetings, activeCollabs],
  )

  // Pusher subscriptions - only when we have the required IDs
  usePusherChannel({
    channelName:
      shouldFetch && user?.id
        ? `collab-invite.${user.id}.pulse.${pulseId}`
        : null,
    eventName: '.collab-invite',
    onEvent: refetchCollab,
  })

  usePusherChannel({
    channelName:
      shouldFetch && user?.id
        ? `collab-toggle.${user.id}.pulse.${pulseId}`
        : null,
    eventName: '.collab-toggle',
    onEvent: refetchCollab,
  })

  usePusherChannel({
    channelName:
      shouldFetch && user?.id
        ? `collab-ended.${user.id}.pulse.${pulseId}`
        : null,
    eventName: '.collab-ended',
    onEvent: refetchCollab,
  })

  usePusherChannel({
    channelName: shouldFetch
      ? `meeting-session.${organizationId}.pulse.${pulseId}`
      : null,
    eventName: '.meeting-session-status-updated',
    onEvent: refetchMeetingSessions,
  })

  const value = useMemo(
    () => ({
      activeCollabs,
      activeMeetings,
      isCollabsLoading,
      isMeetingSessionsLoading,
      meetingSessionsError,
      refetchCollab,
      refetchMeetingSessions,
      totalLive,
    }),
    [
      activeMeetings,
      activeCollabs,
      totalLive,
      meetingSessionsError,
      isCollabsLoading,
      isMeetingSessionsLoading,
      refetchMeetingSessions,
      refetchCollab,
    ],
  )

  return (
    <LiveMeetingsContext.Provider value={value}>
      {children}
    </LiveMeetingsContext.Provider>
  )
}

export const useLiveMeetings = () => {
  const context = useContext(LiveMeetingsContext)
  if (context === undefined) {
    throw new Error(
      'useLiveMeetings must be used within a LiveMeetingsProvider',
    )
  }
  return context
}
