import { Search } from '@mui/icons-material'
import { InputAdornment, TextField } from '@mui/material'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export const SearchBar = ({
  searchTerm,
  onSearchChange,
  placeholder = 'Search items',
}: SearchBarProps) => {
  return (
    <TextField
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
      }}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={placeholder}
      size="small"
      sx={{
        flexGrow: 1,
      }}
      value={searchTerm}
    />
  )
}
