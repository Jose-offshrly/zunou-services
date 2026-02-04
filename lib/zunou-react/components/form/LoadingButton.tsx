import BaseLoadingButton, { LoadingButtonProps } from '@mui/lab/LoadingButton'
import type { PropsWithChildren } from 'react'

export const LoadingButton = ({
  children,
  sx,
  ...props
}: PropsWithChildren<LoadingButtonProps>) => {
  return (
    <BaseLoadingButton
      disableElevation={true}
      sx={{ textTransform: 'none', ...sx }}
      {...props}
    >
      {children}
    </BaseLoadingButton>
  )
}
