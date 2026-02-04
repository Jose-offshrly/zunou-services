import { PlayArrowOutlined } from '@mui/icons-material'
import { Stack } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import {
  MeetingSessionStatus,
  MeetingSessionType,
  Origin,
} from '@zunou-graphql/core/graphql'
import { useGetCollabsQuery } from '@zunou-queries/core/hooks/useGetCollabsQuery'
import { useMeetingSessions } from '@zunou-queries/core/hooks/useMeetingSessions'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InvitePulseToMeetingModal } from '~/components/domain/dataSource/InvitePulseToMeetingModal'
import { WidgetKeysEnum } from '~/components/domain/vitals/widgets'
import { Widget } from '~/components/domain/vitals/widgets/Widget/Widget'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

import ActionButton from '../ActionButton'
import EmptyWidgetPlaceholder from '../EmptyWidgetPlaceholder'
import { SimplifiedMeetingCard } from './components/SimplifiedMeetingCard'

interface ActiveMeetingsWidgetProps {
  widgetId: string
  isExpanded?: boolean
  onExpand?: (isExpanded: boolean) => void
}

export const ActiveMeetingsWidget: React.FC<ActiveMeetingsWidgetProps> = ({
  widgetId,
  isExpanded,
  onExpand,
}) => {
  const { t } = useTranslation('vitals')
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    data: meetingSessionsData,
    isLoading: isMeetingSessionsLoading,
    refetch: refetchMeetingSessions,
  } = useMeetingSessions({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId: user?.id,
    },
  })

  const { data: collabsData, isLoading: isCollabsLoading } = useGetCollabsQuery(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        default: true, // only return collabs that the user is part of and active & paused meetings
        organizationId,
        origin: Origin.Vitals,
      },
    },
  )

  const isMeetingsLoading = isMeetingSessionsLoading || isCollabsLoading

  const filteredMeetingSessions =
    meetingSessionsData?.meetingSessions?.filter(
      (meeting) =>
        (meeting.status === MeetingSessionStatus.Active ||
          meeting.status === MeetingSessionStatus.Paused) &&
        meeting.type === MeetingSessionType.Meeting,
    ) ?? []

  const handleAddEvent = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }
  const handleRefresh = async () => {
    await refetchMeetingSessions()
  }

  const handleCollabInvite = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['collabs', organizationId],
    })
  }, [queryClient, organizationId])

  usePusherChannel({
    channelName:
      user?.id && `collab-invite.${user.id}.organization.${organizationId}`,
    eventName: '.collab-invite',
    onEvent: handleCollabInvite,
  })

  const handleCollabToggle = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['collabs', organizationId],
    })
  }, [queryClient, organizationId])

  usePusherChannel({
    channelName:
      user?.id && `collab-toggle.${user.id}.organization.${organizationId}`,
    eventName: '.collab-toggle',
    onEvent: handleCollabToggle,
  })

  const handleCollabEnded = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['collabs', organizationId],
    })
  }, [queryClient, organizationId])

  usePusherChannel({
    channelName:
      user?.id && `collab-ended.${user.id}.organization.${organizationId}`,
    eventName: '.collab-ended',
    onEvent: handleCollabEnded,
  })

  return (
    <>
      <Widget
        actions={
          <ActionButton handleClick={handleAddEvent} text={t('add_meeting')} />
        }
        id={WidgetKeysEnum.ActiveMeetings}
        isExpanded={isExpanded}
        isLoading={isMeetingsLoading}
        name={t('active_meetings')}
        onExpand={onExpand}
        onRefresh={handleRefresh}
        showRefreshButton={true}
        widgetId={widgetId}
      >
        <Stack gap={1}>
          {collabsData &&
            collabsData.collabs.length > 0 &&
            collabsData.collabs.map((meeting) => (
              <SimplifiedMeetingCard
                initialStatus={meeting.status}
                key={meeting.id}
                meetingId={meeting.id}
                meetingUrl={meeting.meetingUrl}
                pulseId={meeting.pulseId}
                pulseName={meeting?.pulse?.name ?? '-'}
                title={meeting.name ?? t('unknown')}
                type={meeting.type}
              />
            ))}

          {filteredMeetingSessions.length > 0 &&
            filteredMeetingSessions.map((meeting) => (
              <SimplifiedMeetingCard
                initialStatus={meeting.status}
                key={meeting.id}
                meetingId={meeting.id}
                meetingUrl={meeting.meetingUrl}
                pulseId={meeting.pulseId}
                pulseName={meeting?.pulse?.name ?? ''}
                title={meeting.name ?? t('unknown')}
                type={meeting.type}
              />
            ))}
        </Stack>

        {filteredMeetingSessions.length === 0 &&
          (collabsData?.collabs.length ?? 0) === 0 && (
            <EmptyWidgetPlaceholder
              content={t('no_active_meetings')}
              icon={PlayArrowOutlined}
            />
          )}
      </Widget>

      <InvitePulseToMeetingModal
        isOpen={isModalOpen}
        isVitalsMode={true}
        onClose={handleCloseModal}
      />
    </>
  )
}
