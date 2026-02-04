import { EditOutlined, TopicOutlined } from '@mui/icons-material'
import { alpha, Chip, IconButton, Stack, Typography } from '@mui/material'
import { StrategyType } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

interface PulseStrategiesCardProps {
  type: StrategyType
  title: string
  description: string
  priority?: 'High' | 'Medium' | 'Low'
  onEdit?: () => void
  isAutomations?: boolean
  isLogsClick?: () => void
}

export const PulseStrategiesCard = ({
  type,
  title,
  description,
  priority,
  onEdit,
  isAutomations,
  isLogsClick,
}: PulseStrategiesCardProps) => {
  return (
    <Stack
      sx={{
        '&:hover': {
          bgcolor: 'grey.50',
        },
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 2,
        mb: 1,
        p: 1.5,
      }}
    >
      <Stack
        alignItems="flex-start"
        direction="row"
        justifyContent="space-between"
      >
        <Stack spacing={1}>
          {type === StrategyType.Alerts && priority && (
            <Chip
              label={priority}
              size="small"
              sx={{
                bgcolor:
                  priority === 'High'
                    ? alpha(theme.palette.secondary.main, 0.1)
                    : 'grey.100',
                borderRadius: 1,
                color: priority === 'High' ? 'secondary.main' : 'grey.700',
                width: 'fit-content',
              }}
            />
          )}
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography fontWeight="bold" variant="subtitle1">
              {title}
            </Typography>
          </Stack>
        </Stack>
        {isAutomations && (
          <IconButton onClick={isLogsClick} size="small">
            <TopicOutlined fontSize="small" />
          </IconButton>
        )}
        <IconButton onClick={onEdit} size="small">
          <EditOutlined fontSize="small" />
        </IconButton>
      </Stack>
      <Typography color="text.secondary" mt={1} variant="body2">
        {description}
      </Typography>
    </Stack>
  )
}
