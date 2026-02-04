import { Box, BoxProps } from '@mui/material'
import type { PropsWithChildren } from 'react'

export const PageContent = ({
  children,
  ...props
}: PropsWithChildren<BoxProps>) => (
  <Box
    display="flex"
    flex={1}
    flexDirection="column"
    gap={2}
    minHeight="calc(100% - 72px)"
    overflow="auto"
    px={4}
    py={3}
    {...props}
  >
    {children}
  </Box>
)
