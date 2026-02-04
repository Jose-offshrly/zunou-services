import { alpha, Avatar, Box, Stack, Typography } from '@mui/material'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { Descendant } from 'slate'

import { formatDateAndTime } from '~/utils/formatDateAndTime'
import { serializeToHTML } from '~/utils/textUtils'

import { CustomModal } from './CustomModal'

interface MessageProps {
  name: string
  gravatar?: string | null
  content: string
  messageDate?: string
}

interface DeleteMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message: MessageProps
}

export const DeleteMessageModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
}: DeleteMessageModalProps) => {
  const formattedDate = message.messageDate
    ? formatDateAndTime(message.messageDate)
    : undefined

  const isToday = (date: string) => {
    const today = new Date()
    const messageDate = new Date(date)
    return (
      today.getDate() === messageDate.getDate() &&
      today.getMonth() === messageDate.getMonth() &&
      today.getFullYear() === messageDate.getFullYear()
    )
  }

  const displayDate =
    formattedDate && isToday(message.messageDate!) ? 'Today' : formattedDate

  return (
    <CustomModal
      isOpen={isOpen}
      maxWidth={700}
      onClose={onClose}
      title="Delete Message"
    >
      <Typography color="text.secondary" variant="body2">
        Are you sure you want to delete this message? This cannot be undone.
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          border: '1px solid',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          borderRadius: 1,
          maxHeight: '300px',
          my: 2,
          overflowY: 'auto',
          p: 1,
        }}
      >
        {message.gravatar && (
          <Avatar
            alt={message.name}
            src={message.gravatar}
            sx={{
              bgcolor: !message.gravatar
                ? theme.palette.primary.main
                : undefined,
              borderRadius: 2,
              fontSize: '1rem',
              height: 48,
              width: 48,
            }}
          >
            {!message.gravatar && message.name.charAt(0).toUpperCase()}
          </Avatar>
        )}
        <Stack spacing={1} width="100%">
          <Stack direction="row" spacing={1} width="100%">
            <Typography fontWeight={600} variant="body2">
              {message.name}
            </Typography>
            {displayDate && (
              <Typography color="text.secondary" variant="caption">
                {displayDate}
              </Typography>
            )}
          </Stack>
          <Box
            dangerouslySetInnerHTML={{
              __html: (() => {
                const displayContent = message.content

                try {
                  const parsed: Descendant[] = JSON.parse(displayContent ?? '')

                  if (Array.isArray(parsed)) {
                    return serializeToHTML(parsed)
                  }
                } catch (_err) {
                  // Not JSON → fallback to legacy HTML
                }
                return displayContent ?? ''
              })(),
            }}
            sx={{
              '& p': { margin: 0 },
              padding: '0 !important',
              wordBreak: 'break-word',
            }}
          />
        </Stack>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          disableElevation={true}
          onClick={onClose}
          sx={{
            '&:hover': {
              bgcolor: theme.palette.common.white,
              borderColor: theme.palette.common.black,
            },
            borderColor: theme.palette.common.black,
            color: theme.palette.common.black,
          }}
          type="button"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disableElevation={true}
          onClick={onConfirm}
          sx={{
            '&:hover': {
              bgcolor: theme.palette.error.main,
              borderColor: theme.palette.error.main,
            },
            bgcolor: theme.palette.error.main,
            borderColor: theme.palette.error.main,
            color: theme.palette.common.white,
          }}
          type="button"
          variant="outlined"
        >
          Delete
        </Button>
      </Stack>
    </CustomModal>
  )
}
