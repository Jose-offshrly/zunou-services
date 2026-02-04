import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import {
  InputAdornment,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import React, { useCallback, useMemo, useState } from 'react'

interface LabelDropdownProps {
  open: boolean
  anchorEl: HTMLElement | null
  labels: string[]
  onSelect: (label: string) => void
  onCreate: (label: string) => void
  onClose: () => void
  mode?: 'select' | 'manage'
  selectedLabels?: string[]
  anchorOrigin?: {
    vertical: 'top' | 'center' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
  transformOrigin?: {
    vertical: 'top' | 'center' | 'bottom'
    horizontal: 'left' | 'center' | 'right'
  }
}

export const LabelDropdown: React.FC<LabelDropdownProps> = ({
  open,
  anchorEl,
  labels,
  onSelect,
  onCreate,
  onClose,
  mode = 'select',
  selectedLabels = [],
  anchorOrigin,
  transformOrigin,
}) => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => labels.filter((l) => l.toLowerCase().includes(search.toLowerCase())),
    [labels, search],
  )

  const showCreate = useMemo(
    () =>
      search.trim() &&
      !labels.some((l) => l.toLowerCase() === search.trim().toLowerCase()),
    [search, labels],
  )

  const selectedLabelsSet = useMemo(
    () => new Set(selectedLabels),
    [selectedLabels],
  )

  const isManageMode = mode === 'manage'

  const handleClose = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()

      onClose()
      setSearch('')
    },
    [onClose],
  )

  const handleSelect = useCallback(
    (label: string) => {
      if (isManageMode) {
        onCreate(label)
      } else {
        onSelect(label)
      }
    },
    [isManageMode, onCreate, onSelect],
  )

  const handleCreate = useCallback(() => {
    onCreate(search.trim())
    setSearch('')
  }, [onCreate, search])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)
    },
    [],
  )

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        if (showCreate) {
          handleCreate()
        } else if (filtered.length > 0) {
          handleSelect(filtered[0])
        }
      }
    },
    [showCreate, filtered, handleCreate, handleSelect],
  )

  const handleLabelClick = useCallback(
    (label: string) => (e: React.MouseEvent) => {
      e.stopPropagation()
      handleSelect(label)
    },
    [handleSelect],
  )

  const handleCreateClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      handleCreate()
    },
    [handleCreate],
  )

  const handleInputClick = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  )

  const handleStackClick = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  )

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={anchorOrigin}
      autoFocus={false}
      disableAutoFocus={true}
      disableAutoFocusItem={true}
      disableEnforceFocus={true}
      onClose={handleClose}
      onMouseDown={handleMouseDown}
      open={open}
      slotProps={{
        paper: {
          style: {
            maxWidth: 320,
            minWidth: 280,
          },
        },
      }}
      transformOrigin={transformOrigin}
    >
      <Stack onClick={handleStackClick} p={1} spacing={1}>
        {!isManageMode && (
          <Typography
            color={theme.palette.text.primary}
            fontSize="small"
            fontWeight="bold"
            variant="caption"
          >
            Label Note
          </Typography>
        )}
        <Typography
          color={theme.palette.text.secondary}
          fontSize="small"
          variant="caption"
        >
          Search or create label
        </Typography>
        <OutlinedInput
          autoFocus={true}
          onChange={handleSearchChange}
          onClick={handleInputClick}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search or create label"
          size="small"
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          }
          sx={{ width: '100%' }}
          value={search}
        />
      </Stack>

      <Stack sx={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.map((label) => {
          const isSelected = selectedLabelsSet.has(label)
          return (
            <ListItem disablePadding={true} key={label}>
              <ListItemButton
                onClick={handleLabelClick(label)}
                sx={{ pr: 1, py: 0.5 }}
              >
                {!isManageMode && (
                  <ListItemIcon>
                    {isSelected ? (
                      <CheckBox
                        sx={{
                          color: theme.palette.primary.main,
                          fontSize: 'large',
                        }}
                      />
                    ) : (
                      <CheckBoxOutlineBlank sx={{ fontSize: 'large' }} />
                    )}
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    color: theme.palette.text.primary,
                    fontSize: 'small',
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </Stack>

      {showCreate && (
        <ListItem disablePadding={true}>
          <ListItemButton onClick={handleCreateClick} sx={{ pr: 1, py: 0.5 }}>
            <ListItemIcon>
              <AddIcon sx={{ color: theme.palette.primary.main }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <>
                  Create <b>&quot;{search.trim()}&quot;</b>
                </>
              }
              primaryTypographyProps={{
                color: theme.palette.primary.main,
                fontSize: 'small',
              }}
            />
          </ListItemButton>
        </ListItem>
      )}

      {filtered.length === 0 && search && !showCreate && (
        <ListItem disablePadding={true}>
          <Typography color="text.secondary" px={2} py={1}>
            No matching labels found
          </Typography>
        </ListItem>
      )}
    </Menu>
  )
}
