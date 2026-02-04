import { CloseOutlined, SearchOutlined } from '@mui/icons-material'
import { FormControl, OutlinedInput, SxProps, Theme } from '@mui/material'
import { ChangeEvent } from 'react'

interface SearchInputProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  value: string
  autofocus?: boolean
  placeholder?: string
  fullWidth?: boolean
  sx?: SxProps<Theme>
  rounded?: boolean
  innerSx?: SxProps<Theme>
  disabled?: boolean
  onClose?: () => void
}

export const SearchInput = ({
  autofocus = true,
  onChange,
  onClear,
  placeholder = 'Search text',
  value,
  fullWidth = false,
  sx,
  rounded = false,
  innerSx,
  disabled = false,
  onClose,
}: SearchInputProps) => {
  return (
    <FormControl
      disabled={disabled}
      size="small"
      sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}
      variant="outlined"
    >
      <OutlinedInput
        autoFocus={autofocus}
        disabled={disabled}
        endAdornment={
          (onClose || (value && !disabled)) && (
            <CloseOutlined
              fontSize="small"
              onClick={onClose || onClear}
              sx={{
                '&:hover': { color: 'text.primary' },
                color: 'text.secondary',
                cursor: 'pointer',
              }}
            />
          )
        }
        onChange={onChange}
        placeholder={placeholder}
        size="small"
        startAdornment={
          <SearchOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
        }
        sx={{
          borderRadius: rounded ? '9999px' : 1,
          fontSize: 'small',
          gap: 1,
          height: 32,
          paddingX: 1,
          placeholder: {
            fontSize: 'small',
          },
          ...innerSx,
        }}
        value={value}
      />
    </FormControl>
  )
}
