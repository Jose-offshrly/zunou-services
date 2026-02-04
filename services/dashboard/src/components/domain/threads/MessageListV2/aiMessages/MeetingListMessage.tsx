import { List, ListItem } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateMeetingDataSourceMutation } from '@zunou-queries/core/hooks/useCreateMeetingDataSourceMutation'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { MeetingListItem } from '~/components/domain/dataSource/DataSourceSetup/tabs/MeetingsTab/components/MeetingListItem'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

interface Meeting {
  id: string
  pulse_id: string
  user_id: string
  meeting_id: string
  title: string
  date: string
  organizer_name: string
  organizer_profile: string
}

interface MeetingListMessageProps {
  meetings: Meeting[]
}

export const MeetingListMessage = ({ meetings }: MeetingListMessageProps) => {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleMeetingsSynced = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['meetings', user?.id, pulseId],
    })
    queryClient.invalidateQueries({
      queryKey: ['integration'],
    })
  }, [queryClient, user?.id, pulseId])

  usePusherChannel({
    channelName: pulseId && `pulse.${pulseId}`,
    eventName: '.meetings-synced',
    onEvent: handleMeetingsSynced,
  })

  const { data: firefliesIntegrationData } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'fireflies',
      userId: user?.id,
    },
  })
  const firefliesIntegration = firefliesIntegrationData?.integration

  const {
    mutate: createMeetingDataSource,
    isPending: isPendingCreateMeetingDataSource,
  } = useCreateMeetingDataSourceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleCreateMeetingDataSource = (meetingId: string) => {
    if (!firefliesIntegration) {
      return toast.error('Fireflies integration is required.')
    }

    if (!pulseId) {
      return toast.error('Pulse ID is required.')
    }

    setProcessingId(meetingId)

    createMeetingDataSource(
      {
        integrationId: firefliesIntegration.id,
        meetingId,
        organizationId,
        pulseId,
      },
      {
        onError: (error) => {
          toast.error('Failed to add meeting as a data source')
          console.error('Failed to add meeting as a data source: ', error)
        },
        onSettled: () => setProcessingId(null),
        onSuccess: () => {
          toast.success(
            'Adding the meeting as a data source. This may take a few minutes to process.',
          )
        },
      },
    )
  }

  const isLoading = isPendingCreateMeetingDataSource

  return (
    <List disablePadding={true}>
      {meetings.map(({ id, date, organizer_name, title }) => (
        <ListItem disableGutters={true} divider={false} key={id}>
          <MeetingListItem
            date={date}
            isLoading={isLoading && processingId === id}
            key={id}
            onAdd={() => handleCreateMeetingDataSource(id)}
            organizer={organizer_name}
            title={title}
          />
        </ListItem>
      ))}
    </List>
  )
}
