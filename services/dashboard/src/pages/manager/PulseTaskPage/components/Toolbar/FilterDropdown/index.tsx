import { Circle } from '@mui/icons-material'
import {
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChipButton } from '~/components/ui/button/ChipButton'

interface FilterOption<T> {
  color: string
  label: string
  value: T
}

interface FilterDropdownProps<T> {
  isActive: boolean
  options: FilterOption<T>[]
  onClear: () => void
  onSelect: (value: T) => void
  label: string
}
export const FilterDropdown = <T,>({
  isActive,
  options,
  onClear,
  onSelect,
  label,
}: FilterDropdownProps<T>) => {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (value: T) => {
    onSelect(value)
    handleClose()
  }

  const handleClear = () => {
    onClear()
    handleClose()
  }

  return (
    <>
      <ChipButton
        isActive={isActive}
        label={label}
        onClick={handleClick}
        onDelete={isActive ? handleClear : undefined}
      />
      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            style: {
              marginTop: 4,
              minWidth: 1,
            },
          },
        }}
      >
        {options.map(({ color, label, value }, index) => (
          <MenuItem
            key={index}
            onClick={() => handleSelect(value)}
            sx={{ color }}
          >
            <ListItemIcon sx={{ justifyContent: 'center' }}>
              <Circle sx={{ color, height: 12, width: 12 }} />
            </ListItemIcon>
            <Typography fontSize="small">{label}</Typography>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleClear} sx={{ color: 'text.secondary' }}>
          <ListItemIcon sx={{ justifyContent: 'center' }}>
            <Circle sx={{ color: 'text.secondary', height: 12, width: 12 }} />
          </ListItemIcon>
          <Typography fontSize="small">{t('clear')}</Typography>
        </MenuItem>
      </Menu>
    </>
  )
}
