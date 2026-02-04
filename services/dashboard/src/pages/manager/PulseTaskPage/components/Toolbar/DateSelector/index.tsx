import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs, { Dayjs } from 'dayjs'

interface DateSelectorProps {
  onClose: () => void
  onSelect: (date: Date) => void
}

export const DateSelector = ({ onClose, onSelect }: DateSelectorProps) => {
  const handleDateSelect = (date: Dayjs) => {
    const formattedDate = dayjs(date).format('YYYY-MM-DD')

    onSelect(new Date(formattedDate))
    onClose()
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        onChange={handleDateSelect}
        views={['year', 'month', 'day']}
      />
    </LocalizationProvider>
  )
}
