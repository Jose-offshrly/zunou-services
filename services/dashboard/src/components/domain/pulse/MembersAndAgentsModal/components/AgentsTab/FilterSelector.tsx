import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'

interface SelectorProps {
  value: string | number | null | undefined
  label?: string
}

export const FilterSelector = ({ label, value }: SelectorProps) => {
  const filterOptions = [{ label: 'All', value: 'all' }]

  const handleChange = () => null

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
      {label && <InputLabel>{label}</InputLabel>}
      <Select onChange={handleChange} sx={{ fontSize: 14 }} value={value || ''}>
        {filterOptions.map(({ value, label }) => (
          <MenuItem key={value} sx={{ fontSize: 14 }} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
