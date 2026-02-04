import {
  AccessTimeOutlined,
  ArrowOutward,
  AutoAwesomeOutlined,
  Circle,
  LocationOnOutlined,
} from '@mui/icons-material'
import { ButtonBase, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { DataSourceOrigin } from '@zunou-graphql/core/graphql'
import { useGetMeetingSessionQuery } from '@zunou-queries/core/hooks/useGetMeetingSessionQuery'
import { Link } from '@zunou-react/components/navigation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { useState } from 'react'

import { useHooks } from '~/components/domain/dataSource/DataSourceSidebar/hooks'
import { MeetingDetails } from '~/components/domain/dataSource/MeetingDetails/MeetingDetails'
import { CustomModal } from '~/components/ui/CustomModal'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

dayjs.extend(advancedFormat)

interface EventDetailModalProps {
  isOpen: boolean
  id: string
  onClose: () => void
}

export const EventDetailModal = ({
  id,
  isOpen,
  onClose,
}: EventDetailModalProps) => {
  const { user } = useAuthContext()
  const timezone = user?.timezone ?? 'UTC'
  const { handleDeleteDataSource } = useHooks()
  const [selectedDataSource, setSelectedDataSource] = useState<{
    id: string
    origin: DataSourceOrigin
  } | null>(null)

  const { data: meetingSessionData, isLoading } = useGetMeetingSessionQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      meetingSessionId: id,
    },
  })
  const meetingSession = meetingSessionData?.meetingSession
  const dataSource = meetingSession?.dataSource

  return (
    <CustomModal
      isOpen={isOpen}
      maxWidth={500}
      onClose={onClose}
      title="Event Details"
    >
      {isLoading ? (
        <Stack
          alignItems="center"
          flexGrow={1}
          justifyContent="center"
          minHeight={400}
        >
          <LoadingSpinner />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Stack alignItems="center" direction="row" spacing={2}>
            <Circle color="primary" sx={{ height: 16, width: 16 }} />
            <Typography fontWeight="bold" variant="h5">
              {meetingSession?.name}
            </Typography>
          </Stack>

          <Stack alignItems="start" direction="row" spacing={2}>
            <AccessTimeOutlined sx={{ fontSize: 16 }} />
            <Stack>
              <Typography sx={{ lineHeight: 1.0 }} variant="body1">
                {dayjs(meetingSession?.start_at).format('dddd, MMMM Do')}
              </Typography>
              <Typography variant="body1">
                {dayjs(meetingSession?.start_at).tz(timezone).format('hh:mm A')}{' '}
                - {dayjs(meetingSession?.end_at).tz(timezone).format('hh:mm A')}
              </Typography>
            </Stack>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={2}>
            <LocationOnOutlined sx={{ fontSize: 16 }} />
            <Link href={meetingSession?.meetingUrl ?? ''} lineHeight={1.2}>
              {meetingSession?.meetingUrl}
            </Link>
          </Stack>
          {dataSource && dataSource?.description && (
            <Stack alignItems="start" direction="row" spacing={2}>
              <AutoAwesomeOutlined sx={{ fontSize: 16 }} />
              <Stack>
                <Typography
                  fontWeight="bold"
                  sx={{ lineHeight: 1.0 }}
                  variant="body1"
                >
                  Summary
                </Typography>
                <ButtonBase
                  onClick={() =>
                    setSelectedDataSource({
                      id: dataSource.id,
                      origin: dataSource.origin,
                    })
                  }
                  sx={{ color: 'primary.main' }}
                >
                  <Stack alignItems="center" direction="row" spacing={1}>
                    <Typography>{dataSource?.description}</Typography>
                    <ArrowOutward sx={{ fontSize: 16 }} />
                  </Stack>
                </ButtonBase>
              </Stack>
            </Stack>
          )}
        </Stack>
      )}

      {selectedDataSource &&
      selectedDataSource.id &&
      meetingSession?.pulseId ? (
        <MeetingDetails
          dataSourceId={selectedDataSource.id}
          isOpen={true}
          onClose={() => setSelectedDataSource(null)}
          onDelete={handleDeleteDataSource}
          pulseIdProp={meetingSession.pulseId}
        />
      ) : null}
    </CustomModal>
  )
}
