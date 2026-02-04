import { Box, Divider, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { OrganizationSettingsModal } from '~/components/domain/organization/OrganizationSettingsModal'
import {
  SettingsModal,
  SettingsTabIdentifier,
} from '~/components/domain/settings/SettingsModal'
import { useBillingLink } from '~/hooks/useBillingLink'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { useUserSettingsStore } from '~/store/useUserSettingsStore'

import { LinkMenuItem } from './LinkMenutItem'

const ModalType = {
  Organization: 'organization',
  Settings: 'settings',
} as const
type ModalType = (typeof ModalType)[keyof typeof ModalType]

interface UserMenuProps {
  isManager: boolean
  showUserDetails?: boolean
  collapsed?: boolean
}

export const UserMenu = ({
  isManager,
  showUserDetails = false,
  collapsed = false,
}: UserMenuProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout, user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { billingLink } = useBillingLink(organizationId)

  const {
    currentTab,
    setCurrentTab,
    isOpen: isSettingsOpen,
    setIsOpen: setIsSettingsOpen,
  } = useUserSettingsStore()

  const [activeModal, setActiveModal] = useState<ModalType | null>(null)
  const [anchorElSettingsMenu, setAnchorElSettingsMenu] =
    useState<null | HTMLElement>(null)

  const [searchParams] = useSearchParams()

  // URL params take priority over store state
  const openSettingsParam = searchParams.get('open-settings')
  useEffect(() => {
    if (!openSettingsParam) return

    let tab: SettingsTabIdentifier
    switch (openSettingsParam) {
      case 'link':
        tab = SettingsTabIdentifier['LINKED ACCOUNTS']
        break
      case 'personalization':
        tab = SettingsTabIdentifier.PERSONALIZATION
        break
      default:
        tab = SettingsTabIdentifier.GENERAL
        break
    }

    // URL params take priority
    setCurrentTab(tab)
    setIsSettingsOpen(true)
    setActiveModal('settings')
  }, [openSettingsParam, setCurrentTab, setIsSettingsOpen])

  const isOpenSettingsMenu = Boolean(anchorElSettingsMenu)

  const handleLogout = () => {
    logout()
  }

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElSettingsMenu(event.currentTarget)
  }

  const handleCloseSettingsMenu = () => {
    setAnchorElSettingsMenu(null)
  }

  const handleMenuSelect = (selectedItem: ModalType) => {
    if (selectedItem === 'settings') {
      // When opening from menu (not URL), use current store tab
      setIsSettingsOpen(true)
    }
    setActiveModal(selectedItem)
    handleCloseSettingsMenu()
  }

  const handleNavigateToLandingPage = () => {
    navigate(
      `/${pathFor({
        pathname: Routes.Landing,
        query: { organizationId, skipSetup: true },
      })}`,
    )
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
    setActiveModal(null)
  }

  const handleCloseOrganization = () => {
    setActiveModal(null)
  }

  return (
    <Box width="100%">
      <Button
        fullWidth={true}
        onClick={handleOpenUserMenu}
        sx={{ height: '100%' }}
      >
        {showUserDetails && !collapsed ? (
          <Stack alignItems="center" direction="row" gap={1.5} width="100%">
            <Stack>
              <Avatar
                placeholder={user?.name}
                size="small"
                src={user?.gravatar}
                variant="circular"
              />
            </Stack>
            <Stack>
              {user?.name && (
                <Typography
                  color="text.primary"
                  fontWeight="bold"
                  sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  textAlign="left"
                  variant="body2"
                >
                  {user.name}
                </Typography>
              )}
              {user?.email && (
                <Typography
                  color="text.secondary"
                  sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  textAlign="left"
                  variant="caption"
                >
                  {user.email}
                </Typography>
              )}
            </Stack>
          </Stack>
        ) : (
          <Avatar
            placeholder={user?.name}
            size="medium"
            src={user?.gravatar}
            variant="circular"
          />
        )}
      </Button>
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
        <MenuItem onClick={() => handleMenuSelect(ModalType.Settings)}>
          {t('settings')}
        </MenuItem>

        {isManager && [
          <MenuItem
            key="menu-organization"
            onClick={() => handleMenuSelect(ModalType.Organization)}
          >
            {t('organization')}
          </MenuItem>,
          <LinkMenuItem
            isDisabled={true}
            key="menu-billing"
            label={t('billing')}
            onClick={handleCloseSettingsMenu}
            to={billingLink}
          />,
        ]}
        <MenuItem onClick={handleNavigateToLandingPage}>
          {t('get_zunou')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>{t('sign_out')}</MenuItem>
      </Menu>
      <SettingsModal
        handleClose={handleCloseSettings}
        initialTab={currentTab}
        isOpen={isSettingsOpen}
      />
      <OrganizationSettingsModal
        handleClose={handleCloseOrganization}
        isOpen={activeModal === 'organization'}
      />
    </Box>
  )
}
