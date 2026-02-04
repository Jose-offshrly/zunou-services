import { DatePicker, DatePickerProps } from '@mui/x-date-pickers'
import { Dayjs } from 'dayjs'

interface CustomDatePickerProps
  extends Omit<DatePickerProps<Dayjs>, 'value' | 'onChange'> {
  label: string
  value: Dayjs | null
  onChange: (newValue: Dayjs | null) => void
}

export const CustomDatePicker = ({
  label,
  value,
  onChange,
}: CustomDatePickerProps) => {
  return (
    <DatePicker
      label={label}
      onChange={onChange}
      slotProps={{
        textField: {
          size: 'small',
          sx: {
            '& .MuiInputBase-input': {
              fontSize: 14,
            },
            '& .MuiInputLabel-root': {
              fontSize: 14,
            },
          },
        },
      }}
      value={value}
    />
  )
}
