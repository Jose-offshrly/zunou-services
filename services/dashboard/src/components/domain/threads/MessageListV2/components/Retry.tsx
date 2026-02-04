import {
  KeyboardArrowDown as ArrowDownIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { Box, Menu, MenuItem, Typography } from '@mui/material'
import { useRedoMessageMutation } from '@zunou-queries/core/hooks/useRedoMessageMutation'
import { Button } from '@zunou-react/components/form'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

const Retry = ({
  forceDisableInteractive,
  showEnablePulseChat,
  messageId,
}: {
  forceDisableInteractive: () => void
  showEnablePulseChat: boolean
  messageId: string | null
}) => {
  const [disablePulse, setDisablePulse] = useState(!showEnablePulseChat)

  const { mutateAsync: redoMessage, isPending: isPendingRedoMessage } =
    useRedoMessageMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  useEffect(() => {
    setDisablePulse(!showEnablePulseChat)
  }, [showEnablePulseChat])

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget as HTMLElement)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const redoHandler = () => {
    if (!messageId) {
      toast.error('Latest user message ID not found.')
      return
    }

    handleClose()

    if (isPendingRedoMessage) return

    redoMessage({ messageId })
    handleClose()
  }

  const chatWithPulseHandler = () => {
    forceDisableInteractive()
    setDisablePulse(true)
    handleClose()
  }

  return (
    <Box py={1}>
      <Button
        disabled={isPendingRedoMessage}
        endIcon={<ArrowDownIcon />}
        onClick={handleClick}
        size="small"
        startIcon={<RefreshIcon />}
        sx={{
          color: 'text.secondary',
        }}
        variant="text"
      >
        Retry
      </Button>

      <Menu anchorEl={anchorEl} onClose={handleClose} open={open}>
        <MenuItem onClick={redoHandler}>
          <Typography color="text.secondary" fontSize="small">
            Redo
          </Typography>
        </MenuItem>

        <MenuItem disabled={disablePulse} onClick={chatWithPulseHandler}>
          <Typography color="text.secondary" fontSize="small">
            Chat with Pulse
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Retry
