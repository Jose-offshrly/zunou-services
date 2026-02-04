import { SelectChangeEvent } from '@mui/material'
import type { Dispatch } from 'react'
import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form'

import { useFieldError } from '../../services/GraphQL'
import { MutationError } from '../../types/graphql'
import { SelectInput, SelectInputProps, SelectOption } from './SelectInput'

export interface SelectFieldProps<T extends FieldValues>
  extends Omit<SelectInputProps, 'error' | 'id' | 'onChange'> {
  control: Control<T>
  enableOther?: boolean
  error?: MutationError | null
  helperText?: string
  label?: string
  placeholder?: string
  name: PathValue<T, Path<T>>
  onChange?: Dispatch<string | undefined>
  options: SelectOption[]
}

export function SelectField<T extends FieldValues>({
  control,
  error,
  helperText,
  label,
  name,
  onChange,
  placeholder,
  options = [],
  value,
  ...props
}: SelectFieldProps<T>) {
  const err = useFieldError(error, name as string)

  return (
    <Controller
      control={control}
      defaultValue={(value ?? '') as PathValue<T, Path<T>>}
      name={name as Path<T>}
      render={({ field }) => {
        const { onChange: setFormState, ...rest } = field
        return (
          <SelectInput
            error={!!err}
            helperText={err ?? helperText}
            id={name}
            label={label}
            onChange={(event: SelectChangeEvent) => {
              setFormState(event.target.value ?? undefined)
              onChange?.(event.target.value ?? undefined)
            }}
            options={options}
            placeholder={placeholder}
            {...props}
            {...rest}
          />
        )
      }}
    />
  )
}
