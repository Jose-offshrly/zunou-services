import { GraphicEqOutlined, Refresh } from '@mui/icons-material'
import { IconButton, Typography } from '@mui/material'
import { Box, Stack } from '@mui/system'
import { useGetSchedulerScaleStatusQuery } from '@zunou-queries/core/hooks/useGetSchedulerScaleStatusQuery'

import { SchedulerStatCard } from './SchedulerStatCard'

type SchedulerScaleType = 'maxInstances' | 'active' | 'pending' | 'running'

interface SchedulerStatCardItem {
  value: number
  loading?: boolean
  label: string
  type: SchedulerScaleType
}

const labelMap: Record<SchedulerScaleType, string> = {
  active: 'Active',
  maxInstances: 'Max instances',
  pending: 'Pending',
  running: 'Running',
}

export const SchedulerStatusDashboard = ({
  isLoading,
  onRefetch,
}: {
  isLoading?: boolean
  onRefetch: () => void
}) => {
  const {
    data: schedulerScaleStatusData,
    isLoading: isLoadingSchedulerScaleStatus,
    refetch: refretchSchedulerScaleStatus,
  } = useGetSchedulerScaleStatusQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const stats = schedulerScaleStatusData?.schedulerScaleStatus ?? {
    active: 0,
    maxInstances: 0,
    pending: 0,
    running: 0,
  }

  const handleRefetch = () => {
    refretchSchedulerScaleStatus()
    onRefetch()
  }

  const schedulerStatCards: SchedulerStatCardItem[] = (
    Object.keys(stats) as SchedulerScaleType[]
  ).map((key) => ({
    label: labelMap[key],
    type: key,
    value: stats[key] ?? 0,
  }))

  return (
    <Stack
      bgcolor="common.white"
      border={1}
      borderColor="divider"
      borderRadius={2}
      p={2}
      spacing={2}
    >
      <Stack alignItems="center" direction="row" gap={2} justifyContent="start">
        <Stack alignItems="center" flexDirection="row" gap={2}>
          <Box
            bgcolor="primary.main"
            borderRadius="50%"
            sx={{
              alignItems: 'center',
              aspectRatio: '1 / 1',
              display: 'flex',
              justifyContent: 'center',
              width: 40,
            }}
          >
            <GraphicEqOutlined
              fontSize="small"
              sx={{ color: 'common.white' }}
            />
          </Box>
          <Typography margin={0} variant="h5">
            Pulse Companion Dashboard
          </Typography>
          <IconButton disabled={isLoading} onClick={handleRefetch}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>
      <Stack direction="row" overflow="auto" spacing={1}>
        {isLoading || isLoadingSchedulerScaleStatus
          ? (
              [
                'running',
                'active',
                'pending',
                'maxInstances',
              ] as SchedulerScaleType[]
            ).map((type, i) => (
              <SchedulerStatCard
                key={i}
                label=""
                loading={true}
                type={type}
                value={0}
              />
            ))
          : schedulerStatCards.map(({ label, type, value }, index) => (
              <SchedulerStatCard
                key={index}
                label={label}
                type={type}
                value={value}
              />
            ))}
      </Stack>
    </Stack>
  )
}
