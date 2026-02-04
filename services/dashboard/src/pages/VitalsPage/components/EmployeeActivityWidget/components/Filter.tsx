import { CheckCircle, FilterAltOutlined } from '@mui/icons-material'
import { Menu, MenuItem, Typography } from '@mui/material'
import { UserPresence } from '@zunou-graphql/core/graphql'
import { useState } from 'react'

import { useVitalsContext } from '~/context/VitalsContext'

import ActionButton from '../../ActionButton'

export type FilterType = 'All' | UserPresence

interface FilterProps {
  activeFilter?: FilterType
  onChange: (filter: FilterType) => void
}

export const Filter = ({ activeFilter = 'All', onChange }: FilterProps) => {
  const { setting } = useVitalsContext()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const isDarkMode = setting.theme === 'dark'

  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  // Define filter options as a consistent array
  const filterOptions: FilterType[] = [
    'All',
    UserPresence.Active,
    UserPresence.Busy,
    UserPresence.Hiatus,
    UserPresence.Offline,
  ]

  // Get a display name for the filter
  const getFilterDisplayName = (filter: FilterType): string => {
    return filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase()
  }

  return (
    <>
      <ActionButton
        handleClick={handleClick}
        icon={FilterAltOutlined}
        text={getFilterDisplayName(activeFilter)}
      />
      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={open}
        slotProps={{
          paper: {
            sx: {
              bgcolor: isDarkMode ? 'grey.900' : undefined,
              color: isDarkMode ? 'white' : undefined,
              minWidth: 160,
            },
          },
        }}
      >
        {filterOptions.map((filter) => {
          const isSelected = activeFilter === filter

          return (
            <MenuItem
              key={filter}
              onClick={() => {
                onChange(filter)
                handleClose()
              }}
              selected={isSelected}
              sx={{
                alignItems: 'center',
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
              }}
            >
              <Typography>{getFilterDisplayName(filter)}</Typography>
              {isSelected && <CheckCircle color="primary" />}
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
