import { IconButton, IconButtonProps } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { LinkProps } from 'react-router-dom'

type IconActionButtonProps = IconButtonProps & {
  component?: React.ElementType
  to?: LinkProps['to']
  variant?: 'outlined' | 'filled'
}

export const IconActionButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'variant',
})<IconActionButtonProps>(({ theme, variant = 'outlined' }) => ({
  height: 36,
  padding: 2,
  transition: '0.3s',
  width: 36,

  ...(variant === 'outlined' && {
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
      color: theme.palette.common.white,
    },
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    color: theme.palette.text.primary,
  }),

  ...(variant === 'filled' && {
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    color: theme.palette.primary.main,
  }),
}))
