import { SearchOutlined } from '@mui/icons-material'
import { Box } from '@mui/system'
import { IconButton } from '@zunou-react/components/form'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SearchInput } from '~/components/ui/form/SearchInput'
import { useDebouncedCallback } from '~/hooks/useDebouncedCallback'

interface TaskSearchFilterProps {
  onSearch: (value: string) => void
  onClear: () => void
  searchQuery?: string
}

export const TaskSearchFilter = ({
  onSearch,
  onClear,
  searchQuery,
}: TaskSearchFilterProps) => {
  const { t } = useTranslation('tasks')

  const [inputValue, setInputValue] = useState(searchQuery)
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

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
    onClear()
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
          placeholder={t('search_tasks', { ns: 'tasks' })}
          value={inputValue ?? ''}
        />
      ) : (
        <IconButton onClick={() => setIsExpanded(true)}>
          <SearchOutlined fontSize="medium" sx={{ color: 'black' }} />
        </IconButton>
      )}
    </Box>
  )
}
