import { Chip } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { theme } from '@zunou-react/services/Theme'

interface TimeLogChipProps {
  total?: number | null
  checkOut?: string | null
}

const getChipKey = (
  total?: number | null,
  checkOut?: string | null,
): 'noLog' | 'incomplete' | 'default' => {
  if (total === 0) return 'noLog'
  if (checkOut === null) return 'incomplete'
  return 'default'
}

const timelogChipMap = {
  default: (total: number) => ({
    label: `${Number(total).toFixed(1)} hours`,
    sx: () => ({
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      color: theme.palette.primary.main,
    }),
  }),
  incomplete: {
    label: 'Incomplete',
    sx: () => ({
      backgroundColor: alpha(theme.palette.common.dandelion, 0.2),
      color: theme.palette.warning.main,
    }),
  },
  noLog: {
    label: 'No log',
    sx: () => ({
      backgroundColor: alpha(theme.palette.warning.main, 0.2),
      color: theme.palette.warning.main,
    }),
  },
}

export const TimeLogChip = ({ total, checkOut }: TimeLogChipProps) => {
  const key = getChipKey(total, checkOut)

  const chipProps =
    key === 'default' && total
      ? timelogChipMap.default(total)
      : timelogChipMap[key]

  return <Chip {...chipProps} size="small" />
}
