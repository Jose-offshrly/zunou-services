import { FormControl, MenuItem, Select } from '@mui/material'
import { OrganizationUserRole } from '@zunou-graphql/core/graphql'

import { toTitleCase } from '~/utils/toTitleCase'

interface Role {
  value: OrganizationUserRole
  label: string
}

interface OrganizationUserRoleSelectorProps {
  value: OrganizationUserRole | ''
  onChange: () => void
}

const ROLES_MAP = {
  [OrganizationUserRole.Owner]: 'Owner',
  [OrganizationUserRole.User]: 'User',
} as const

const ROLES: Role[] = Object.entries(ROLES_MAP).map(([value, label]) => ({
  label: toTitleCase(label),
  value: value as OrganizationUserRole,
}))

export const RoleSelector = ({
  value,
  onChange,
}: OrganizationUserRoleSelectorProps) => {
  return (
    <FormControl
      size="small"
      sx={{
        '& .MuiInputBase-root': {
          height: '40px',
        },
        minWidth: 90,
      }}
    >
      <Select onChange={onChange} value={value || ''}>
        {ROLES.map(({ value, label }) => (
          <MenuItem key={value} sx={{ fontSize: 14 }} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
