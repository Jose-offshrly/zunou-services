import { Box, Stack } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const PulseSetupLayout = ({ children }: Props) => {
  return (
    <Stack height="100vh" padding="5%" position="relative" width="100vw">
      {children}
      <Box
        bgcolor="primary.main"
        borderRadius="50%"
        height="40vw"
        position="absolute"
        sx={{
          backdropFilter: 'blur(50px)',
          filter: 'blur(80px)',
          opacity: 0.1,
          right: '0%',
          top: '40%',
          transform: 'translateY(-50%)',
        }}
        width="40vw"
        zIndex={40}
      />
    </Stack>
  )
}
