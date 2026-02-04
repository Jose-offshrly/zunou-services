import { ArrowDropDown, Check } from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
} from '@mui/material'
import { Organization } from '@zunou-graphql/core/graphql'
import { useGetOrganizationLogoQuery } from '@zunou-queries/core/hooks/useGetOrganizationLogoQuery'
import { Image } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { theme } from '@zunou-react/services/Theme'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const OrganizationLogo = ({
  organizationId,
  size = 24,
  name,
  borderRadius = 4,
  logoUrl,
}: {
  organizationId: string
  size?: number
  name: string
  borderRadius?: number
  logoUrl?: string | null
}) => {
  const { data: logoData, isLoading } = useGetOrganizationLogoQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!organizationId,
    variables: { organizationId },
  })

  // Use temporary S3 URL from query (changes on each fetch) or static URL as fallback
  const finalLogoUrl = logoData?.organizationLogo?.url || logoUrl

  if (isLoading && !logoUrl) {
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
        bgcolor: theme.palette.primary.main,
        borderRadius,
        color: theme.palette.common.white,
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
}: {
  organization: Organization
  isSelected: boolean
  onSelect: (id: string) => void
}) => {
  return (
    <MenuItem onClick={() => onSelect(organization.id)}>
      <ListItemIcon>
        <OrganizationLogo
          logoUrl={organization.logo}
          name={organization.name}
          organizationId={organization.id}
          size={24}
        />
      </ListItemIcon>
      <ListItemText
        primaryTypographyProps={{
          fontSize: 14,
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {organization.name}
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

export const OrganizationSelector = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { organizationId, organization } = useOrganization()
  const userOrganizations = useMemo(
    () => (user?.organizations as Organization[]) || [],
    [user],
  )

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleOrgSelect = (id: string) => {
    navigate(
      pathFor({
        pathname: Routes.OrganizationBootstrap,
        query: { organizationId: id },
      }),
    )
    handleCloseMenu()
  }

  return (
    <Box sx={{ paddingY: 1 }}>
      <Button
        onClick={handleOpenMenu}
        style={{ textDecoration: 'none' }}
        sx={{ position: 'relative' }}
      >
        <OrganizationLogo
          borderRadius={8}
          logoUrl={organization?.logo}
          name={organization?.name || ''}
          organizationId={organizationId || ''}
          size={40}
        />
        <Stack
          alignItems="center"
          bgcolor="grey.400"
          border="1px solid"
          borderColor="common.white"
          borderRadius={99}
          bottom={0}
          color="common.white"
          height={16}
          justifyContent="center"
          position="absolute"
          right={0}
          sx={{
            transform: 'translate(-50%)',
          }}
          width={16}
        >
          <ArrowDropDown fontSize="small" />
        </Stack>
      </Button>

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        onClose={handleCloseMenu}
        open={isOpen}
        slotProps={{
          paper: {
            style: {
              border: `1px solid ${theme.palette.grey['200']}`,
              boxShadow: 'none',
              minWidth: 192,
            },
          },
        }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
      >
        {user &&
          userOrganizations.map((org) => (
            <OrganizationMenuItem
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
