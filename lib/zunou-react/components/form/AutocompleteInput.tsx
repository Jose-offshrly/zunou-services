import {
  Autocomplete,
  AutocompleteProps,
  formLabelClasses,
  TextField,
} from '@mui/material'
import { outlinedInputClasses } from '@mui/material/OutlinedInput'

import { theme } from '../..//services/Theme'

export interface AutocompleteOption<T> {
  value: T
  label: string
}

export type AutocompleteChangeEvent<_T> = unknown

interface InternalInputProps<T>
  extends Omit<
    AutocompleteProps<AutocompleteOption<T>, false, false, false>,
    'error' | 'onChange' | 'options' | 'ref' | 'renderInput' | 'value'
  > {
  error?: boolean
  inputRef: React.ForwardedRef<unknown>
  label?: string
  onChange?: (value: T | undefined) => void
  options: AutocompleteOption<T>[]
  value?: T | undefined
  valueLabel: (value: T) => string
}

export type AutocompleteInputProps<T> = Omit<
  InternalInputProps<T>,
  'inputRef' | 'options' | 'valueLabel'
>

export function AutocompleteInput<T>({
  error,
  inputRef,
  label,
  onChange,
  value,
  valueLabel,
  ...props
}: InternalInputProps<T>) {
  const onChangeBase = (
    _event: AutocompleteChangeEvent<T>,
    option: AutocompleteOption<T> | null,
  ) => {
    onChange?.(option?.value || undefined)
  }

  return (
    <Autocomplete<AutocompleteOption<T>>
      disablePortal={true}
      onChange={onChangeBase}
      ref={inputRef}
      renderInput={(params) => <TextField {...params} label={label} />}
      sx={{
        [`.${outlinedInputClasses.input}`]: {
          color: error ? theme.palette.error.main : undefined,
        },
        [`.${outlinedInputClasses.notchedOutline}`]: {
          borderColor: error ? theme.palette.error.main : undefined,
        },
        [`.${formLabelClasses.root}`]: {
          color: error ? theme.palette.error.main : undefined,
        },
      }}
      value={
        value
          ? ({
              label: valueLabel(value),
              value: value,
            } as AutocompleteOption<T>)
          : null
      }
      {...props}
    />
  )
}
