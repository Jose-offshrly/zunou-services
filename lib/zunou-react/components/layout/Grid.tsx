import BaseGrid, { Grid2Props } from '@mui/material/Unstable_Grid2'
import type { PropsWithChildren } from 'react'

export const Grid = ({
  children,
  sx,
  ...props
}: PropsWithChildren<Grid2Props>) => {
  return (
    <BaseGrid
      sx={{
        marginLeft: 'auto',
        marginRight: 'auto',
        mb: props.container ? 3 : 0,
        ...sx,
      }}
      {...props}
    >
      {children}
    </BaseGrid>
  )
}
