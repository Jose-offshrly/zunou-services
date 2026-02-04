import {
  BalanceRounded,
  BoltRounded,
  WarningRounded,
} from '@mui/icons-material'
import { Chip, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { InsightType, LiveInsightOutbox } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useNavigate, useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const colorMap = {
  [InsightType.Action]: {
    color: theme.palette.common.dandelion,
    icon: <BoltRounded fontSize="small" />,
  },
  [InsightType.Decision]: {
    color: theme.palette.common.blue,
    icon: <BalanceRounded fontSize="small" />,
  },
  [InsightType.Risk]: {
    color: theme.palette.error.main,
    icon: <WarningRounded fontSize="small" />,
  },
}

interface MiniInsightCardProps {
  insight: LiveInsightOutbox
  onClickCallback?: () => void
}

export default function MiniInsightCard({
  insight,
  onClickCallback,
}: MiniInsightCardProps) {
  const navigate = useNavigate()
  const { userRole } = useAuthContext()

  const { pulseId, organizationId } = useParams()

  const { color } = colorMap[insight.type] || colorMap[InsightType.Action]

  const handleNavigate = () => {
    navigate(
      `/${userRole}/${pathFor({
        pathname: Routes.PulseInsightDetails,
        query: {
          insightId: insight.id,
          organizationId,
          pulseId,
        },
      })}`,
    )

    onClickCallback?.()
  }

  return (
    <Stack
      border={1}
      borderRadius={2}
      gap={1}
      onClick={handleNavigate}
      p={2}
      sx={{
        '&:hover': {
          bgcolor: 'action.hover',
        },
        borderColor: 'divider',
        cursor: 'pointer',
      }}
    >
      <Stack>
        <Chip
          label={insight.type.toUpperCase()}
          size="small"
          sx={{
            backgroundColor: alpha(color, 0.1),
            borderRadius: 9999,
            color: color,
            fontSize: 10,
            fontWeight: 500,
            width: 'fit-content',
          }}
        />
      </Stack>
      <Typography fontWeight={500} variant="body2">
        {insight.topic}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {insight.description}
      </Typography>
    </Stack>
  )
}
