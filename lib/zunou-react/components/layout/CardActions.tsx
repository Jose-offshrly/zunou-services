import BaseCardActions, { CardActionsProps } from '@mui/material/CardActions'
import type { PropsWithChildren } from 'react'

export const CardActions = ({
  children,
  sx,
  ...props
}: PropsWithChildren<CardActionsProps>) => {
  return (
    <BaseCardActions
      sx={{ justifyContent: 'flex-end', p: 2, ...sx }}
      {...props}
    >
      {children}
    </BaseCardActions>
  )
}
