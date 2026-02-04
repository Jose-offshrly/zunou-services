import { Box, BoxProps } from '@mui/material'
import { ReactNode } from 'react'

interface FeedItemWrapperProps extends BoxProps {
  children: ReactNode
}

export const FeedItemWrapper = ({
  children,
  sx,
  ...props
}: FeedItemWrapperProps) => {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  )
}
