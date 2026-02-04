import { Typography } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'
import { PropsWithChildren } from 'react'

import { theme } from '../../services/Theme'

interface Props {
  sx?: SxProps<Theme>
}

export const H6 = ({ children, sx }: PropsWithChildren<Props>) => {
  return (
    <Typography
      sx={{
        color: theme.palette.text.secondary,
        fontWeight: theme.typography.fontWeightBold,
        ...sx,
      }}
      variant="h6"
    >
      {children}
    </Typography>
  )
}
