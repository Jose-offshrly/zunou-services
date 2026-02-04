import { Search } from '@mui/icons-material'
import { InputAdornment, TextField } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  isDarkMode: boolean
  vitalsMode: boolean
}

export const SearchBar = ({
  searchTerm,
  onSearchChange,
  isDarkMode,
  vitalsMode,
}: SearchBarProps) => {
  const { t } = useTranslation()

  return (
    <TextField
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search
              sx={{
                color: vitalsMode && isDarkMode ? 'grey.700' : undefined,
              }}
            />
          </InputAdornment>
        ),
      }}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={t('search_member')}
      size="small"
      sx={{
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: vitalsMode && isDarkMode ? 'grey.700' : undefined,
          },
        },
        flexGrow: 1,
      }}
      value={searchTerm}
    />
  )
}
