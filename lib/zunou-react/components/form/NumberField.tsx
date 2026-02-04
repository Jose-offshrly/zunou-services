import { FormControl, TextField, TextFieldProps } from '@mui/material'
import type { ChangeEvent, Dispatch } from 'react'
import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
  UnpackNestedValue,
} from 'react-hook-form'

import { useFieldError } from '../../services/GraphQL'
import { MutationError } from '../../types/graphql'

export interface NumberFieldProps<T extends FieldValues>
  extends Omit<TextFieldProps, 'error' | 'onChange'> {
  control: Control<T>
  error?: MutationError | null
  helperText?: string
  label?: string
  name: UnpackNestedValue<PathValue<T, Path<T>>>
  onChange?: Dispatch<number | undefined>
  value?: number
}

export function NumberField<T extends FieldValues>({
  control,
  error,
  helperText,
  label,
  name,
  onChange,
  value,
  ...props
}: NumberFieldProps<T>) {
  const err = useFieldError(error, name as string)

  return (
    <Controller
      control={control}
      defaultValue={value as PathValue<T, Path<T>>}
      name={name as Path<T>}
      render={({ field }) => {
        const { onChange: setFormState, ...rest } = field
        return (
          <>
            <FormControl
              sx={{ display: 'flex', flex: 1, flexDirection: 'column', mb: 2 }}
              variant="outlined"
            >
              <TextField
                aria-describedby={`${name as string}-helper`}
                error={!!err}
                helperText={err || helperText}
                id={name}
                label={label}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  let asNumber = event.target.value
                    ? parseInt(event.target.value, 10)
                    : undefined
                  if (asNumber && isNaN(asNumber)) {
                    asNumber = undefined
                  }
                  setFormState(asNumber)
                  onChange?.(asNumber)
                }}
                size="small"
                {...props}
                {...rest}
                value={value || ''}
              />
            </FormControl>
          </>
        )
      }}
    />
  )
}
