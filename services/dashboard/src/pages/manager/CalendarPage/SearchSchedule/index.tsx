import { SearchOutlined } from '@mui/icons-material'
import { alpha, Box } from '@mui/system'
import { IconButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SearchInput } from '~/components/ui/form/SearchInput'
import { useDebouncedCallback } from '~/hooks/useDebouncedCallback'

interface SearchScheduleProps {
  onSearch: (value: string) => void
  searchQuery?: string
}

export const SearchSchedule = ({
  onSearch,
  searchQuery,
}: SearchScheduleProps) => {
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation('common')

  const debouncedSearch = useDebouncedCallback(onSearch, 500)

  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    setInputValue(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setInputValue('')
    debouncedSearch.cancel()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  return (
    <Box ref={containerRef}>
      {isExpanded || searchQuery ? (
        <SearchInput
          onChange={handleChange}
          onClear={handleClear}
          placeholder={t('search')}
          value={inputValue ?? ''}
        />
      ) : (
        <IconButton
          onClick={() => setIsExpanded(true)}
          sx={{
            border: 1,
            borderColor: alpha(theme.palette.text.secondary, 0.5),
            height: 32,
            width: 32,
          }}
        >
          <SearchOutlined fontSize="small" />
        </IconButton>
      )}
    </Box>
  )
}
