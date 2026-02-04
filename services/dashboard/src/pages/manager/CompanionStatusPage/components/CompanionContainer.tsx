import { CalendarMonth, SmartToyOutlined } from '@mui/icons-material'
import { Divider, Stack, Typography } from '@mui/material'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { IconButton } from '@zunou-react/components/form'
import _ from 'lodash'
import { useEffect, useState } from 'react'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

import CompanionCard from './CompanionCard'

type CompanionStatusGroups = Record<string, MeetingSession[]>

// Configuration for each status group
const COMPANION_STATUS_GROUPS = [
  { bgcolor: '#e1f5fe', key: 'scheduled', label: 'Scheduled' },
  { bgcolor: '#fff3e0', key: 'waiting_to_join', label: 'Waiting to Join' },
  { bgcolor: '#e3f2fd', key: 'in_meeting', label: 'In Meeting' },
  { bgcolor: '#ffccbc', key: 'not_admitted', label: 'Not Admitted' },
  { bgcolor: '#e8f5e9', key: 'finished', label: 'Finished' },
  { bgcolor: '#fce4ec', key: 'paused', label: 'Paused' },
  { bgcolor: '#d1c4e9', key: 'stale_paused', label: 'Stale Paused' },
  { bgcolor: '#ffe0b2', key: 'stale_recording', label: 'Stale Recording' },
  { bgcolor: '#f0f4c3', key: 'stale_waiting', label: 'Stale Waiting' },
  {
    bgcolor: '#ffebee',
    key: 'recorder_unavailable',
    label: 'Recorder Unavailable',
  },
  {
    bgcolor: '#ffebee',
    key: 'service_unavailable',
    label: 'Service Unavailable',
  },
  { bgcolor: '#f3e5f5', key: 'completed', label: 'Completed' },
  { bgcolor: '#eceff1', key: 'unknown', label: 'Unknown' },
]

type ActiveState = 'COMPANION' | 'MEETING'

interface Props {
  meetings: MeetingSession[]
  isLoading: boolean
  setActive: (active: ActiveState) => void
}

