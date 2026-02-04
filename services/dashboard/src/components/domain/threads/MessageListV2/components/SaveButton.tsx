import { Bookmark, BookmarkBorderOutlined } from '@mui/icons-material'
import { Box, CircularProgress, IconButton } from '@mui/material'
import { useState } from 'react'

interface SaveButtonProps {
  msgId: string
  savedMessageId?: string
  isSaved?: boolean
  onSaveMessage: (id: string) => Promise<void>
  onDeleteSavedMessage: (id: string) => Promise<void>
}

const SaveButton = ({
  msgId,
  savedMessageId = '',
  isSaved = false,
  onSaveMessage,
  onDeleteSavedMessage,
}: SaveButtonProps) => {
  const [isSubmitting, setSubmitting] = useState(false)

  const onSaveMessageHandler = async () => {
    try {
      setSubmitting(true)
      await onSaveMessage(msgId)
    } finally {
      setSubmitting(false)
    }
  }

  const onDeleteSavedMessageHandler = async () => {
    try {
      setSubmitting(true)
      await onDeleteSavedMessage(savedMessageId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <IconButton
      disabled={isSubmitting}
      onClick={() =>
        isSaved ? onDeleteSavedMessageHandler() : onSaveMessageHandler()
      }
    >
      <Box
        alignItems="center"
        display="flex"
        height={20}
        justifyContent="center"
        width={20}
      >
        {isSubmitting ? (
          <CircularProgress size={16} />
        ) : isSaved ? (
          <Bookmark color="secondary" fontSize="small" />
        ) : (
          <BookmarkBorderOutlined fontSize="small" />
        )}
      </Box>
    </IconButton>
  )
}

export default SaveButton
