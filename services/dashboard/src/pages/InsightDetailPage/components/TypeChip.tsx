import { alpha, darken } from '@mui/system'
import { ActionTypes } from '@zunou-graphql/core/graphql'
import { Chip } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'

interface Props {
  type: ActionTypes
}

const ACTION_TYPE_COLORS: Partial<Record<ActionTypes, string>> = {
  [ActionTypes.Note]: theme.palette.reference.pastelYellowV2,
  [ActionTypes.Task]: theme.palette.common.blue,
  [ActionTypes.TeamChat]: theme.palette.common.cherry,
  [ActionTypes.Meeting]: theme.palette.common.black,
}

export default function TypeChip({ type }: Props) {
  const color = ACTION_TYPE_COLORS[type] ?? '#fff'
  const label = (type ?? 'Unknown').replace(/_/g, ' ').toUpperCase()

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        '& .MuiChip-label': { fontSize: '0.725rem' },
        bgcolor: alpha(color, 0.2),
        color: darken(color, 0.1),
        fontWeight: 'bold',
        px: 0.5,
        width: 'fit-content',
      }}
    />
  )
}
