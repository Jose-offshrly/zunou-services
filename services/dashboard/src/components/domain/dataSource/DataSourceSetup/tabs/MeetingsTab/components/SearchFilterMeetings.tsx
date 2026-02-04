import { Clear, Search } from '@mui/icons-material'
import {
  FormControl,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
} from '@mui/material'
import { IconButton } from '@zunou-react/components/form'
import { useEffect, useRef, useState } from 'react'

interface SearchFilterMeetingsProps {
  placeholder?: string
  filterOptions: { label: string; value: string }[]
  onSubmit?: (query: string, filter: string) => void
  initialQuery?: string
  initialFilter?: string
}

const SearchFilterMeetings = ({
  placeholder = 'Search',
  filterOptions,
  onSubmit,
  initialQuery = '',
  initialFilter = '',
}: SearchFilterMeetingsProps) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedValue, setSelectedValue] = useState(
    initialFilter || filterOptions[0]?.value || '',
  )
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize with initial values if provided
  useEffect(() => {
    setSearchQuery(initialQuery)
    if (initialFilter) {
      setSelectedValue(initialFilter)
    }
  }, [initialQuery, initialFilter])

  // Debounce search changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value
    setSearchQuery(newQuery)

    // Clear any existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timeout
    debounceTimerRef.current = setTimeout(() => {
      onSubmit?.(newQuery, selectedValue)
    }, 500)
  }

  // Handle filter changes
  const handleFilterChange = (event: SelectChangeEvent) => {
    const newFilter = event.target.value
    setSelectedValue(newFilter)
    onSubmit?.(searchQuery, newFilter)
  }

  const handleSearchButtonClick = () => {
    searchInputRef.current?.focus()
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    onSubmit?.('', selectedValue)
    searchInputRef.current?.focus()
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <form style={{ width: '100%' }}>
      <Stack alignItems="center" direction="row" spacing={1}>
        {/* Search Input */}
        <FormControl sx={{ flex: 1 }} variant="outlined">
          <OutlinedInput
            endAdornment={
              searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    disableFocusRipple={true}
                    disableRipple={true}
                    edge="end"
                    onClick={handleClearSearch}
                    sx={{ backgroundColor: 'transparent', padding: '8px' }}
                    type="button"
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }
            inputRef={searchInputRef}
            onChange={handleSearchChange}
            placeholder={placeholder}
            size="small"
            startAdornment={
              <InputAdornment position="start">
                <IconButton
                  disableFocusRipple={true}
                  disableRipple={true}
                  edge="start"
                  onClick={handleSearchButtonClick}
                  sx={{ backgroundColor: 'transparent', padding: '8px' }}
                  type="button"
                >
                  <Search />
                </IconButton>
              </InputAdornment>
            }
            value={searchQuery}
          />
        </FormControl>

        {/* Select Dropdown */}
        <FormControl size="small" sx={{ width: '150px' }}>
          <Select onChange={handleFilterChange} value={selectedValue}>
            {filterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </form>
  )
}

export default SearchFilterMeetings
