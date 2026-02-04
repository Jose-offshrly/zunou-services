import { Typography } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'
import { PropsWithChildren } from 'react'

interface Props {
  sx?: SxProps<Theme>
}

export const H3 = ({ children, sx }: PropsWithChildren<Props>) => {
  return (
    <Typography sx={sx} variant="h3">
      {children}
    </Typography>
  )
}
