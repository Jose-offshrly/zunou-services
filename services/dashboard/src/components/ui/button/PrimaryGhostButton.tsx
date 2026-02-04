import { IconButton, IconButtonProps } from '@mui/material'
import { alpha, styled } from '@mui/system'
import { theme } from '@zunou-react/services/Theme'

export const PrimaryGhostButton = styled(IconButton)<IconButtonProps>(() => ({
  '&.MuiIconButton-root': {
    '&.Mui-disabled': {
      backgroundColor: alpha(theme.palette.text.secondary, 0.5),
    },
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    color: theme.palette.text.primary,
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: 'primary.main',
    transition: '0.3s',
  },
}))
