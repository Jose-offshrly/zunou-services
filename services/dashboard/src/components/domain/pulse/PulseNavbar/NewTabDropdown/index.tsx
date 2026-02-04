import { AddOutlined, SvgIconComponent } from '@mui/icons-material'
import { Icon, Menu, MenuItem, Stack, Typography } from '@mui/material'
import React from 'react'
import { IconButton } from 'zunou-react/components/form'
import { theme } from 'zunou-react/services/Theme'

export interface TabOptionsProps {
  icon: SvgIconComponent
  isActive?: boolean
  name: string
  onClick: () => void
}

interface AddTabDropdown {
  options: TabOptionsProps[]
}

export const NewTabDropdown = ({ options }: AddTabDropdown) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleSelectMenuItem = (onClick: () => void) => {
    onClick()
    handleClose()
  }

  return (
    <>
      <IconButton onClick={handleClick} sx={{ alignSelf: 'center' }}>
        <AddOutlined fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={open}
        slotProps={{
          paper: {
            style: {
              border: `1px solid ${theme.palette.grey['200']}`,
              boxShadow: 'none',
              marginTop: -4,
              minWidth: 160,
            },
          },
        }}
      >
        {options.map(({ isActive = false, icon, name, onClick }, index) => {
          return (
            <MenuItem
              disabled={!isActive}
              key={index}
              onClick={() => handleSelectMenuItem(onClick)}
            >
              <Stack alignItems="center" direction="row" spacing={1}>
                <Icon component={icon} fontSize="small" />
                <Typography>{name}</Typography>
              </Stack>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
