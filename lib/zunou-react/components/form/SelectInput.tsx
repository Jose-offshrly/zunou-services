import {
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SelectProps,
  Typography,
} from '@mui/material'
import { forwardRef, useCallback, useState } from 'react'

export interface SelectOption {
  label: string
  value: string
}

export interface SelectInputProps extends SelectProps<string> {
  disabled?: boolean
  error?: boolean
  helperText?: string
  id: string
  label?: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  value?: string
}

export const SelectInput = forwardRef(
  (
    {
      error,
      helperText,
      id,
      label,
      onChange,
      options = [],
      placeholder,
      required,
      value,
      ...props
    }: SelectInputProps,
    _ref,
  ) => {
    const [listValue, setListValue] = useState<string | undefined>(value)

    const wrappedOnChange = useCallback(
      (event: SelectChangeEvent) => {
        setListValue(event.target.value || undefined)
        onChange?.(event, value)
      },
      [onChange],
    )

    return (
      <>
        <FormControl
          error={error}
          sx={{ display: 'flex', flexDirection: 'column' }}
        >
          {label ? (
            <FormLabel
              color={error ? 'error' : undefined}
              id={`${id}-label`}
              required={required}
              sx={{ fontSize: 'md' }}
            >
              {label}
            </FormLabel>
          ) : null}

          <Select<string>
            displayEmpty={true}
            id={id}
            onChange={wrappedOnChange}
            required={required}
            size="small"
            value={listValue}
            {...props}
            renderValue={(selected) => {
              if (selected === '') {
                return (
                  <Typography
                    sx={{
                      color: 'grey.400',
                    }}
                  >
                    {placeholder}
                  </Typography>
                )
              }

              const selectedOption = options.find(
                (option) => option.value === selected,
              )
              return selectedOption ? selectedOption.label : selected
            }}
          >
            <MenuItem disabled={true} value="">
              <Typography>{placeholder}</Typography>
            </MenuItem>
            {options.map(({ label, value: val }: SelectOption) => (
              <MenuItem key={`option-${id}-${val}`} value={val}>
                {label}
              </MenuItem>
            ))}
          </Select>

          {helperText ? (
            <FormHelperText
              color={error ? 'error' : undefined}
              id={`${id}-helper`}
            >
              {helperText}
            </FormHelperText>
          ) : null}
        </FormControl>
      </>
    )
  },
)
