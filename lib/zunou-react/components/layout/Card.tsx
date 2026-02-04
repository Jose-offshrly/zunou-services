import BaseCard, { CardProps } from '@mui/material/Card'
import type { PropsWithChildren } from 'react'

export const Card = ({
  children,
  sx,
  variant = 'outlined',
  ...props
}: PropsWithChildren<CardProps>) => {
  return (
    <BaseCard sx={{ ...sx }} variant={variant} {...props}>
      {children}
    </BaseCard>
  )
}
