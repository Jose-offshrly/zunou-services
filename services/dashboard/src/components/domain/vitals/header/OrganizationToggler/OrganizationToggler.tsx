import { ArrowDropDown, Check } from '@mui/icons-material'
import {
  Avatar,
  Badge,
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Organization } from '@zunou-graphql/core/graphql'
import { useGetOrganizationLogoQuery } from '@zunou-queries/core/hooks/useGetOrganizationLogoQuery'
import { Image } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const OrganizationLogo = ({
  organizationId,
  size = 24,
  name,
  borderRadius = 4,
  isLoading,
  isDarkMode = false,
  logoUrl,
}: {
  organizationId: string
  size?: number
  name: string
  borderRadius?: number
  isLoading?: boolean
  isDarkMode?: boolean
  logoUrl?: string | null
}) => {
  const { data: logoData } = useGetOrganizationLogoQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!organizationId,
    variables: { organizationId },
  })

  // Use temporary S3 URL from query (changes on each fetch) or static URL as fallback
  const finalLogoUrl = logoData?.organizationLogo?.url || logoUrl

  if (isLoading) {
    return (
      <Skeleton
        height={size}
        sx={{ borderRadius }}
        variant="rounded"
        width={size}
      />
    )
  }

  if (finalLogoUrl) {
    return (
      <Image
        alt="Logo"
        height={size}
        key={finalLogoUrl}
        src={finalLogoUrl}
        style={{
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
          borderRadius,
          display: 'block',
          objectFit: 'contain',
          width: size,
        }}
      />
    )
  }

  return (
    <Avatar
      sx={{
        bgcolor: 'primary.main',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        borderRadius,
        color: 'common.white',
        height: size,
        width: size,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </Avatar>
  )
}

const OrganizationMenuItem = ({
  organization,
  isSelected,
  onSelect,
  isDarkMode,
}: {
  organization: Organization
  isSelected: boolean
  onSelect: (id: string) => void
  isDarkMode: boolean
}) => {
  return (
    <MenuItem
      onClick={() => onSelect(organization.id)}
      selected={isSelected}
      sx={{
        '&.Mui-selected': {
          '&:hover': {
            bgcolor: isDarkMode ? 'primary.main' : 'secondary.dark',
            color: 'common.white',
          },
          bgcolor: isDarkMode ? 'primary.dark' : 'secondary.main',
          color: 'common.white',
        },
        '&:hover': { bgcolor: isDarkMode ? 'grey.800' : 'grey.100' },
      }}
    >
      <ListItemIcon>
        <OrganizationLogo
          isDarkMode={isDarkMode}
          logoUrl={organization.logo}
          name={organization.name}
          organizationId={organization.id}
          size={24}
        />
      </ListItemIcon>
      <ListItemText
        primaryTypographyProps={{
          color:
            isSelected && !isDarkMode
              ? 'common.white'
              : isDarkMode
                ? 'common.white'
                : 'text.primary',
          fontSize: 14,
        }}
        sx={{
          maxWidth: '220px',
        }}
      >
        <Typography
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {organization.name}
        </Typography>
      </ListItemText>
      {isSelected && (
        <Box>
          <Stack
            alignItems="center"
            bgcolor="primary.main"
            borderRadius={99}
            height={20}
            justifyContent="center"
            ml={1}
            width={20}
          >
            <Check fontSize="inherit" sx={{ color: 'common.white' }} />
          </Stack>
        </Box>
      )}
    </MenuItem>
  )
}

interface OrganizationTogglerProps {
  organizationId: string
  isDarkMode: boolean
}

export const OrganizationToggler = ({
  organizationId,
  isDarkMode,
}: OrganizationTogglerProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthContext()
  const { organization } = useOrganization()
  const userOrganizations = (user?.organizations as Organization[]) || []

  const orgCount = userOrganizations.length
  const userOrganizationsCount = orgCount > 1 ? orgCount : null
  const hasMultipleOrganizations = userOrganizationsCount !== null

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasMultipleOrganizations) {
      setAnchorEl(event.currentTarget)
    }
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleOrgSelect = (id: string) => {
    // Get the current path to determine what type of page we're on
    const currentPath = location.pathname

    // Define a mapping function to determine the appropriate route
    const determineTargetRoute = (): string => {
      // Check for vitals pages
      if (currentPath.includes('/vitals')) {
        return Routes.Vitals
      }

      // Recommended Insights Page
      if (currentPath.includes('/recommended-insights')) {
        return Routes.RecommendedInsights
      }

      // Insights filter Page
      if (currentPath.includes('/insights')) {
        return Routes.Insights
      }

      // Check for data source pages
      if (currentPath.includes('/data-sources')) {
        if (
          currentPath.includes('/edit') ||
          currentPath.match(/\/data-sources\/[^/]+$/)
        ) {
          // On a specific data source view or edit page
          return Routes.DataSourceList
        }
        return Routes.DataSourceList
      }

      // Check for chat pages
      if (currentPath.includes('/chat')) {
        if (currentPath.includes('/new')) {
          return Routes.ChatNew
        }
        return Routes.ChatNew
      }

      // Check for pulse pages
      if (currentPath.includes('/pulse')) {
        if (currentPath.includes('/new')) {
          return Routes.PulseNew
        }
        return Routes.PulseNew
      }

      // Check for thread pages
      if (currentPath.includes('/threads')) {
        if (currentPath.includes('/new')) {
          return Routes.ThreadNew
        }
        return Routes.ThreadNew
      }

      // Check for users pages
      if (currentPath.includes('/users')) {
        return Routes.UserList
      }

      // Check for settings pages
      if (currentPath.includes('/settings')) {
        if (currentPath.includes('/slack')) {
          return Routes.SettingsSlack
        }
        // Default to dashboard if on other settings pages
        return Routes.OrganizationBootstrap
      }

      // Default to dashboard home
      return Routes.OrganizationBootstrap
    }

    const targetRoute = determineTargetRoute()

    navigate(
      pathFor({
        pathname: targetRoute,
        query: { organizationId: id },
      }),
    )

    handleCloseMenu()
  }

  const selectedOrg = userOrganizations.find((org) => org.id === organizationId)

  if (!selectedOrg) {
    return <Skeleton height={40} width={150} />
  }

  return (
    <Box sx={{ paddingY: 1 }}>
      <Button
        onClick={handleOpenMenu}
        sx={{
          alignItems: 'center',
          color: 'common.white',
          display: 'flex',
          gap: 1,
          maxWidth: '280px',
          position: 'relative',
          textTransform: 'none',
        }}
      >
        <Badge badgeContent={userOrganizationsCount} color="secondary">
          <OrganizationLogo
            borderRadius={8}
            isDarkMode={isDarkMode}
            logoUrl={organization?.logo}
            name={selectedOrg?.name || ''}
            organizationId={organizationId}
            size={40}
          />
        </Badge>

        <Typography
          color="common.white"
          fontWeight="bold"
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          variant="h6"
        >
          {selectedOrg?.name || ''}
        </Typography>

        {hasMultipleOrganizations && (
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: 'grey.400',
              border: '1px solid',
              borderColor: 'common.white',
              borderRadius: 99,
              color: 'common.white',
              display: 'flex',
              height: 16,
              justifyContent: 'center',
              ml: 1,
              width: 16,
            }}
          >
            <ArrowDropDown fontSize="small" />
          </Box>
        )}
      </Button>

      <Menu
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? 'grey.900' : 'background.paper',
            border: `1px solid ${isDarkMode ? 'grey.800' : 'rgba(74, 0, 224, 0.1)'}`,
            boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.5)',
            color: isDarkMode ? 'common.white' : 'text.primary',
            maxHeight: 300,
            minWidth: 192,
          },
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        onClose={handleCloseMenu}
        open={isOpen}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'top',
        }}
      >
        {user &&
          userOrganizations.map((org) => (
            <OrganizationMenuItem
              isDarkMode={isDarkMode}
              isSelected={org.id === organizationId}
              key={org.id}
              onSelect={handleOrgSelect}
              organization={org}
            />
          ))}
      </Menu>
    </Box>
  )
}
