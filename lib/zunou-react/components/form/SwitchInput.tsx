import {
  FormControl,
  FormControlLabel,
  FormLabel,
  styled,
  Switch,
  SxProps,
} from '@mui/material'
import type { ChangeEvent } from 'react'
import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form'

import { useFieldError } from '../../services/GraphQL'
import { MutationError } from '../../types/graphql'

export interface SwitchInputProps<T extends FieldValues> {
  control: Control<T>
  error?: MutationError | null
  id: string
  label?: string
  name: Path<T>
  onChange?: (checked: boolean) => void
  value?: boolean
  disabled?: boolean
  sx?: SxProps
}

const CustomSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase': {
    '&.Mui-checked': {
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.primary.main,
        opacity: 1,
      },
      '&.Mui-disabled': {
        '& + .MuiSwitch-track': {
          backgroundColor: theme.palette.action.disabledBackground,
          opacity: 0.5,
        },
        color: theme.palette.action.disabled,
      },
      color: '#fff',
      transform: 'translateX(18px)',
    },
    '&.Mui-disabled': {
      '& + .MuiSwitch-track': {
        backgroundColor: '#e5e7eb',
        opacity: 1,
      },
      color: '#9ca3af',
    },
    padding: 3,
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#fff',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    height: 18,
    width: 18,
  },
  '& .MuiSwitch-track': {
    backgroundColor: '#d1d5db',
    borderRadius: 12,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 200,
    }),
  },

  '&.Mui-disabled': {
    cursor: 'not-allowed',
  },

  cursor: 'pointer',

  height: 24,

  padding: 0,

  width: 42,
}))

export function SwitchInput<T extends FieldValues>({
  control,
  error,
  label,
  name,
  onChange,
  value,
  disabled,
  sx,
}: SwitchInputProps<T>) {
  const err = useFieldError(error, name)

  return (
    <Controller
      control={control}
      defaultValue={value as PathValue<T, Path<T>> | undefined}
      name={name}
      render={({ field }) => {
        const { onChange: setFormState, value: fieldValue, ...rest } = field
        return (
          <FormControl
            sx={{ alignItems: 'center', flexDirection: 'row', gap: 1 }}
          >
            <FormControlLabel
              control={
                <CustomSwitch
                  {...rest}
                  checked={fieldValue ?? false}
                  disabled={disabled}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const checked = event.target.checked
                    setFormState(checked)
                    onChange?.(checked)
                  }}
                  sx={sx}
                />
              }
              label=""
              sx={{ margin: 0 }}
            />

            {label && (
              <FormLabel
                component="legend"
                disabled={disabled}
                error={!!err}
                sx={{ fontSize: 12 }}
              >
                {label}
              </FormLabel>
            )}
          </FormControl>
        )
      }}
    />
  )
}
