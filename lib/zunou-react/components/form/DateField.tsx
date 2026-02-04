import { FormControl, TextFieldProps } from '@mui/material'
import { DesktopDatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import type { Dispatch } from 'react'
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

export interface DateFieldProps<T extends FieldValues>
  extends Omit<TextFieldProps, 'error' | 'onChange' | 'value'> {
  control: Control<T>
  error?: MutationError
  helperText?: string
  label?: string
  name: UnpackNestedValue<PathValue<T, Path<T>>>
  onChange?: Dispatch<Date | undefined>
  value?: Date
}

export function DateField<T extends FieldValues>({
  control,
  error,
  helperText,
  label,
  name,
  onChange,
  value,
  ...props
}: DateFieldProps<T>) {
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
              sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}
              variant="outlined"
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  aria-describedby={`${name as string}-helper`}
                  format="DD/MM/YYYY"
                  label={label}
                  onChange={(val: Dayjs | null) => {
                    setFormState(val?.toDate())
                    onChange?.(val?.toDate())
                  }}
                  slotProps={{
                    textField: {
                      ...props,
                      ...rest,
                      error: !!err,
                      helperText: err || helperText,
                      size: 'small',
                      value: value ? dayjs(value) : null,
                    },
                  }}
                  value={dayjs(value)}
                />
              </LocalizationProvider>
            </FormControl>
          </>
        )
      }}
    />
  )
}
