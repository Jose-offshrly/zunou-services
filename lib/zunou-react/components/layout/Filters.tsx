import { Box } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'
import type { PropsWithChildren } from 'react'

interface Props {
  sx?: SxProps<Theme>
}

export const Filters = ({ children, sx }: PropsWithChildren<Props>) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      gap: 2,
      justifyContent: 'end',
      mb: 2,
      ...sx,
    }}
  >
    {children}
  </Box>
)
