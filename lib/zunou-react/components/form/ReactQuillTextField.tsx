import 'react-quill/dist/quill.snow.css'

import {
  alpha,
  FormControl,
  TextFieldProps as BaseTextFieldProps,
} from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import { MutationError } from '@zunou-react/types/graphql'
import { useFieldError } from '@zunou-react/utils/useFieldError'
import type { Dispatch } from 'react'
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
  PathValue,
  UnpackNestedValue,
} from 'react-hook-form'
import ReactQuill from 'react-quill'

export interface ReactQuillTextFieldProps<T extends FieldValues>
  extends Omit<BaseTextFieldProps, 'error' | 'onChange'> {
  control: Control<T>
  error?: MutationError | FieldError | null
  helperText?: string
  label?: string
  name: UnpackNestedValue<PathValue<T, Path<T>>>
  onChange?: Dispatch<string | undefined>
  onChangeFilter?: (_val: string | undefined) => string | undefined
}

export function ReactQuillTextField<T extends FieldValues>({
  control,
  error,
  helperText,
  label,
  name,
  onChange,
  onChangeFilter,
  value,
  ...props
}: ReactQuillTextFieldProps<T>) {
  const err = useFieldError({ error, fieldName: name })

  return (
    <Controller
      control={control}
      defaultValue={value as PathValue<T, Path<T>>}
      name={name as Path<T>}
      render={({ field }) => {
        const { onChange: setFormState } = field

        return (
          <FormControl sx={{ width: '100%' }} variant="outlined">
            <div style={{ marginBottom: '8px' }}>
              {label && (
                <label
                  style={{
                    color: theme.palette.text.secondary,
                    display: 'block',
                    fontSize: '16px',
                    marginBottom: '4px',
                  }}
                >
                  {label}
                </label>
              )}
            </div>
            <div
              style={{
                backgroundColor: props.disabled
                  ? theme.palette.action.disabledBackground
                  : 'white',
                border: `1px solid ${err ? theme.palette.error.main : alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: '4px',
                height: '100%',
              }}
            >
              <ReactQuill
                modules={{
                  toolbar: false,
                }}
                onChange={(content) => {
                  const filtered = onChangeFilter
                    ? onChangeFilter(content)
                    : content
                  setFormState(filtered)
                  onChange?.(filtered)
                }}
                placeholder={props.placeholder}
                readOnly={props.disabled}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                }}
                theme="snow"
                value={value || ''}
              />
            </div>
            {(err || helperText) && (
              <div
                style={{
                  color: err
                    ? theme.palette.error.main
                    : theme.palette.text.secondary,
                  fontSize: '12px',
                  marginLeft: '14px',
                  marginTop: '4px',
                }}
              >
                {err || helperText}
              </div>
            )}
          </FormControl>
        )
      }}
    />
  )
}
