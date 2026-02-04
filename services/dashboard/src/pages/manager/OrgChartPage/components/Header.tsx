import CloseIcon from '@mui/icons-material/Close'
import CloseFullscreenOutlinedIcon from '@mui/icons-material/CloseFullscreenOutlined'
import OpenInFullOutlinedIcon from '@mui/icons-material/OpenInFullOutlined'
import SearchIcon from '@mui/icons-material/Search'
import { alpha, Divider, IconButton, InputBase, Stack } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  canEdit: boolean
  onCreateClick: () => void
}

export const Header = ({
  isExpanded,
  setIsExpanded,
  searchQuery,
  onSearchChange,
  canEdit,
  onCreateClick,
}: HeaderProps) => {
  const { t } = useTranslation(['common', 'org'])

  const [showSearch, setShowSearch] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  return (
    <Stack alignItems="center" direction="row" justifyContent="flex-end" p={2}>
      <Stack
        alignItems="center"
        direction="row"
        divider={<Divider flexItem={true} orientation="vertical" />}
        justifyContent="flex-end"
        spacing={2}
        width="100%"
      >
        <Button
          color="primary"
          onClick={() => setIsExpanded(!isExpanded)}
          startIcon={
            isExpanded ? (
              <CloseFullscreenOutlinedIcon />
            ) : (
              <OpenInFullOutlinedIcon />
            )
          }
          variant="outlined"
        >
          {isExpanded ? t('collapse') : t('expand')}
        </Button>

        {showSearch ? (
          <Stack
            alignItems="center"
            bgcolor="white"
            border={1}
            borderColor={alpha(theme.palette.primary.main, 0.1)}
            borderRadius={2}
            direction="row"
            flex={1}
            maxWidth={400}
            px={1}
            py={0.5}
            spacing={1}
          >
            <SearchIcon />
            <InputBase
              inputRef={inputRef}
              onChange={handleSearchChange}
              placeholder={t('search_members', { ns: 'org' })}
              sx={{ flex: 1 }}
              value={searchQuery}
            />
            <IconButton
              onClick={() => {
                setShowSearch(false)
                onSearchChange('')
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        ) : (
          <IconButton
            onClick={() => {
              setShowSearch(true)
              setTimeout(() => {
                inputRef.current?.focus()
              }, 0)
            }}
            size="small"
            sx={{
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 1,
              p: 1,
            }}
          >
            <SearchIcon />
          </IconButton>
        )}

        {canEdit && (
          <Button onClick={onCreateClick} variant="contained">
            {t('new_group', { ns: 'org' })}
          </Button>
        )}
      </Stack>
    </Stack>
  )
}
