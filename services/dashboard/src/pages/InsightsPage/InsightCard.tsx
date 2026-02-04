import {
  ArrowOutwardOutlined,
  CalendarToday,
  Circle,
  QueryBuilderOutlined,
} from '@mui/icons-material'
import { Typography } from '@mui/material'
import { alpha, darken, Stack } from '@mui/system'
import { InsightStatus, InsightType } from '@zunou-graphql/core/graphql'
import { Chip } from '@zunou-react/components/form'
// import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import _ from 'lodash'
import { useState } from 'react'

// import { useNavigate, useParams } from 'react-router-dom'
// import { Routes } from '~/services/Routes'
import { formatRelativeDateLabel } from '~/utils/dateUtils'

interface InsightCardProps {
  id: string
  type: InsightType
  topic?: string | null
  description?: string | null
  createdAt: string
  status: InsightStatus
  meetingId: string
  onViewEvent?: (e: React.MouseEvent, meetingId: string) => void
}

const colorMap = {
  action: theme.palette.common.dandelion,
  decision: theme.palette.common.blue,
  risk: theme.palette.error.main,
}

const MAX_LENGTH = 150

export const InsightCard = ({
  // id,
  createdAt,
  description,
  topic,
  type = InsightType.Action,
  status,
  meetingId,
  onViewEvent,
}: InsightCardProps) => {
  // const navigate = useNavigate()
  // const { organizationId } = useParams()
  const [isExpanded, setIsExpanded] = useState(false)

  const statusLabel =
    status === InsightStatus.Delivered || status === InsightStatus.Pending
      ? 'New'
      : status === InsightStatus.Seen
        ? 'Seen'
        : 'Completed'
  const shouldTruncate = _.size(description) > MAX_LENGTH
  const displayDescription =
    isExpanded || !shouldTruncate
      ? description
      : _.truncate(description || '', { length: MAX_LENGTH, separator: ' ' })

  const handleNavigateToInsightDetail = () => {
    // navigate(
    //   pathFor({
    //     pathname: Routes.InsightDetails,
    //     query: {
    //       insightId: id,
    //       organizationId,
    //     },
    //   }),
    // )
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <Stack
      bgcolor="common.white"
      border="1px solid"
      borderColor="divider"
      borderRadius={3}
      height="100%"
      onClick={handleNavigateToInsightDetail}
      overflow="hidden"
      sx={{
        '&:hover': {
          '& .hover-icon': {
            opacity: 1,
            transform: 'translateY(0)',
          },
          cursor: 'pointer',
        },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack flex={1} justifyContent="space-between" p={2} spacing={1}>
        <Stack
          flex={1}
          gap={1}
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          <Stack direction="row" justifyContent="space-between">
            <Chip
              label={type.toUpperCase()}
              size="small"
              sx={{
                '& .MuiChip-label': { fontSize: '0.625rem' },
                bgcolor: alpha(colorMap[type], 0.1),
                borderColor: alpha(colorMap[type], 0.5),
                color: darken(colorMap[type], 0.2),
                px: 0.5,
                width: 'fit-content',
              }}
              variant="outlined"
            />
            <ArrowOutwardOutlined
              className="hover-icon"
              sx={{
                color: 'grey.400',
                opacity: 0,
                transform: 'translateY(-2px)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
            />
          </Stack>

          <Typography fontWeight="bold" variant="body1">
            {topic}
          </Typography>

          <Typography color="text.secondary" variant="body2">
            {displayDescription}
            {shouldTruncate && (
              <Typography
                color="primary"
                component="span"
                onClick={handleToggleExpand}
                sx={{
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontWeight: 500,
                  ml: 0.5,
                }}
              >
                {isExpanded ? 'See less' : 'See more'}
              </Typography>
            )}
          </Typography>

          <Stack
            alignItems="center"
            color="text.secondary"
            direction="row"
            divider={<Circle sx={{ color: 'grey.200', fontSize: 7 }} />}
            gap={1}
            justifyContent="space-between"
            sx={{ mt: 'auto' }}
          >
            {/* Date */}
            <Stack alignItems="center" direction="row" gap={0.5}>
              <QueryBuilderOutlined
                fontSize="small"
                sx={{ color: 'grey.400' }}
              />
              <Typography color="grey.400" variant="caption">
                {formatRelativeDateLabel(createdAt)}
              </Typography>
            </Stack>

            {status === InsightStatus.Pending ||
            status === InsightStatus.Delivered ? (
              <Chip
                label={statusLabel}
                size="small"
                sx={{
                  '& .MuiChip-label': { fontSize: '0.675rem' },
                  bgcolor: (theme) => alpha(theme.palette.primary.light, 0.05),
                  border: (theme) => `1px solid ${theme.palette.primary.main}`,
                  borderRadius: 1,
                  color: 'primary.main',
                }}
                variant="filled"
              />
            ) : (
              <Typography color="grey.400" variant="caption">
                {statusLabel}
              </Typography>
            )}

            <Stack
              alignItems="center"
              direction="row"
              gap={0.5}
              onClick={(e) => onViewEvent?.(e, meetingId)}
            >
              <CalendarToday fontSize="small" sx={{ color: 'common.blue' }} />
              <Typography color="common.blue" variant="caption">
                View Event
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
