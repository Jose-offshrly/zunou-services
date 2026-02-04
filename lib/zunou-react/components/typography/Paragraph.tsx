import { Typography, TypographyProps } from '@mui/material'
import { PropsWithChildren } from 'react'

export const Paragraph = ({
  children,
  ...props
}: PropsWithChildren<TypographyProps>) => {
  return (
    <Typography display="block" marginBottom={1} variant="body1" {...props}>
      {children}
    </Typography>
  )
}
