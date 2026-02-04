import { Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import { SyncStatus } from '@zunou-graphql/core/graphql'
import { useGetIntegration } from '@zunou-queries/core/hooks/useGetIntegration'
import { useRefetchIntegrationMutation } from '@zunou-queries/core/hooks/useRefetchIntegrationMutation'
import { Button, LoadingButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import {
  TabIdentifier,
  useDataSourceContext,
} from '~/context/DataSourceContext'
import { usePusherChannel } from '~/hooks/usePusherChannel'

import AddedMeetings from './AddedMeetings'
import IgnoredMeetings from './IgnoredMeetings'
import MeetingListButton from './MeetingListButton'
import ViewAllMeetings from './ViewAllMeetings'

export enum MeetingListIdentifier {
  ALL = 'all',
  ADDED = 'added',
  IGNORED = 'ignored',
}

interface ManageMeetingsProps {
  setAddMeetingMode: (val: boolean) => void
}

export const ManageMeetings = ({ setAddMeetingMode }: ManageMeetingsProps) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { setActiveTab } = useDataSourceContext()
  const { user } = useAuthContext()
  const { pulseId } = useParams<{ pulseId: string }>()

  const MEETING_LABEL = [
    { id: MeetingListIdentifier.ALL, label: t('view_all') },
    { id: MeetingListIdentifier.ADDED, label: t('added') },
    { id: MeetingListIdentifier.IGNORED, label: t('ignored') },
  ]

  const {
    data: firefliesIntegrationData,
    isLoading: isLoadingFirefliesIntegration,
  } = useGetIntegration({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId: pulseId,
      type: 'fireflies',
      userId: user?.id,
    },
  })
  const firefliesIntegration = firefliesIntegrationData?.integration

  const { mutate: refetchIntegration, isPending: isPendingRefetchIntegration } =
    useRefetchIntegrationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const [activeMeetingList, setActiveMeetingList] =
    useState<MeetingListIdentifier>(MeetingListIdentifier.ALL)

  usePusherChannel({
    channelName: pulseId && `pulse.${pulseId}`,
    eventName: '.meetings-synced',
    onEvent: () => {
      queryClient.invalidateQueries({
        queryKey: ['meetings', user?.id, pulseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['integration'],
      })
    },
  })

  const fetchHandler = () => {
    if (!user?.id) return

    if (!pulseId) return

    refetchIntegration(
      {
        pulse_id: pulseId,
        type: 'fireflies',
        user_id: user.id,
      },
      {
        onError: (error) => {
          toast.error(t('fetch_fireflies_error', { ns: 'sources' }))
          console.error('Failed to refetch Fireflies meetings: ', error)
        },
        onSuccess: (response) => {
          if (response.refetchIntegration.sync_status === SyncStatus.Done)
            toast.success(t('fetch_fireflies_success', { ns: 'sources' }))
          else if (
            response.refetchIntegration.sync_status === SyncStatus.InProgress
          )
            toast.success(t('fireflies_meetings_syncing', { ns: 'sources' }))
          else toast.error(t('fetch_fireflies_error', { ns: 'sources' }))
        },
      },
    )
  }

  const linkToFirefliesHandler = () => {
    setActiveTab(TabIdentifier.INTEGRATIONS)
  }

  const addMeetingHandler = () => {
    setAddMeetingMode(true)
  }

  return (
    <Stack height="100%" width="100%">
      <Stack gap={2} height="100%" width="100%">
        {/* Header */}
        <Stack gap={2}>
          <Stack
            alignItems="center"
            direction="row"
            gap={2}
            justifyContent="space-between"
          >
            <Stack alignItems="start" justifyContent="start">
              <Typography color="text.primary" fontSize={21} fontWeight={600}>
                {t('manage_meetings', { ns: 'sources' })}
              </Typography>
              <Typography color="text.secondary" fontSize={14} fontWeight={400}>
                {t('manage_meetings_description', { ns: 'sources' })}
              </Typography>
            </Stack>

            <Stack direction={{ md: 'row' }} gap={1}>
              <LoadingButton
                loading={
                  isLoadingFirefliesIntegration || isPendingRefetchIntegration
                }
                onClick={() =>
                  firefliesIntegration
                    ? fetchHandler()
                    : linkToFirefliesHandler()
                }
                sx={{ minWidth: 120 }}
                variant="outlined"
              >
                {firefliesIntegration
                  ? t('fetch', { ns: 'sources' })
                  : t('link_fireflies', { ns: 'sources' })}
              </LoadingButton>
              <Button
                onClick={addMeetingHandler}
                sx={{ height: 40, minWidth: 120 }}
                variant="contained"
              >
                {t('add')}
              </Button>
            </Stack>
          </Stack>

          {firefliesIntegration && !isLoadingFirefliesIntegration && (
            <Stack direction="row" gap={0.5}>
              <Typography
                color="text.secondary"
                fontSize="small"
                fontStyle="italic"
              >
                {t('integrations', { ns: 'sources' })}:
              </Typography>
              <Typography
                color="red"
                fontSize="small"
                fontStyle="italic"
                fontWeight="100"
                sx={{ textDecoration: 'underline' }}
              >
                Fireflies
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Meeting Navigation */}
        <Stack
          borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
          direction="row"
          gap={4}
        >
          {MEETING_LABEL.map((meeting) => (
            <MeetingListButton
              isActive={activeMeetingList === meeting.id}
              key={meeting.id}
              onClick={() => setActiveMeetingList(meeting.id)}
            >
              {meeting.label}
            </MeetingListButton>
          ))}
        </Stack>

        {/* Meeting Container */}
        <Stack
          flex={1}
          padding={0}
          sx={{
            height: '100%',
            overflow: 'auto',
          }}
        >
          {activeMeetingList === MeetingListIdentifier.ALL && (
            <ViewAllMeetings />
          )}
          {activeMeetingList === MeetingListIdentifier.ADDED && (
            <AddedMeetings />
          )}
          {activeMeetingList === MeetingListIdentifier.IGNORED && (
            <IgnoredMeetings />
          )}
        </Stack>
      </Stack>
    </Stack>
  )
}
