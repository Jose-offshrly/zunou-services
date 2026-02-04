import { EditOutlined } from '@mui/icons-material'
import { Box, Stack, SxProps, TextField, Typography } from '@mui/material'
import { truncate } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from 'react-hook-form'
import { IconButton } from 'zunou-react/components/form'

interface EditableTextFieldProps<T extends FieldValues> {
  name: Path<T>
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  placeholder?: string
  rows?: number
  size?: 'small' | 'medium'
  sx?: SxProps
  value?: string
  initialTypingState?: boolean
  disabled?: boolean
}

export const EditableTextField = <T extends FieldValues>({
  name,
  register,
  errors,
  placeholder,
  value,
  size = 'medium',
  sx,
  initialTypingState,
  disabled = false,
}: EditableTextFieldProps<T>) => {
  const [isTypingState, setIsTypingState] = useState(
    initialTypingState ?? false,
  )
  const formRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsTypingState(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isTypingState) {
      // Multiple attempts with increasing delays
      const attempts = [0, 50, 100, 200, 500]

      attempts.forEach((delay) => {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }, delay)
      })
    }
  }, [isTypingState])

  useEffect(() => {
    console.log('isTypingState', isTypingState)
  }, [isTypingState])

  return (
    <Box ref={formRef}>
      {isTypingState ? (
        <TextField
          {...register(name)}
          autoFocus={true}
          disabled={disabled}
          error={!!errors[name]}
          fullWidth={true}
          helperText={errors[name]?.message as string}
          id={name as string}
          inputRef={inputRef}
          placeholder={placeholder}
          size={size}
          sx={{ ...sx }}
        />
      ) : (
        <Stack
          alignItems="center"
          color={value?.trim() ? 'text.primary' : 'text.secondary'}
          direction="row"
          height={40}
          onClick={() => setIsTypingState(true)}
          spacing={1}
        >
          <Typography sx={{ ...sx }}>
            {truncate(value?.trim() ?? '', { length: 50 }) || placeholder}
          </Typography>
          <IconButton size="small">
            <EditOutlined
              fontSize="small"
              sx={{ color: 'text.secondary', height: 16, width: 16 }}
            />
          </IconButton>
        </Stack>
      )}
    </Box>
  )
}
