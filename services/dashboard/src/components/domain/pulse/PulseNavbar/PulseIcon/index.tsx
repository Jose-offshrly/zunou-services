import { Icon, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { PulseType } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'

import { getPulseIcon } from '~/utils/getPulseIcon'

interface PulseIconProps {
  icon?: PulseType | null
}

export const PulseIcon = ({ icon }: PulseIconProps) => (
  <Stack
    alignItems="center"
    bgcolor={alpha(theme.palette.primary.main, 0.03)}
    borderRadius={1}
    p={1}
  >
    <Icon
      component={getPulseIcon(icon)}
      fontSize="small"
      sx={{
        color: 'primary.main',
      }}
    />
  </Stack>
)
