import { useAuth0 } from '@auth0/auth0-react'
import { AccountTreeOutlined, Group, Login } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemIconProps,
  ListItemProps,
  ListItemText,
  ListItemTextProps,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'
import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { Routes } from '~/services/Routes'

interface Link {
  baseUrl: string
  href: string
  icon: ReactNode
  label: string
}

const SidebarItem = styled(ListItem)<ListItemProps>(() => ({
  '& .MuiListItemText-primary': {
    textAlign: 'center',
  },
  '&.Mui-selected': {
    backgroundColor: 'transparent',
  },
  '&:hover .MuiListItemIcon-root': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transition: 'background-color 0.3s',
  },
  alignItems: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  width: '100%',
}))

const StyledSidebarItemText = styled(ListItemText)<ListItemTextProps>(() => ({
  '& .MuiListItemText-primary': {
    textAlign: 'center',
  },
}))

const SidebarItemText = ({
  selected,
  children,
  ...props
}: ListItemTextProps & {
  selected: boolean
}) => {
  const theme = useTheme()

  return (
    <StyledSidebarItemText
      {...props}
      sx={{
        color: selected
          ? theme.palette.primary.main
          : theme.palette.text.primary,
      }}
    >
      {children}
    </StyledSidebarItemText>
  )
}

const StyledListItemIcon = styled(ListItemIcon)<ListItemIconProps>(() => ({
  alignItems: 'center',
  borderRadius: 12,
  height: 40,
  justifyContent: 'center',
  minWidth: 40,
  position: 'relative',
  width: 40,
}))

const SidebarItemIcon = ({
  children,
  selected,
  ...props
}: ListItemIconProps & {
  selected: boolean
}) => {
  const theme = useTheme()

  return (
    <StyledListItemIcon
      {...props}
      sx={{
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        color: selected
          ? theme.palette.primary.main
          : theme.palette.text.primary,
      }}
    >
      {children}
    </StyledListItemIcon>
  )
}

const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.grey[300],
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.grey[400],
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
}

const useDocumentTitle = (title: string) => {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    return () => {
      document.title = previousTitle
    }
  }, [title])
}

const links = [
  {
    baseUrl: 'orgs',
    href: pathFor({
      pathname: Routes.OrganizationList,
    }),
    icon: <AccountTreeOutlined />,
    label: 'Orgs',
  },
  {
    baseUrl: 'users',
    href: pathFor({
      pathname: Routes.UserList,
    }),
    icon: <Group />,
    label: 'Users',
  },
]

export const PageLeftMenu = () => {
  useDocumentTitle('Admin | Zunou AI')

  const { user, isAuthenticated, loginWithRedirect } = useAuth0()
  const { pathname } = useLocation()
  const { logout, userRole, user: userContext } = useAuthContext()

  const [anchorElSettingsMenu, setAnchorElSettingsMenu] =
    useState<null | HTMLElement>(null)

  const isOpenSettingsMenu = Boolean(anchorElSettingsMenu)
  const isManager = userRole === UserRoleEnum.MANAGER

  const isActiveNavItem = (baseUrl: string) =>
    pathname === baseUrl || pathname.includes(baseUrl)

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElSettingsMenu(event.currentTarget)
  }

  const handleCloseSettingsMenu = () => {
    setAnchorElSettingsMenu(null)
  }

  const handleSignIn = () => loginWithRedirect()

  const handleLogout = () => {
    logout()
  }

  return (
    <Stack
      alignItems="center"
      borderRight={1}
      gap={1}
      height="100dvh"
      justifyContent="space-between"
      maxWidth={80}
      padding={2}
      sx={{
        '& *': {
          color: isManager ? undefined : 'common.white',
        },
        backgroundColor: isManager ? 'common.white' : 'primary.main',
        borderColor: 'divider',
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="space-between"
        spacing={4}
        sx={{ overflow: 'hidden' }}
      >
        {/* Menu Links */}
        <Stack
          component="nav"
          padding={2}
          spacing={2}
          sx={{
            ...scrollbarStyles,
            overflowY: 'auto',
            width: 80,
          }}
        >
          {links.map(({ baseUrl, href, icon, label }, index) => (
            <Box key={index}>
              <Link style={{ textDecoration: 'none' }} to={href}>
                <SidebarItem>
                  <SidebarItemIcon selected={isActiveNavItem(baseUrl)}>
                    {icon}
                  </SidebarItemIcon>
                  <SidebarItemText
                    primary={label}
                    primaryTypographyProps={{
                      style: {
                        fontSize: '12px',
                        fontWeight: isActiveNavItem(baseUrl) ? 700 : 400,
                      },
                    }}
                    selected={isActiveNavItem(baseUrl)}
                  />
                </SidebarItem>
              </Link>
            </Box>
          ))}
        </Stack>
      </Stack>

      <Stack alignItems="center" spacing={2}>
        {isAuthenticated && user ? (
          <Avatar sx={{ height: 36, width: 36 }}>
            <Button onClick={handleOpenUserMenu} sx={{ height: '100%' }}>
              {userContext?.gravatar ? (
                <Avatar
                  src={userContext.gravatar}
                  sx={{ height: 36, width: 36 }}
                />
              ) : (
                <Typography color="common.white">
                  {getFirstLetter(user.name)}
                </Typography>
              )}
            </Button>
          </Avatar>
        ) : (
          <IconButton onClick={handleSignIn} sx={{ color: 'grey.500' }}>
            <Login />
          </IconButton>
        )}

        {/* User Menu */}
        <Menu
          anchorEl={anchorElSettingsMenu}
          anchorOrigin={{
            horizontal: 'right',
            vertical: 'bottom',
          }}
          id="basic-menu"
          onClose={handleCloseSettingsMenu}
          open={isOpenSettingsMenu}
          slotProps={{
            paper: {
              style: {
                border: `1px solid ${theme.palette.grey['200']}`,
                boxShadow: 'none',
                marginTop: -4,
                minWidth: 160,
              },
            },
          }}
          transformOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
        >
          <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
        </Menu>
      </Stack>
    </Stack>
  )
}
