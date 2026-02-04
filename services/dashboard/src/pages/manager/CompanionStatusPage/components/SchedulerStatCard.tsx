import {
  DeblurOutlined,
  GraphicEqOutlined,
  QueryBuilderOutlined,
  SettingsVoiceOutlined,
} from '@mui/icons-material'
import { Icon, Skeleton, Typography } from '@mui/material'
import { alpha, Box, Stack } from '@mui/system'
import { theme } from '@zunou-react/services/Theme'

export type SchedulerScaleType =
  | 'maxInstances'
  | 'active'
  | 'pending'
  | 'running'

export interface SchedulerStatCard {
  value: number
  loading?: boolean
  label: string
  type: SchedulerScaleType
}

const typeColors: Record<SchedulerScaleType, string> = {
  active: theme.palette.common.lime,
  maxInstances: theme.palette.common.cherry,
  pending: theme.palette.common.dandelion,
  running: theme.palette.common.blue,
}

const SchedulerStatIconMap = {
  active: GraphicEqOutlined,
  maxInstances: DeblurOutlined,
  pending: SettingsVoiceOutlined,
  running: QueryBuilderOutlined,
}

export const SchedulerStatCard = ({
  value,
  label,
  loading,
  type,
}: SchedulerStatCard) => {
  return (
    <Stack
      border={1}
      borderColor="divider"
      borderRadius={2}
      direction="row"
      flex={1}
      gap={2}
      height="100%"
      maxHeight="100%"
      p={2}
    >
      <Box
        bgcolor={alpha(typeColors[type], 0.2)}
        borderRadius="50%"
        sx={{
          alignItems: 'center',
          aspectRatio: '1 / 1',
          display: 'flex',
          height: 48,
          justifyContent: 'center',
          width: 48,
        }}
      >
        <Icon
          component={SchedulerStatIconMap[type]}
          fontSize="small"
          sx={{ color: typeColors[type] || '' }}
        />
      </Box>
      <Stack>
        {loading ? (
          <Skeleton height={28} width={32} />
        ) : (
          <Typography fontWeight="bold" variant="h5">
            {value}
          </Typography>
        )}
        {loading ? (
          <Skeleton height={16} width={60} />
        ) : (
          <Typography color="text.secondary" variant="body2">
            {label}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
