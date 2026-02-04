import { Typography } from '@mui/material'
import { styled, SxProps, Theme } from '@mui/material/styles'
import { PropsWithChildren } from 'react'

interface Props {
  sx?: SxProps<Theme>
}

const StyledTypograpgy = styled(Typography)(({ theme }) => ({
  color: theme.palette.grey['900'],
  fontSize: '2.25rem',
  fontWeight: 600,
  letterSpacing: '-0.72px',
  lineHeight: '1.222',
}))

export const Display = ({ children, sx }: PropsWithChildren<Props>) => {
  return (
    <StyledTypograpgy sx={sx} variant="h1">
      {children}
    </StyledTypograpgy>
  )
}
