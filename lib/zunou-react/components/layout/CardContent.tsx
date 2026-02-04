import BaseCardContent, { CardContentProps } from '@mui/material/CardContent'
import type { PropsWithChildren } from 'react'

export const CardContent = ({
  children,
  sx,
  ...props
}: PropsWithChildren<CardContentProps>) => {
  return (
    <BaseCardContent sx={{ ...sx }} {...props}>
      {children}
    </BaseCardContent>
  )
}
