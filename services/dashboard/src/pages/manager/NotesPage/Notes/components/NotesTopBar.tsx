import {
  CloseOutlined,
  GridViewOutlined,
  SearchOutlined,
  Splitscreen,
} from '@mui/icons-material'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { OutlinedInput, Stack, Typography } from '@mui/material'
import { IconButton } from '@zunou-react/components/form'
import { Button } from '@zunou-react/components/form/Button'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface NotesTopBarProps {
  isGrid: boolean
  onToggleGrid: () => void
  searchQuery: string
  onSearch: (value: string) => void
  onManageLabelClick: () => void
}

export const NotesTopBar = ({
  isGrid,
  onToggleGrid,
  searchQuery,
  onSearch,
  onManageLabelClick,
}: NotesTopBarProps) => {
  const { t } = useTranslation('notes')
  const [showSearch, setShowSearch] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [showSearch])

  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between">
      <Typography color="text.primary" fontWeight="bold" variant="h5">
        {t('notes')}
      </Typography>
      <Stack alignItems="center" direction="row" spacing={1.5}>
        {showSearch ? (
          <OutlinedInput
            endAdornment={
              <CloseOutlined
                fontSize="small"
                onClick={() => setShowSearch(false)}
                sx={{
                  '&:hover': {
                    color: 'text.primary',
                  },
                  color: 'text.secondary',
                  cursor: 'pointer',
                }}
              />
            }
            inputRef={inputRef}
            onChange={handleSearchChange}
            placeholder="Search notes"
            size="small"
            startAdornment={<SearchOutlined fontSize="small" />}
            sx={{
              gap: 1,
              paddingX: 1,
            }}
            value={searchQuery}
          />
        ) : (
          <IconButton
            onClick={() => {
              setShowSearch(true)
            }}
          >
            <SearchIcon />
          </IconButton>
        )}

        <IconButton color="primary" onClick={onToggleGrid}>
          {isGrid ? <GridViewOutlined /> : <Splitscreen />}
        </IconButton>
        <Button
          onClick={onManageLabelClick}
          size="small"
          startIcon={<LabelOutlinedIcon />}
          sx={{ height: 40, paddingX: 2 }}
          variant="contained"
        >
          {t('manage_labels')}
        </Button>
      </Stack>
    </Stack>
  )
}
