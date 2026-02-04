import { Stack, StackProps } from '@mui/material'
import { ReactNode } from 'react'

export function Detail({ children }: { children: ReactNode }) {
  return (
    <Stack alignItems="center" direction="row" gap={2} width="100%">
      {children}
    </Stack>
  )
}

interface RowProps extends Omit<StackProps, 'children'> {
  children: ReactNode
}

export function Row({ children, ...props }: RowProps) {
  return (
    <Stack
      alignItems="center"
      direction="row"
      gap={6}
      justifyContent="space-between"
      width="100%"
      {...props}
    >
      {children}
    </Stack>
  )
}