export default function CompanionContainer({
  meetings,
  isLoading,
  setActive,
}: Props) {
  const [groups, setGroups] = useState<CompanionStatusGroups>({})

  useEffect(() => {
    if (isLoading) return

    // Group by status dynamically
    const groupedByStatus = _.groupBy(meetings, (companion) => {
      // If companion_details is null/empty, it's scheduled/upcoming
      if (!companion.companion_details) {
        return 'scheduled'
      }
      // Otherwise group by the status
      return companion.companion_details.status || 'unknown'
    })

    // Sort each group by start_at
    const sortedGroups = _.mapValues(groupedByStatus, (group) =>
      _.orderBy(
        group,
        [
          (companion) =>
            companion.start_at ? new Date(companion.start_at).getTime() : 0,
        ],
        ['desc'],
      ),
    )

    setGroups(sortedGroups)
  }, [meetings, isLoading])

  return (
    <Stack gap={2} height="100%" width="100%">
      <Stack
        alignItems="center"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Stack alignItems="center" flexDirection="row" gap={1}>
          <Typography variant="h6">In Meeting</Typography>
          <Typography fontSize={14} variant="h6">
            ({groups['in_meeting']?.length ?? 0})
          </Typography>
        </Stack>
        <Stack
          bgcolor="grey.100"
          borderRadius={2}
          flexDirection="row"
          gap={0.5}
          p={0.5}
        >
          <IconButton
            sx={{
              '&:hover': {
                backgroundColor: 'common.white',
              },
              backgroundColor: 'common.white',
              borderBottomRightRadius: 0,
              borderRadius: 1,
              borderTopRightRadius: 0,
              color: 'primary.main',
              padding: 1,
            }}
          >
            <SmartToyOutlined sx={{ fontSize: 16 }} />
          </IconButton>

          <IconButton
            onClick={() => setActive('MEETING')}
            sx={{
              '&:hover': {
                backgroundColor: 'grey.200',
              },
              backgroundColor: 'transparent',
              borderBottomLeftRadius: 0,
              borderRadius: 1,
              borderTopLeftRadius: 0,
              color: 'text.secondary',
              padding: 1,
            }}
          >
            <CalendarMonth sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Stack>
      <Stack
        direction="row"
        gap={2}
        height="100%"
        sx={{
          overflowX: 'auto',
        }}
        width="100%"
      >
        {isLoading ? (
          <Stack direction="row" gap={2} height="100%" width="100%">
            <LoadingSkeleton height="100%" width="100%" />
            <LoadingSkeleton height="100%" width="100%" />
            <LoadingSkeleton height="100%" width="100%" />
            <LoadingSkeleton height="100%" width="100%" />
          </Stack>
        ) : (
          <>
            {/* First render known groups in order */}
            {COMPANION_STATUS_GROUPS.map((groupConfig) => {
              const companions = groups[groupConfig.key] || []

              return (
                <Stack
                  border={1}
                  borderColor="divider"
                  borderRadius={2}
                  divider={<Divider />}
                  flex={1}
                  gap={2}
                  height="100%"
                  key={groupConfig.key}
                  maxHeight="100%"
                  minWidth={350}
                  p={2}
                >
                  <Typography
                    bgcolor={groupConfig.bgcolor}
                    borderRadius={100}
                    p={0.5}
                    textAlign="center"
                  >
                    {groupConfig.label} ({companions.length})
                  </Typography>

                  <Stack
                    divider={<Divider />}
                    gap={2}
                    height="100%"
                    sx={{
                      overflowY: 'auto',
                    }}
                  >
                    {companions.map((companion, index) => (
                      <CompanionCard
                        botName={
                          companion.companion_details?.bot_id ||
                          `No Assigned Bot`
                        }
                        date={companion.start_at ?? null}
                        endedAt={companion.companion_details?.ended_at ?? null}
                        joinedAt={
                          companion.companion_details?.joined_at ?? null
                        }
                        key={companion.id || index}
                        meetingName={companion.name || 'Meeting'}
                        meetingUrl={companion.meetingUrl || '#'}
                        startedAt={
                          companion.companion_details?.started_at ?? null
                        }
                        status={companion.companion_details?.status ?? null}
                      />
                    ))}
                  </Stack>
                </Stack>
              )
            })}

            {/* Then render any unknown groups */}
            {Object.keys(groups).map((statusKey) => {
              // Skip if already in known groups
              if (COMPANION_STATUS_GROUPS.some((g) => g.key === statusKey))
                return null

              const companions = groups[statusKey] || []
              if (companions.length === 0) return null

              return (
                <Stack
                  border={1}
                  borderColor="divider"
                  borderRadius={2}
                  divider={<Divider />}
                  flex={1}
                  gap={2}
                  height="100%"
                  key={statusKey}
                  maxHeight="100%"
                  minWidth={300}
                  p={2}
                >
                  <Typography
                    bgcolor="#fafafa"
                    borderRadius={100}
                    color="text.secondary"
                    fontWeight={500}
                    p={0.5}
                    textAlign="center"
                  >
                    {statusKey} ({companions.length})
                  </Typography>

                  <Stack
                    divider={<Divider />}
                    gap={2}
                    height="100%"
                    sx={{
                      overflowY: 'auto',
                    }}
                  >
                    {companions.map((companion, index) => (
                      <CompanionCard
                        botName={
                          companion.companion_details?.bot_id ||
                          `Pulse Companion #${index + 1}`
                        }
                        date={companion.start_at ?? null}
                        endedAt={companion.companion_details?.ended_at ?? null}
                        joinedAt={
                          companion.companion_details?.joined_at ?? null
                        }
                        key={companion.id || index}
                        meetingName={companion.name || 'Meeting'}
                        meetingUrl={companion.meetingUrl || '#'}
                        startedAt={
                          companion.companion_details?.started_at ?? null
                        }
                        status={companion.companion_details?.status ?? null}
                      />
                    ))}
                  </Stack>
                </Stack>
              )
            })}
          </>
        )}
      </Stack>
    </Stack>
  )
}
