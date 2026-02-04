import { Stack } from '@mui/material'
import { Theme } from '@mui/material/styles'
import { SxProps } from '@mui/system'
import type { PropsWithChildren } from 'react'

interface Props {
  sx?: SxProps<Theme>
}

export const PageRightPane = ({ children, sx }: PropsWithChildren<Props>) => (
  <Stack
    borderColor="red"
    flex={1}
    maxHeight="100vh"
    overflow="auto"
    sx={{
      ...sx,
    }}
  >
    {children}
  </Stack>
)
