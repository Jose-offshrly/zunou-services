import { ListItem, ListItemProps } from '@mui/material'
import { alpha, styled, Theme, useTheme } from '@mui/material/styles'

const StyledListItem = styled(ListItem)<ListItemProps>(() => ({
  '& .MuiListItemText-primary': {
    textAlign: 'center',
  },
  alignItems: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  width: '100%',
}))

export const SidebarItem = ({
  inverted = false,
  children,
  ...props
}: ListItemProps & {
  inverted?: boolean
}) => {
  const theme = useTheme()

  const getHoverBackgroundColor = (inverted: boolean, theme: Theme) => {
    return inverted
      ? alpha(theme.palette.common.white, 0.2)
      : alpha(theme.palette.primary.main, 0.1)
  }

  return (
    <StyledListItem
      {...props}
      sx={{
        '&:hover .MuiListItemIcon-root': {
          backgroundColor: getHoverBackgroundColor(inverted, theme),
          transition: 'background-color 0.3s',
        },
      }}
    >
      {children}
    </StyledListItem>
  )
}
