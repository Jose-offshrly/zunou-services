import {
  alpha,
  FormControl,
  TextField as BaseTextField,
  TextFieldProps as BaseTextFieldProps,
} from '@mui/material'
import { theme } from '@zunou-react/services/Theme'
import { MutationError } from '@zunou-react/types/graphql'
import { useFieldError } from '@zunou-react/utils/useFieldError'
import type { ChangeEvent, Dispatch } from 'react'
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
  PathValue,
  UnpackNestedValue,
} from 'react-hook-form'

export interface TextFieldProps<T extends FieldValues>
  extends Omit<BaseTextFieldProps, 'error' | 'onChange'> {
  control: Control<T>
  error?: MutationError | FieldError | null
  helperText?: string
  label?: string
  name: UnpackNestedValue<PathValue<T, Path<T>>>
  onChange?: Dispatch<string | undefined>
  onChangeFilter?: (_val: string | undefined) => string | undefined
}

export function TextField<T extends FieldValues>({
  control,
  error,
  helperText,
  label,
  name,
  onChange,
  onChangeFilter,
  value,
  ...props
}: TextFieldProps<T>) {
  const err = useFieldError({ error, fieldName: name })

  return (
    <Controller
      control={control}
      defaultValue={value as PathValue<T, Path<T>>}
      name={name as Path<T>}
      render={({ field }) => {
        const { onChange: setFormState, ...rest } = field
        return (
          <>
            <FormControl sx={{ width: '100%' }} variant="outlined">
              <BaseTextField
                aria-describedby={`${name as string}-helper`}
                error={!!err}
                helperText={err || helperText}
                id={name}
                label={label}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  // Some specialist fields remove specific characters.
                  const filtered = onChangeFilter
                    ? onChangeFilter(event.target.value)
                    : event.target.value
                  setFormState(filtered)
                  onChange?.(filtered)
                }}
                size="small"
                sx={{
                  '& .MuiInputLabel-root': {
                    color: 'text.secondary',
                    fontSize: 16,
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    '&.Mui-disabled': {
                      '& fieldset': {
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                      },
                    },
                    '&:hover fieldset': {
                      borderColor: props.disabled
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.primary.main, 0.5),
                    },
                  },
                }}
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
