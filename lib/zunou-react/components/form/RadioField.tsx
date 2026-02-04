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
import { RadioInput, RadioInputProps } from './RadioInput'

interface Option {
  label: string
  value: string
}

export interface RadioFieldProps<T extends FieldValues>
  extends Omit<RadioInputProps, 'error' | 'id' | 'onChange'> {
  control: Control<T>
  disabled?: boolean
  error?: MutationError
  helperText?: string
  label?: string
  name: UnpackNestedValue<PathValue<T, Path<T>>>
  onChange?: Dispatch<string | undefined>
  options: Option[]
  required?: boolean
}

export function RadioField<T extends FieldValues>({
  control,
  disabled,
  error,
  helperText,
  label,
  name,
  onChange,
  options = [],
  required,
  value,
  ...props
}: RadioFieldProps<T>) {
  const err = useFieldError(error, name as string)

  return (
    <Controller
      control={control}
      defaultValue={(value || '') as PathValue<T, Path<T>>}
      name={name as Path<T>}
      render={({ field }) => {
        const { onChange: setFormState, ...rest } = field
        return (
          <RadioInput
            disabled={disabled}
            error={!!err}
            helperText={err || helperText}
            id={name}
            label={`${label || ''}${required ? ' *' : ''}`}
            onChange={(
              _event: ChangeEvent<HTMLInputElement>,
              value: string,
            ) => {
              setFormState(value)
              onChange?.(value)
            }}
            options={options}
            required={required}
            {...props}
            {...rest}
          />
        )
      }}
    />
  )
}
