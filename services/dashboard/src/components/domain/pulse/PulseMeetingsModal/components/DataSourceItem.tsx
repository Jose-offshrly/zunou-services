import { NorthEast } from '@mui/icons-material'
import { Divider, Stack, Typography } from '@mui/material'
import { DataSource } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import timezonePlugin from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

interface Props {
  dataSource: DataSource
  onClick: (dataSource: DataSource) => void
}

export default function DataSourceItem({ dataSource, onClick }: Props) {
  const { user } = useAuthContext()

  const timezone = user?.timezone ?? 'UTC'

  // Just format in user's timezone
  const meetingDate = dayjs(dataSource.meeting?.date)
    .tz(timezone)
    .format('h:mm A')

  const hasTranscript = !!dataSource.transcript?.id

  return (
    <Stack
      border={1}
      borderColor="divider"
      borderRadius={2}
      gap={0.5}
      onClick={() => onClick(dataSource)}
      p={1.5}
      sx={{
        '&:hover .action-btn': {
          opacity: 1,
          pointerEvents: 'auto',
        },
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {meetingDate}
      </Typography>

      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        width="100%"
      >
        <Stack>
          <Typography fontWeight={500} variant="body2">
            {dataSource.name}
          </Typography>

          <Stack
            alignItems="center"
            direction="row"
            divider={
              hasTranscript ? (
                <Divider orientation="vertical" sx={{ height: 12 }} />
              ) : undefined
            }
            gap={0.5}
          >
            {hasTranscript && (
              <Typography color="primary.main" variant="caption">
                Recorded
              </Typography>
            )}

            <Typography color="text.secondary" variant="caption">
              {hasTranscript ? 'Transcript Available' : 'No Transcript'}
            </Typography>
          </Stack>
        </Stack>

        <NorthEast
          className="action-btn"
          fontSize="small"
          sx={{
            color: 'secondary.light',
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
        />
      </Stack>
    </Stack>
  )
}
