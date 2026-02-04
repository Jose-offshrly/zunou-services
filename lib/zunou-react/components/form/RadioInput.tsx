import {
  FormControl,
  FormControlLabel,
  formControlLabelClasses,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  RadioGroupProps,
} from '@mui/material'
import { ChangeEvent, forwardRef } from 'react'

interface Option {
  label: string
  value: string
}

export interface RadioInputProps extends RadioGroupProps {
  disabled?: boolean
  error?: boolean
  helperText?: string
  id: string
  label?: string
  options: Option[]
  required?: boolean
}

export const RadioInput = forwardRef(
  (
    {
      disabled,
      error,
      helperText,
      id,
      label,
      onChange,
      options = [],
      required,
      ...props
    }: RadioInputProps,
    ref,
  ) => {
    const onChangeBase = (
      event: ChangeEvent<HTMLInputElement>,
      value: string,
    ) => {
      onChange?.(event, value)
    }

    return (
      <FormControl
        component="fieldset"
        error={error}
        sx={{ display: 'flex', flexDirection: 'column', mb: 2 }}
      >
        {label ? (
          <FormLabel
            color="secondary"
            component="legend"
            disabled={disabled}
            error={error}
            sx={{ fontSize: 12 }}
          >
            {label}
          </FormLabel>
        ) : null}

        <RadioGroup
          aria-labelledby={`${id}-label`}
          id={id}
          onChange={onChangeBase}
          ref={ref}
          row={true}
          {...props}
        >
          {options.map(({ label, value }: Option) => (
            <FormControlLabel
              control={
                <Radio
                  color={error ? 'error' : undefined}
                  disabled={disabled}
                  required={required}
                  value={value}
                />
              }
              key={`radio-option-${id}-${value}`}
              label={label}
              sx={{
                [`.${formControlLabelClasses.asterisk}`]: {
                  display: 'none',
                },
              }}
            />
          ))}
        </RadioGroup>

        {helperText ? (
          <FormHelperText error={error} id={`${id}-helper`}>
            {helperText}
          </FormHelperText>
        ) : null}
      </FormControl>
    )
  },
)
