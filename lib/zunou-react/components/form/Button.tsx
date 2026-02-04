import BaseButton, { ButtonProps } from '@mui/material/Button'
import type { PropsWithChildren } from 'react'
import React from 'react'

export const Button = React.forwardRef<
  HTMLButtonElement,
  PropsWithChildren<ButtonProps>
>(({ children, sx, ...props }, ref) => {
  return (
    <BaseButton
      disableElevation={true}
      ref={ref}
      sx={{
        '&.Mui-disabled': {
          '&.MuiButton-contained': {
            color: 'common.white',
          },
          '&:not(.MuiButton-contained)': {
            '&:hover': {
              bgcolor: 'transparent',
            },
            bgcolor: 'transparent',
          },
          color: 'text.disabled',
        },
        minWidth: 'fit-content',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        ...sx,
      }}
      {...props}
    >
      {children}
    </BaseButton>
  )
})

Button.displayName = 'Button'
