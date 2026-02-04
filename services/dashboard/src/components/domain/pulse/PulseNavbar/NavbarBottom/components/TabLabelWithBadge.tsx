import { Box, Icon, Typography } from '@mui/material'
import { ElementType } from 'react'

import { MenuItemIcon } from '~/components/domain/pulse/PulseNavbar/NavbarBottom/components/MenuItemIcon'

interface TabLabelWithBadgeProps {
  pulseId?: string
  label: string
  icon: ElementType
}

export const TabLabelWithBadge = ({
  pulseId,
  label,
  icon,
}: TabLabelWithBadgeProps) => (
  <Box alignItems="center" display="flex" gap={1}>
    {icon && <Icon component={icon} fontSize="small" />}
    <Typography>{label}</Typography>
    <MenuItemIcon pulseId={pulseId} />
  </Box>
)
