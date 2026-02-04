import { SendRounded } from '@mui/icons-material'
import { darken, IconButton, lighten, Stack, TextField } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback, useEffect, useRef } from 'react'
import {
  Control,
  useController,
  UseFormRegister,
  UseFormReset,
} from 'react-hook-form'

interface FormValues {
  files?: FileList | null
  message?: string | null
}

interface ChatInputProps {
  handleSubmit: () => void
  isLoadingSubmission: boolean
  isValid: boolean
  register: UseFormRegister<FormValues>
  control: Control<FormValues>
  onTyping?: (hasContent: boolean) => void
  isDirectMessage?: boolean
  placeholder?: string
  reset?: UseFormReset<FormValues>
  editingMessage?: {
    id: string
    content: string
  } | null
}

export const ChatInput = ({
  reset,
  isDirectMessage = false,
  handleSubmit,
  isLoadingSubmission,
  isValid,
  control,
  onTyping,
  placeholder = 'Type your message here...',
  editingMessage,
}: ChatInputProps) => {
  const { field } = useController({
    control,
    defaultValue: '',
    name: 'message',
  })

  const theme = useTheme()
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editingMessage?.id) {
      field.onChange(editingMessage.content ?? '')
      inputRef.current?.focus()
    }
    if (!editingMessage) {
      field.onChange('')
    }
  }, [editingMessage?.id])

  useEffect(() => {
    if (!isLoadingSubmission) {
      inputRef.current?.focus()
    }
  }, [isLoadingSubmission])

  const cleanContent = useCallback((content?: string | null) => {
    if (!content) return ''
    let cleaned = content.trim()
    cleaned = cleaned.replace(
      /(<p>(\s|&nbsp;)*<\/p>|<p><br><\/p>|<p>\s*<br>\s*<\/p>)*$/g,
      '',
    )
    return cleaned.replace(/\s+/g, ' ')
  }, [])

  const isValidContent = useCallback(
    (content?: string | null) => cleanContent(content).length > 0,
    [cleanContent],
  )

  const handleSubmitMessage = useCallback<() => void>(() => {
    if (isValidContent(field.value)) {
      const cleaned = cleanContent(field.value)
      onTyping?.(false)
      field.onChange(cleaned)
      handleSubmit()
      field.onChange('')
      reset?.({ message: '' })
      inputRef.current?.focus()
    }
  }, [cleanContent, field, handleSubmit, isValidContent, onTyping, reset])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        handleSubmitMessage()
      }
    },
    [handleSubmitMessage],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value
      field.onChange(v)
      onTyping?.(Boolean(cleanContent(v)))
    },
    [cleanContent, field, onTyping],
  )

  return (
    <Stack alignItems="center" justifyContent="flex-start" width="100%">
      <Stack
        bgcolor={
          isDirectMessage
            ? 'transparent'
            : lighten(theme.palette.primary.main, 0.9)
        }
        padding={2}
        sx={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          position: 'relative',
          width: '100%',
          zIndex: 2,
        }}
      >
        <Stack direction="row" spacing={2} width="100%">
          <Stack
            component="form"
            direction="row"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmitMessage()
            }}
            width="100%"
          >
            <TextField
              autoComplete="off"
              disabled={isLoadingSubmission}
              fullWidth={true}
              id="message"
              inputRef={(el) => {
                field.ref(el)
                inputRef.current = el
              }}
              maxRows={4}
              multiline={true}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={
                editingMessage
                  ? 'Edit your message...'
                  : isDirectMessage
                    ? 'Type a message...'
                    : placeholder
              }
              size="small"
              sx={{
                '& .MuiInputBase-input::placeholder': {
                  color: '#667085',
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'transparent' },
                  '&.Mui-focused fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'transparent' },
                  borderRadius: '5px',
                },
                backgroundColor: 'transparent',
                border: isDirectMessage
                  ? `1px solid ${lighten(theme.palette.primary.main, 0.8)}`
                  : 'none',
                borderRadius: '5px',
                p: 2,
              }}
              value={field.value}
            />

            <IconButton
              disabled={!isValid || isLoadingSubmission}
              onClick={handleSubmitMessage}
              sx={{
                '&.Mui-disabled': {
                  backgroundColor: theme.palette.grey[300],
                },
                '&:hover': {
                  backgroundColor: darken(theme.palette.primary.main, 0.2),
                },
                alignSelf: 'flex-end',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                maxHeight: 40,
                maxWidth: 40,
                mb: 2,
                ml: -8,
                position: 'relative',
                zIndex: 1,
              }}
              type="button"
            >
              <SendRounded />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
