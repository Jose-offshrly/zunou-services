import { Box, Container, ContainerProps } from '@mui/material'
import type { PropsWithChildren } from 'react'

export const Page = ({
  children,
  maxWidth = false,
  sx,
  ...props
}: PropsWithChildren<ContainerProps>) => (
  <Container
    maxWidth={maxWidth}
    sx={{ paddingLeft: { xs: 0 }, paddingRight: { xs: 0 }, ...sx }}
    {...props}
  >
    <Box display="flex" flexDirection="row" minHeight="100%">
      {children}
    </Box>
  </Container>
)
