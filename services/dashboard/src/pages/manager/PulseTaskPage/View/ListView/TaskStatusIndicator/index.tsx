import { Circle } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { alpha } from '@mui/system'
import { TaskStatus } from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'

import { toTitleCase } from '~/utils/toTitleCase'

import {
  TaskStatusColorMap,
  TaskStatusLabelMap,
} from '../CreateTaskForm/StatusDropdown'

interface TaskStatusIndicatorProps {
  status: TaskStatus
  size?: 'small' | 'medium'
}

const sizeMap = {
  medium: {
    buttonSize: 'small',
    circleSize: 12,
    paddingX: 1.5,
    paddingY: 0.5,
    typographyVariant: 'body2',
  },
  small: {
    buttonSize: 'small',
    circleSize: 8,
    paddingX: 1,
    paddingY: 0.25,
    typographyVariant: 'caption',
  },
}

export const TaskStatusIndicator = ({
  status,
  size = 'medium',
}: TaskStatusIndicatorProps) => {
  const { buttonSize, circleSize, typographyVariant, paddingX, paddingY } =
    sizeMap[size]

  return (
    <Button
      color="inherit"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      size={buttonSize as any}
      startIcon={
        <Circle
          fontSize="small"
          sx={{
            color: TaskStatusColorMap[status],
            height: circleSize,
            width: circleSize,
          }}
        />
      }
      sx={{
        bgcolor: alpha(TaskStatusColorMap[status], 0.2),
        borderRadius: 99,
        pointerEvents: 'none',
        px: paddingX,
        py: paddingY,
      }}
      variant="contained"
    >
      <Typography
        color={TaskStatusColorMap[status]}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variant={typographyVariant as any}
      >
        {toTitleCase(TaskStatusLabelMap[status])}
      </Typography>
    </Button>
  )
}
