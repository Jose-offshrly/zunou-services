import {
  Avatar,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { VitalsSettingsModal } from '~/components/domain/vitals/header'
import { useVitalsContext } from '~/context/VitalsContext'
interface UserMenuProps {
  user?: User
}
export const UserMenu = ({ user }: UserMenuProps) => {
  const { t } = useTranslation()
  const { logout, userRole } = useAuthContext()
  const { setting, setSettingDraftMode } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [anchorElSettingsMenu, setAnchorElSettingsMenu] =
    useState<null | HTMLElement>(null)
  const isOpenSettingsMenu = Boolean(anchorElSettingsMenu)
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElSettingsMenu(event.currentTarget)
  }
  const handleCloseSettingsMenu = () => {
    setAnchorElSettingsMenu(null)
  }
  const handleOpenSettings = () => {
    setAnchorElSettingsMenu(null)
    setIsSettingsModalOpen(true)
    setSettingDraftMode(true)
  }
  const handleCloseSettings = () => {
    setIsSettingsModalOpen(false)
    setSettingDraftMode(false)
  }
  const handleLogout = () => {
    logout()
  }
  return (
    <>
      <IconButton
        onClick={handleOpenUserMenu}
        size="small"
        sx={{
          '&:hover': {
            backgroundColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.04)',
          },
          border: `2px solid ${theme.palette.secondary.main}`,
          padding: 0,
        }}
      >
        <Avatar
          src={user?.gravatar ?? undefined}
          sx={{
            bgcolor: isDarkMode ? 'primary.dark' : 'primary.main',
            color: 'common.white',
            height: 32,
            width: 32,
          }}
        >
          {user?.gravatar ? null : user?.name && getFirstLetter(user.name)}
        </Avatar>
      </IconButton>
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
              backgroundColor: isDarkMode
                ? theme.palette.grey['900']
                : theme.palette.background.paper,
              border: isDarkMode
                ? `1px solid ${theme.palette.grey['800']}`
                : `1px solid ${theme.palette.grey['200']}`,
              boxShadow: isDarkMode
                ? '0px 5px 15px rgba(0, 0, 0, 0.5)'
                : 'none',
              color: isDarkMode
                ? theme.palette.common.white
                : theme.palette.text.primary,
              marginTop: 10,
              minWidth: 160,
            },
          },
        }}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'top',
        }}
      >
        <Stack direction="row" paddingX={1.5} paddingY={0.5}>
          <Avatar
            src={user?.gravatar ?? ''}
            sx={{
              bgcolor: isDarkMode ? 'primary.dark' : 'primary.main',
              color: 'common.white',
              height: 36,
              width: 36,
            }}
          >
            {!user?.gravatar && user?.name && getFirstLetter(user.name)}
          </Avatar>
          <Stack paddingX={2}>
            <Typography
              sx={{
                color: isDarkMode ? 'common.white' : 'text.primary',
                fontSize: 'small',
                fontWeight: 'bold',
              }}
              variant="caption"
            >
              {user?.name}
            </Typography>
            <Typography
              sx={{
                color: isDarkMode ? 'grey.400' : 'text.secondary',
                fontSize: 'small',
                mt: -0.5,
              }}
              variant="caption"
            >
              {userRole}
            </Typography>
          </Stack>
        </Stack>
        <Divider
          sx={{
            borderColor: isDarkMode ? 'grey.800' : 'grey.200',
          }}
        />
        <MenuItem
          onClick={handleOpenSettings}
          sx={{
            '&:hover': {
              backgroundColor: isDarkMode ? 'grey.800' : 'grey.100',
            },
            color: isDarkMode ? 'common.white' : 'text.primary',
            fontSize: 'small',
          }}
        >
          {t('settings')}
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            '&:hover': {
              backgroundColor: isDarkMode ? 'grey.800' : 'grey.100',
            },
            color: isDarkMode ? 'common.white' : 'text.primary',
            fontSize: 'small',
          }}
        >
          {t('sign_out')}
        </MenuItem>
      </Menu>
      <VitalsSettingsModal
        handleClose={handleCloseSettings}
        isOpen={isSettingsModalOpen}
      />
    </>
  )
}
