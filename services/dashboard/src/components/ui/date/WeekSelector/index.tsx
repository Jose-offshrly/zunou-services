import { styled } from '@mui/material/styles'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay'
import dayjs, { Dayjs } from 'dayjs'
import isBetweenPlugin from 'dayjs/plugin/isBetween'
import { useState } from 'react'

import { isInSameWeek } from '~/utils/dateUtils'

dayjs.extend(isBetweenPlugin)

interface CustomPickerDayProps extends PickersDayProps<Dayjs> {
  isSelected: boolean
  isHovered: boolean
}

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== 'isSelected' && prop !== 'isHovered',
})<CustomPickerDayProps>(({ theme, isSelected, isHovered, day }) => ({
  borderRadius: 0,
  ...(isSelected && {
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.main,
    },
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }),
  ...(isHovered && {
    '&:hover, &:focus': {
      backgroundColor: theme.palette.primary.light,
    },
    backgroundColor: theme.palette.primary.light,
  }),
  ...(day.day() === 0 && {
    borderBottomLeftRadius: '50%',
    borderTopLeftRadius: '50%',
  }),
  ...(day.day() === 6 && {
    borderBottomRightRadius: '50%',
    borderTopRightRadius: '50%',
  }),
})) as React.ComponentType<CustomPickerDayProps>

interface WeekSelectorProps {
  onSelect: (day: Dayjs) => void
  selectedDate: Dayjs | null
}

export const WeekSelector = ({ onSelect, selectedDate }: WeekSelectorProps) => {
  const [hoveredDay, setHoveredDay] = useState<Dayjs | null>(null)

  const handleChange = (value: Dayjs) => {
    onSelect(value)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        onChange={handleChange}
        showDaysOutsideCurrentMonth={true}
        slotProps={{
          day: (ownerState) => ({
            hoveredDay,
            onPointerEnter: () => setHoveredDay(ownerState.day),
            onPointerLeave: () => setHoveredDay(null),
            selectedDay: selectedDate,
          }),
        }}
        slots={{
          day: (
            props: PickersDayProps<Dayjs> & {
              selectedDay?: Dayjs | null
              hoveredDay?: Dayjs | null
            },
          ) => {
            const { day, selectedDay, hoveredDay, ...other } = props

            return (
              <CustomPickersDay
                {...other}
                day={day}
                disableMargin={true}
                isHovered={isInSameWeek(day, hoveredDay)}
                isSelected={isInSameWeek(day, selectedDay)}
                selected={false}
                sx={{ px: 2.5 }}
              />
            )
          },
        }}
        value={selectedDate}
      />
    </LocalizationProvider>
  )
}
