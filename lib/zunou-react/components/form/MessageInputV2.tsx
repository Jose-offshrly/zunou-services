import { SendRounded } from '@mui/icons-material'
import { darken, IconButton, lighten, Stack, TextField } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useCallback } from 'react'
import { Control, useController, UseFormRegister } from 'react-hook-form'

interface ThreadMessageInput {
  message: string
  files?: FileList | null | undefined
}

interface IMessageInput {
  handleSubmit: () => void
  isLoadingSubmission: boolean
  isValid: boolean
  register: UseFormRegister<ThreadMessageInput>
  control: Control<ThreadMessageInput>
  onInfoClick: () => void
  pulseType: string
  placeholder?: string
}

export const MessageInputV2 = ({
  handleSubmit,
  isLoadingSubmission,
  isValid,
  register,
  control,
  pulseType,
  placeholder,
  // onInfoClick,
}: IMessageInput) => {
  const { field } = useController({ control, name: 'message' })
  const theme = useTheme()

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <Stack alignItems="center" justifyContent="flex-start">
      <Stack alignItems="center" justifyContent="flex-start" width="100%">
        <Stack
          bgcolor={lighten(theme.palette.primary.main, 0.9)}
          padding={2}
          sx={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            position: 'relative',
            zIndex: 2,
          }}
          width="100%"
        >
          <Stack direction="row" spacing={2} width="100%">
            <Stack
              component="form"
              direction="row"
              onSubmit={handleSubmit}
              width="100%"
            >
              <TextField
                autoComplete="off"
                disabled={isLoadingSubmission}
                {...register('message')}
                fullWidth={true}
                id="message"
                maxRows={4}
                multiline={true}
                onChange={field.onChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  placeholder
                    ? placeholder
                    : `Ask any ${pulseType == 'generic' ? '' : `${pulseType.toUpperCase()} related `}questions here...`
                }
                size="small"
                sx={{
                  '& .MuiInputBase-input::placeholder': {
                    color: '#667085',
                  },
                  backgroundColor: 'white',
                  borderRadius: 2,
                }}
                value={field.value}
              />
              <IconButton
                disabled={!isValid || isLoadingSubmission}
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
                  ml: 1,
                }}
                type="submit"
              >
                <SendRounded />
              </IconButton>
            </Stack>
            {/* Hide info button for now */}
            {/* <IconButton
                onClick={onInfoClick}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              >
                <InfoRounded />
              </IconButton> */}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
}
