import { EditOutlined, TrendingUpOutlined } from '@mui/icons-material'
import { Stack } from '@mui/material'
import { useGetEvent } from '@zunou-queries/core/hooks/useGetEvent'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { CustomModal } from '~/components/ui/CustomModal'

import { DeleteDataSourceModalContent } from '../../dataSource/DataSourceSidebar/hooks'
import { PostEvent } from './PostEvent'
import PreEvent from './PreEvent'

type mode = 'PRE_EVENT' | 'POST_EVENT'

const formatEventDate = (timezone: string, date?: string): string => {
  if (!date) return '-'

  const parsed = dayjs(date)
  if (!parsed.isValid()) return 'Unknown date'

  // Mark the timezone WITHOUT converting the time
  const zoned = parsed.tz(timezone, true)

  return zoned.format('MMMM D, YYYY h:mm A')
}

interface PreEventProps {
  isOpen: boolean
  onClose: () => void
  eventId: string | null
}

interface PostEventProps {
  pulseIdProp?: string
  dataSourceId?: string
  onDelete?: (content: DeleteDataSourceModalContent) => void
}

interface CombinedProps extends PreEventProps, PostEventProps {}

export default function EventDetailsModal(Props: CombinedProps) {
  const { user } = useAuthContext()

  const canViewAnalysis = !!Props.dataSourceId
  const canViewPreEvent = !!Props.eventId

  const timezone = user?.timezone ?? 'UTC'

  const { data: eventData } = useGetEvent({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!Props.eventId,
    variables: {
      eventId: Props.eventId ?? '',
    },
  })

  const event = eventData?.event
  const eventName = event?.name ?? 'Unknown'
  const eventDate = event?.start_at

  const getInitialMode = (): mode => {
    if (canViewAnalysis) return 'POST_EVENT'
    if (!Props.eventId) return 'POST_EVENT'
    return 'PRE_EVENT'
  }

  const [mode, setMode] = useState<mode>(getInitialMode)

  // Reset mode when eventId or dataSourceId changes
  useEffect(() => {
    setMode(getInitialMode())
  }, [Props.eventId, Props.dataSourceId])

  // Handle case when neither is available
  if (!canViewPreEvent && !canViewAnalysis) {
    return (
      <CustomModal
        isOpen={Props.isOpen}
        onClose={Props.onClose}
        subheader={formatEventDate(timezone, eventDate)}
        title={eventName}
      >
        <div style={{ color: '#666', padding: '2rem', textAlign: 'center' }}>
          No event or analysis data available.
        </div>
      </CustomModal>
    )
  }

  return (
    <CustomModal
      customHeaderActions={
        <Button
          disabled={
            (mode === 'PRE_EVENT' && !canViewAnalysis) ||
            (mode === 'POST_EVENT' && !canViewPreEvent)
          }
          onClick={() =>
            setMode((prev) =>
              prev === 'PRE_EVENT' ? 'POST_EVENT' : 'PRE_EVENT',
            )
          }
          size="small"
          startIcon={
            mode === 'POST_EVENT' ? (
              <EditOutlined fontSize="small" />
            ) : (
              <TrendingUpOutlined fontSize="small" />
            )
          }
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 9999,
          }}
          variant="outlined"
        >
          {mode === 'POST_EVENT' ? 'Edit Event' : 'View Analysis'}
        </Button>
      }
      isOpen={Props.isOpen}
      maxWidth="90vw"
      onClose={Props.onClose}
      subheader={formatEventDate(timezone, eventDate)}
      title={eventName}
      withPadding={false}
    >
      <Stack px={4}>
        {mode === 'PRE_EVENT' ? (
          <PreEvent {...Props} />
        ) : (
          Props.dataSourceId && (
            <PostEvent
              dataSourceId={Props.dataSourceId}
              onClose={Props.onClose}
              pulseIdProp={Props.pulseIdProp}
            />
          )
        )}
      </Stack>
    </CustomModal>
  )
}
