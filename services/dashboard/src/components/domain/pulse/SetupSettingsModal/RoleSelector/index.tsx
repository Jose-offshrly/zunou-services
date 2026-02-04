import { FormControl, MenuItem, Select } from '@mui/material'

import { toTitleCase } from '~/utils/toTitleCase'

interface Option<T> {
  label: string
  value: T
}

interface RoleSelectorProps<T> {
  disabled?: boolean
  onChange: (value: T) => void
  options: Option<T>[]
  value: T
}

export const RoleSelector = <T extends string>({
  disabled,
  onChange,
  options,
  value,
}: RoleSelectorProps<T>) => {
  return (
    <FormControl
      disabled={disabled}
      size="small"
      sx={{
        '& .MuiInputBase-root': {
          height: '50px',
        },
        minWidth: 96,
      }}
    >
      <Select
        onChange={(e) => onChange(e.target.value as T)}
        sx={{ fontSize: 14 }}
        value={value}
      >
        {options.map(({ label, value }) => (
          <MenuItem key={value} sx={{ fontSize: 14 }} value={value}>
            {toTitleCase(label)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
