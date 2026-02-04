import { Add, Check, ExpandMore } from '@mui/icons-material'
import {
  Box,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Organization } from '@zunou-graphql/core/graphql'
import { useGetOrganizationLogoQuery } from '@zunou-queries/core/hooks/useGetOrganizationLogoQuery'
import { Button, IconButton } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
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

  return (
    <Avatar
      key={finalLogoUrl}
      placeholder={name}
      size="medium"
      src={finalLogoUrl}
      transparentBg={true}
    />
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
    <MenuItem
      onClick={() => onSelect(organization.id)}
      sx={{
        gap: 2,
      }}
    >
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

export const OrganizationSelector = ({
  collapsed = false,
}: {
  collapsed?: boolean
}) => {
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
    <Stack
      alignItems="center"
      direction={collapsed ? 'column' : 'row'}
      gap={1}
      justifyContent="space-between"
      py={1}
      width="100%"
    >
      <Button
        fullWidth={true}
        onClick={handleOpenMenu}
        style={{ textDecoration: 'none' }}
        sx={{ gap: 2, position: 'relative' }}
      >
        <OrganizationLogo
          borderRadius={8}
          logoUrl={organization?.logo}
          name={organization?.name || ''}
          organizationId={organizationId}
          size={40}
        />

        {!collapsed && (
          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            justifyContent="space-between"
            width="100%"
          >
            <Typography
              color="text.primary"
              fontWeight="bold"
              sx={{
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                display: '-webkit-box',
                maxWidth: 100,
                overflow: 'hidden',
                // Added: breaks long words
                overflowWrap: 'break-word',

                textOverflow: 'ellipsis',

                whiteSpace: 'normal',
                wordBreak: 'break-word', // Added: alternative breaking method
              }}
              variant="body2"
            >
              {organization?.name ?? 'Unknown'}
            </Typography>
            <Stack alignItems="center" justifyContent="center" width={16}>
              <ExpandMore
                fontSize="small"
                sx={{
                  color: 'text.secondary',
                }}
              />
            </Stack>
          </Stack>
        )}
      </Button>

      <Tooltip placement="right" title="Add Pulse">
        <Box>
          <IconButton
            className="joyride-onboarding-tour-6"
            onClick={() =>
              navigate(
                pathFor({
                  pathname: Routes.PulseNew,
                  query: { organizationId },
                }),
              )
            }
            size="small"
            sx={{
              '&:hover': {
                bgcolor: 'primary.light',
              },
              bgcolor: 'primary.main',
            }}
          >
            <Add
              sx={{
                borderRadius: 9999,
                color: 'common.white',
                height: 20,
                width: 20,
              }}
            />
          </IconButton>
        </Box>
      </Tooltip>

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
    </Stack>
  )
}
