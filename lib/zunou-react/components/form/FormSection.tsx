import { Box, Divider, SxProps, Theme } from '@mui/material'
import type { PropsWithChildren } from 'react'

interface Props {
  hideDivider?: boolean
  sx?: SxProps<Theme>
}

export const FormSection = ({
  children,
  hideDivider,
  ...props
}: PropsWithChildren<Props>) => (
  <Box {...props}>
    {children}

    {hideDivider ? null : <Divider sx={{ mb: 3, mt: 3 }} variant="middle" />}
  </Box>
)
