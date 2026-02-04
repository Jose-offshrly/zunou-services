import { Checkbox, CheckboxProps, FormControlLabel } from '@mui/material'
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

export interface CheckboxFieldProps<T extends FieldValues>
  extends Omit<CheckboxProps, 'error' | 'id' | 'onChange'> {
  control: Control<T>
  disabled?: boolean
  error?: MutationError
  label?: string
  name: UnpackNestedValue<PathValue<T, Path<T>>>
  onChange?: Dispatch<boolean>
  required?: boolean
}

export function CheckboxField<T extends FieldValues>({
  control,
  disabled,
  error,
  label,
  name,
  onChange,
  required,
  value,
  ...props
}: CheckboxFieldProps<T>) {
  const err = useFieldError(error, name as string)
  console.log('err', err)

  return (
    <Controller
      control={control}
      defaultValue={(value || false) as PathValue<T, Path<T>>}
      name={name as Path<T>}
      render={({ field }) => {
        const { onChange: setFormState, ...rest } = field
        return (
          <FormControlLabel
            control={
              <Checkbox
                disabled={disabled}
                id={name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setFormState(event.target.checked)
                  onChange?.(event.target.checked)
                }}
                required={required}
                {...props}
                {...rest}
              />
            }
            label={`${label || ''}${required ? ' *' : ''}`}
          />
        )
      }}
    />
  )
}
