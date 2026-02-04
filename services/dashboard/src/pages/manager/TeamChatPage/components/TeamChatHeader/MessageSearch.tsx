import {
  SearchOutlined,
  SubdirectoryArrowLeftOutlined,
} from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useMessageSearchStore } from '~/store/useMessageSearchStore'

export default function MessageSearch() {
  const { t } = useTranslation('topics')
  const { setQuery, setShowResults } = useMessageSearchStore()

  const [localQuery, setLocalQuery] = useState('')

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setShowResults(true)
  }

  const handleInputChange = (
    _event: React.SyntheticEvent,
    value: string,
    reason: string,
  ) => {
    setLocalQuery(value)

    if (reason === 'clear' || value.trim().length === 0) setShowResults(false)
  }

  const handleSelect = (_event: React.SyntheticEvent, value: string | null) => {
    if (value) {
      handleSearch(value)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && localQuery) {
      event.preventDefault()
      handleSearch(localQuery)
    }
  }

  // Options will show "Search for: {query}" when there's input
  const options = localQuery && localQuery.length > 0 ? [localQuery] : []

  return (
    <Box sx={{ width: '250px' }}>
      <Autocomplete
        blurOnSelect={true}
        clearOnBlur={false}
        componentsProps={{
          popper: {
            modifiers: [
              {
                enabled: false,
                name: 'flip',
              },
              {
                name: 'offset',
                options: {
                  offset: [-100, 4],
                },
              },
            ],
            placement: 'bottom-start',
            sx: {
              '& .MuiPaper-root': {
                width: '350px',
              },
            },
          },
        }}
        freeSolo={true}
        onChange={handleSelect}
        onInputChange={handleInputChange}
        options={options}
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 0.5, mr: -0.5 }}>
                  <SearchOutlined
                    fontSize="small"
                    sx={{ color: 'text.secondary' }}
                  />
                </InputAdornment>
              ),
            }}
            fullWidth={true}
            onKeyDown={handleKeyDown}
            placeholder={t('search_messages')}
            size="small"
          />
        )}
        renderOption={(props, option) => {
          const { onClick, ...otherProps } = props
          return (
            <li
              {...otherProps}
              onClick={(e) => {
                onClick?.(e)
                handleSearch(option)
              }}
            >
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  fontSize: '14px',
                  gap: 1,
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                <Typography
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  variant="body2"
                >
                  {t('search_for')} <strong>{option}</strong>
                </Typography>
                <SubdirectoryArrowLeftOutlined
                  fontSize="small"
                  sx={{ color: 'text.primary' }}
                />
              </Box>
            </li>
          )
        }}
        sx={{
          // Always show clear button when there's content
          '& .MuiAutocomplete-clearIndicator': {
            visibility: localQuery ? 'visible' : 'hidden',
          },

          '& .MuiAutocomplete-input': {
            paddingRight: '4px !important',
          },

          '& .MuiOutlinedInput-root': {
            paddingLeft: '8px !important',
          },
        }}
        value={localQuery ?? ''}
      />
    </Box>
  )
}
