import { TimePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { Dayjs } from 'dayjs'

interface TimeSelectorProps {
  value: Dayjs | null
  onSelect: (time: Dayjs | null) => void
  size?: 'small' | 'medium'
}

const mapSize: Record<string, number> = {
  medium: 40,
  small: 32,
}

export const TimeSelector = ({
  value,
  onSelect,
  size = 'medium',
}: TimeSelectorProps) => {
  const handleDateSelect = (time: Dayjs | null) => {
    onSelect(time)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        onChange={handleDateSelect}
        slotProps={{
          textField: {
            sx: {
              '& .MuiInputBase-root': { fontSize: 14, height: mapSize[size] },
            },
          },
        }}
        value={value}
      />
    </LocalizationProvider>
  )
}
