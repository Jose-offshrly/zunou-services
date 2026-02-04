import { darken, IconButton, IconButtonProps } from '@mui/material'
import { styled } from '@mui/material/styles'
import { LinkProps } from 'react-router-dom'

type MenuIconButtonProps = IconButtonProps & {
  component?: React.ElementType
  to?: LinkProps['to']
}

export const PrimaryIconButton = styled(IconButton)<MenuIconButtonProps>(
  ({ theme }) => ({
    '&:hover': {
      backgroundColor: darken(theme.palette.primary.main, 0.1),
      transition: 'background-color 0.3s',
    },
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  }),
)
