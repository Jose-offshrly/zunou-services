import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Menu, MenuItem, TableCellProps } from '@mui/material'
import type { MouseEvent } from 'react'
import { useState } from 'react'

import { IconButton } from '../form/IconButton'
import { TableCell } from './TableCell'

interface TableCellAction {
  label: string
  onClick: () => void
}

interface Props extends TableCellProps {
  actions: TableCellAction[]
  id: string
}

export const TableMenuCell = ({ actions, id, ...props }: Props) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const open = Boolean(anchor)

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchor(event.currentTarget)
  }
  const handleClose = () => {
    setAnchor(null)
  }

  const buttonId = `table-button-${id}`
  const menuId = `table-menu-${id}`

  return (
    <TableCell
      key={id}
      sx={{
        width: 50,
        ...props,
      }}
    >
      <IconButton
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        id={buttonId}
        onClick={handleClick}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu
        MenuListProps={{
          'aria-labelledby': buttonId,
        }}
        anchorEl={anchor}
        id={menuId}
        onClose={handleClose}
        open={open}
      >
        {actions.map(({ label, onClick }) => (
          <MenuItem
            key={`${id}-${label}`}
            onClick={() => {
              onClick()
              handleClose()
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </TableCell>
  )
}
