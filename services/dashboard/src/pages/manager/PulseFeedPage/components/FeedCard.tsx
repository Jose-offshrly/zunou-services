import { alpha, Stack, StackProps } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import { ReactNode } from 'react'

interface FeedCardProps extends StackProps {
  children: ReactNode
  onClick?: () => void
}

const FeedCard = ({ children, onClick, sx, ...props }: FeedCardProps) => {
  return (
    <Stack
      onClick={onClick}
      sx={{
        '&:hover': {
          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
          cursor: 'pointer',
        },
        px: 3,
        py: 2,
        transition: 'background-color 0.2s ease',
        width: '100%',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Stack>
  )
}

export default FeedCard
