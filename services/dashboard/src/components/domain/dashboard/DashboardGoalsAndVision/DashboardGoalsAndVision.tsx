import { alpha, LinearProgress, Stack, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import React from 'react'

import { goals } from '~/libs/mockdashboard'

interface Goal {
  label: string
  progress: number
}

const GoalsAndVision: React.FC = () => {
  return (
    <Stack
      bgcolor="white"
      border={1}
      borderColor={alpha(theme.palette.primary.main, 0.1)}
      borderRadius={2}
      flexGrow={1}
      gap={1}
      height="100%"
      justifyContent="space-between"
      p={2}
    >
      <Stack>
        <Typography fontSize={20} fontWeight={500} gutterBottom={true}>
          Goals and Vision
        </Typography>
        <Typography color="text.secondary" fontSize={12}>
          Alignment
        </Typography>
      </Stack>
      <Stack gap={1}>
        {goals.map((goal: Goal, index: number) => (
          <Stack gap={1} key={index}>
            <Stack justifyContent="space-between">
              <Typography color="text.primary" fontSize={12}>
                {goal.label}
              </Typography>
              <Typography color="primary.main" fontSize={12} fontWeight={600}>
                {goal.progress}%
              </Typography>
            </Stack>
            <LinearProgress
              sx={{ borderRadius: 4, height: 8 }}
              value={goal.progress}
              variant="determinate"
            />
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}

export default GoalsAndVision
