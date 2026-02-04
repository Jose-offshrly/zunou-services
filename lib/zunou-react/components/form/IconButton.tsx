import BaseIconButton, { IconButtonProps } from '@mui/material/IconButton'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  PropsWithChildren<IconButtonProps>
>(({ children, sx, ...props }, ref) => {
  return (
    <BaseIconButton ref={ref} sx={{ textTransform: 'none', ...sx }} {...props}>
      {children}
    </BaseIconButton>
  )
})

IconButton.displayName = 'IconButton'
