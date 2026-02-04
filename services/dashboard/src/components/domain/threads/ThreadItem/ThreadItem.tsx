import { Delete, Edit, MoreHoriz } from '@mui/icons-material'
import {
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { IconButton } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Routes } from '~/services/Routes'

interface ThreadItemProps {
  name: string
  id: string
  openEditThreadModal: (id?: string | null) => void
  openDeleteThreadConfirmationModal: (id?: string | null) => void
}

export const ThreadItem = ({
  name,
  id,
  openEditThreadModal,
  openDeleteThreadConfirmationModal,
}: ThreadItemProps) => {
  const navigate = useNavigate()
  const { organizationId, threadId: defaultThreadId } = useParams()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<
    string | undefined | null
  >(defaultThreadId)

  const handleOpenThread = (threadId: string) => {
    if (!organizationId) throw new Error('Organization ID not found')

    navigate(
      Routes.ThreadDetail.replace(':organizationId', organizationId).replace(
        ':threadId',
        threadId,
      ),
    )
  }

  const handleEditThread = () => {
    openEditThreadModal(selectedThreadId)
    handleCloseMoreAction()
  }

  const handleDeleteThread = () => {
    openDeleteThreadConfirmationModal(selectedThreadId)
    handleCloseMoreAction()
  }

  const handleOpenMoreAction = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    event.stopPropagation()

    setAnchorEl(event.currentTarget)
    setSelectedThreadId(id)
  }

  const handleCloseMoreAction = () => {
    setAnchorEl(null)
    setSelectedThreadId(null)
  }

  return (
    <>
      <ListItem
        className={id === selectedThreadId ? 'active' : ''}
        component="div"
        disableGutters={true}
        disablePadding={true}
        key={id}
        sx={{
          '&:hover .moreButton, &.active .moreButton': {
            display: 'flex',
            visibility: 'visible',
          },
          color: 'black',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <ListItemButton
          onClick={() => handleOpenThread(id)}
          selected={id === defaultThreadId || id === selectedThreadId}
          sx={{ borderRadius: 2, height: 42, paddingX: 1 }}
        >
          <ListItemText>
            <Typography fontSize={14} noWrap={true}>
              {name}
            </Typography>
          </ListItemText>
          <IconButton
            className="moreButton"
            onClick={(event) => handleOpenMoreAction(event, id)}
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: 'transparent',
                color: theme.palette.grey['600'],
              },
              color: theme.palette.grey['400'],
              display: 'none',
              visibility: 'hidden',
            }}
          >
            <MoreHoriz />
          </IconButton>
        </ListItemButton>
      </ListItem>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'center',
        }}
        id="actions-menu"
        onClose={handleCloseMoreAction}
        open={Boolean(anchorEl)}
        slotProps={{
          paper: {
            style: {
              border: `1px solid ${theme.palette.grey['200']}`,
              boxShadow: 'none',
              minWidth: 120,
            },
          },
        }}
        sx={{
          '& .MuiMenuItem-root': {
            fontSize: '0.875rem',
            gap: 1,
          },
        }}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'top',
        }}
      >
        <MenuItem onClick={handleEditThread}>
          <Edit fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteThread}>
          <Delete fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </>
  )
}
