import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined'
import { IconButton, Menu, SxProps, Theme } from '@mui/material'
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react'
import React, { useState } from 'react'

interface EmojiPickerButtonProps {
  onEmojiClick?: (emojiData: EmojiClickData) => void
  size?: 'small' | 'medium' | 'large'
  sx?: SxProps<Theme>
  iconSx?: SxProps<Theme>
  disabled?: boolean
}

export default function EmojiPickerButton({
  onEmojiClick,
  size = 'medium',
  sx,
  iconSx,
  disabled = false,
}: EmojiPickerButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (onEmojiClick) {
      onEmojiClick(emojiData)
    }
    handleClose()
  }

  return (
    <>
      <IconButton
        disabled={disabled}
        onClick={handleClick}
        size={size}
        sx={{
          borderRadius: 0,
          ...sx,
        }}
      >
        <AddReactionOutlinedIcon
          fontSize={size === 'large' ? 'medium' : 'small'}
          sx={iconSx}
        />
      </IconButton>

      <Menu
        MenuListProps={{
          sx: {
            padding: 0,
          },
        }}
        TransitionProps={{
          timeout: 150,
        }}
        anchorEl={anchorEl}
        onClose={handleClose}
        open={open}
        slotProps={{
          paper: {
            sx: {
              '& .epr-category-nav': {
                display: 'none',
              },
              '& .epr-emoji-category-label': {
                fontSize: '0.75rem',
                padding: '4px 8px',
              },
              '& .epr-emoji-list': {
                '& .epr-emoji-img': {
                  height: '20px !important',
                  width: '20px !important',
                },
                '& button': {
                  padding: '2px !important',
                },
                '& span': {
                  fontSize: '20px !important',
                },
              },
              '& .epr-skin-tones': {
                display: 'none',
              },
              backgroundColor: 'transparent',
              boxShadow: 'none',
              overflow: 'visible',
            },
          },
        }}
      >
        <EmojiPicker
          emojiStyle={EmojiStyle.NATIVE}
          height={350}
          lazyLoadEmojis={true}
          onEmojiClick={handleEmojiClick}
          previewConfig={{ showPreview: false }}
        />
      </Menu>
    </>
  )
}
