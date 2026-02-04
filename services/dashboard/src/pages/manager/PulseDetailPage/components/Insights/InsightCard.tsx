import {
  BalanceRounded,
  BoltRounded,
  CalendarTodayOutlined,
  ThumbDownOutlined,
  ThumbUpOutlined,
  WarningRounded,
} from '@mui/icons-material'
import { Typography } from '@mui/material'
import { alpha, darken, Stack } from '@mui/system'
import { InsightStatus, InsightType } from '@zunou-graphql/core/graphql'
import { useGiveLiveInsightFeedbackMutation } from '@zunou-queries/core/hooks/useGiveLiveInsightFeedbackMutation'
import { Button, Chip } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import _ from 'lodash'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { formatRelativeDateLabel } from '~/utils/dateUtils'

interface InsightCardProps {
  id: string
  type: InsightType
  topic?: string | null
  description?: string | null
  createdAt: string
  rating?: number
  status: InsightStatus
  onClick?: (insightId: string) => void
}

const colorMap = {
  action: {
    color: theme.palette.common.dandelion,
    icon: <BoltRounded fontSize="small" />,
  },
  decision: {
    color: theme.palette.common.blue,
    icon: <BalanceRounded fontSize="small" />,
  },
  risk: {
    color: theme.palette.error.main,
    icon: <WarningRounded fontSize="small" />,
  },
}

const MAX_LENGTH = 120

export const InsightCard = ({
  id,
  createdAt,
  description,
  topic,
  type = InsightType.Action,
  rating: initialRating,
  status,
  onClick,
}: InsightCardProps) => {
  const { user } = useAuthContext()
  const { organizationId } = useParams()

  const timezone = user?.timezone ?? 'UTC'

  const [rating, setRating] = useState<number | null>(initialRating ?? null)
  const [isExpanded, setIsExpanded] = useState(false)

  const giveLiveInsightFeedback = useGiveLiveInsightFeedbackMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const { color, icon } = colorMap[type]

  const statusLabel =
    status === InsightStatus.Delivered || status === InsightStatus.Pending
      ? 'New'
      : status === InsightStatus.Seen
        ? 'Seen'
        : 'Closed'

  const shouldTruncate = _.size(description) > MAX_LENGTH
  const displayDescription =
    isExpanded || !shouldTruncate
      ? description
      : _.truncate(description || '', { length: MAX_LENGTH, separator: ' ' })

  const handleFeedback = (e: React.MouseEvent, value: number) => {
    e.stopPropagation()
    if ((value !== 1 && value !== 5) || !organizationId) return

    const previousRating = rating
    setRating(value) // optimistic update

    const comment = value === 1 ? 'DISLIKE' : 'LIKE'

    giveLiveInsightFeedback.mutate(
      {
        comment,
        organizationId,
        outboxId: id,
        rating: value,
      },
      {
        onError: () => {
          // revert on failure
          setRating(previousRating)
        },
      },
    )
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <Stack
      border="1px solid"
      borderColor="divider"
      borderRadius={3}
      direction="row"
      height="100%"
      onClick={() => onClick?.(id)}
      overflow="hidden"
      sx={{
        '&:hover': {
          bgcolor: 'grey.50',
          boxShadow: '2px 6px 8px rgba(0, 0, 0, 0.08)',
        },
        bgcolor: 'common.white',
        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.05)',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Header */}
      <Stack
        alignItems="center"
        color="common.white"
        height="100%"
        justifyContent="center"
        px={1}
        sx={{
          background: () =>
            `linear-gradient(to top left, ${alpha(color, 0.5)}, ${alpha(color, 1)})`,
        }}
      >
        {icon}
      </Stack>

      {/* Content */}
      <Stack flex={1} gap={2} justifyContent="space-between" p={2}>
        <Stack alignItems="center" direction="row" gap={1}>
          <Chip
            label={type.toUpperCase()}
            size="small"
            sx={{
              '& .MuiChip-label': { fontSize: '0.625rem', fontWeight: 500 },
              bgcolor: alpha(color, 0.1),
              color: darken(color, 0.2),
              px: 1,
              width: 'fit-content',
            }}
            variant="filled"
          />

          {(status === InsightStatus.Pending ||
            status === InsightStatus.Delivered) && (
            <Chip
              label={statusLabel.toUpperCase()}
              size="small"
              sx={{
                '& .MuiChip-label': { fontSize: '0.625rem', fontWeight: 500 },
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.2),
                color: 'info.main',
                px: 1,
              }}
              variant="filled"
            />
          )}
        </Stack>

        <Stack>
          <Typography fontWeight="bold" variant="body2">
            {topic}
          </Typography>

          <Typography color="text.secondary" variant="caption">
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
        </Stack>

        <Stack
          color="text.secondary"
          direction="row"
          justifyContent="space-between"
          sx={{ mt: 'auto' }}
        >
          <Stack alignItems="center" direction="row" spacing={1}>
            <CalendarTodayOutlined sx={{ color: 'grey.400', fontSize: 12 }} />
            <Typography color="grey.400" variant="caption">
              From Meeting • {formatRelativeDateLabel(createdAt, timezone)}
            </Typography>
          </Stack>

          {/* Actions */}
          <Stack
            alignItems="center"
            direction="row"
            gap={2}
            justifyContent="space-between"
          >
            {/* <Button
            color="primary"
            endIcon={<ArrowForwardOutlined fontSize="small" />}
            onClick={() => onClick?.(id)}
            sx={{ borderRadius: 2, height: 40 }}
            variant="contained"
          >
            View
          </Button> */}

            <Stack direction="row" spacing={1}>
              <Button
                onClick={(e) => handleFeedback(e, 5)}
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor:
                      rating === 5
                        ? darken(theme.palette.common.lime, 0.1)
                        : alpha(theme.palette.common.lime, 0.1),
                    borderColor:
                      rating === 5 ? theme.palette.common.lime : 'grey.300',
                  },
                  aspectRatio: '1 / 1',
                  bgcolor:
                    rating === 5 ? theme.palette.common.lime : 'transparent',
                  borderColor:
                    rating === 5 ? theme.palette.common.lime : 'grey.300',
                  borderRadius: 2,
                  color: rating === 5 ? 'common.white' : 'grey.500',
                }}
                variant="outlined"
              >
                <ThumbUpOutlined
                  sx={{
                    fontSize: 14,
                  }}
                />
              </Button>
              <Button
                onClick={(e) => handleFeedback(e, 1)}
                size="small"
                sx={{
                  '&:hover': {
                    bgcolor:
                      rating === 1
                        ? darken(theme.palette.common.cherry, 0.1)
                        : alpha(theme.palette.common.cherry, 0.1),
                    borderColor:
                      rating === 1 ? theme.palette.common.cherry : 'grey.300',
                  },
                  aspectRatio: '1 / 1',
                  bgcolor:
                    rating === 1 ? theme.palette.common.cherry : 'transparent',
                  borderColor:
                    rating === 1 ? theme.palette.common.cherry : 'grey.300',
                  borderRadius: 2,
                  color: rating === 1 ? 'common.white' : 'grey.500',
                }}
                variant="outlined"
              >
                <ThumbDownOutlined
                  sx={{
                    fontSize: 14,
                  }}
                />
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
