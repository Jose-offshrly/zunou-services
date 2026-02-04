import { FlagOutlined } from '@mui/icons-material'
import { alpha, Stack, Typography } from '@mui/material'
import { EventPriority } from '@zunou-graphql/core/graphql'
import { useUpdateEventMutation } from '@zunou-queries/core/hooks/useUpdateEventMutation'
import { theme } from '@zunou-react/services/Theme'
import _ from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { Detail, Row } from './Layout'

interface PriorityConfig {
  bg: string
  label: string
  color: string
}

const PRIORITY_CONFIG: Record<EventPriority | 'NONE', PriorityConfig> = {
  NONE: {
    bg: alpha(theme.palette.grey[500], 0.15),
    color: theme.palette.text.secondary,
    label: 'No',
  },
  [EventPriority.Low]: {
    bg: alpha(theme.palette.common.lime, 0.2),
    color: theme.palette.common.lime,
    label: 'Low',
  },
  [EventPriority.Medium]: {
    bg: alpha(theme.palette.common.dandelion, 0.2),
    color: theme.palette.common.dandelion,
    label: 'Medium',
  },
  [EventPriority.High]: {
    bg: alpha(theme.palette.warning.main, 0.2),
    color: theme.palette.warning.dark,
    label: 'High',
  },
  [EventPriority.Urgent]: {
    bg: alpha(theme.palette.error.main, 0.25),
    color: theme.palette.error.dark,
    label: 'Urgent',
  },
}

const PRIORITY_ORDER = [
  EventPriority.Low,
  EventPriority.Medium,
  EventPriority.High,
  EventPriority.Urgent,
]

interface PrioritySectionProps {
  initialPriority: EventPriority | null
  eventId: string | undefined
}

export function PrioritySection({
  initialPriority,
  eventId,
}: PrioritySectionProps) {
  const [priority, setPriority] = useState<EventPriority | null>(
    initialPriority,
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const updateEventMutation = useUpdateEventMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const latestValuesRef = useRef({ eventId, updateEventMutation })

  useEffect(() => {
    latestValuesRef.current = { eventId, updateEventMutation }
  }, [eventId, updateEventMutation])

  useEffect(() => {
    setPriority(initialPriority)
  }, [initialPriority])

  const debouncedUpdatePriority = useMemo(
    () =>
      _.debounce(async (newPriority: EventPriority) => {
        const { eventId, updateEventMutation } = latestValuesRef.current

        if (!eventId) {
          console.error('No event ID found')
          return
        }

        setIsUpdating(true)
        try {
          await updateEventMutation.mutateAsync({
            id: eventId,
            priority: newPriority,
          })
        } catch (error) {
          console.error('Failed to update priority:', error)
          toast.error('Failed to update priority')
        } finally {
          setIsUpdating(false)
        }
      }, 1000),
    [],
  )

  useEffect(() => {
    return () => debouncedUpdatePriority.cancel()
  }, [debouncedUpdatePriority])

  const cyclePriority = useCallback(() => {
    const newPriority =
      priority === null
        ? EventPriority.Low
        : PRIORITY_ORDER[
            (PRIORITY_ORDER.indexOf(priority) + 1) % PRIORITY_ORDER.length
          ]

    setPriority(newPriority)
    debouncedUpdatePriority(newPriority)
  }, [priority, debouncedUpdatePriority])

  const priorityConfig = PRIORITY_CONFIG[priority ?? 'NONE']

  return (
    <Row>
      <Detail>
        <FlagOutlined sx={{ fontSize: 15 }} />
        <Stack
          bgcolor={priorityConfig.bg}
          borderRadius={1.5}
          color={priorityConfig.color}
          onClick={cyclePriority}
          p={1}
          sx={{
            '&:hover': { opacity: 0.8 },
            cursor: 'pointer',
            opacity: isUpdating ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          <Typography
            fontWeight={600}
            textTransform="uppercase"
            variant="caption"
          >
            {priorityConfig.label} Priority
          </Typography>
        </Stack>
      </Detail>
    </Row>
  )
}
