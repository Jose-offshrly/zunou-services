import { Stack, Typography } from '@mui/material'
import React from 'react'

interface Props {
  title: string
  description: string
  children?: React.ReactNode
}

export default function Header({ title, description, children }: Props) {
  return (
    <Stack
      alignItems="center"
      direction="row"
      gap={2}
      justifyContent="space-between"
      p={2}
      pb={0}
    >
      <Stack>
        <Typography fontWeight="bold" variant="body1">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
      </Stack>

      {children && <Stack>{children}</Stack>}
    </Stack>
  )
}
