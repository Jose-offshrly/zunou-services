import {
  alpha,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
} from '@mui/material'
import { Button } from '@zunou-react/components/form/Button'
import { useMemo } from 'react'

interface DateState {
  month: number
  year: number
}

interface DateSelectorProps {
  value: DateState
  onChange: (newState: DateState) => void
}

const commonSelectStyles = {
  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
    borderBottom: 'none',
  },
  '&:after': { borderBottom: 'none' },
  '&:before': { borderBottom: 'none' },
  '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' },
  borderRadius: 1,
  height: 30,
}

export const DateSelector = ({ value, onChange }: DateSelectorProps) => {
  const isCurrentDate = useMemo(() => {
    const now = new Date()
    return (
      value.month === now.getMonth() + 1 && value.year === now.getFullYear()
    )
  }, [value])

  const handleViewChange = () => {
    const now = new Date()
    onChange({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    })
  }

  const handleDateChange =
    (type: 'month' | 'year') => (event: SelectChangeEvent) => {
      onChange({
        ...value,
        [type]: parseInt(event.target.value),
      })
    }

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: currentYear - 2010 }, (_, i) => currentYear - i)
  }, [])

  return (
    <Stack
      alignItems="center"
      bgcolor={(theme) => alpha(theme.palette.primary.main, 0.1)}
      borderRadius={2}
      direction="row"
      height={50}
      px={1}
      spacing={0.5}
    >
      <Button
        onClick={handleViewChange}
        sx={{
          '&:hover': {
            bgcolor: isCurrentDate ? 'primary.dark' : alpha('#000', 0.05),
          },
          bgcolor: isCurrentDate ? 'primary.main' : 'transparent',
          color: isCurrentDate ? 'white' : 'text.primary',
          height: 30,
          minWidth: 100,
        }}
      >
        Current
      </Button>

      <FormControl size="small" sx={{ minWidth: 100 }}>
        <Select
          IconComponent={() => null}
          onChange={handleDateChange('month')}
          sx={{
            ...commonSelectStyles,
            '& .MuiSelect-select': {
              color: !isCurrentDate ? 'white !important' : 'text.primary',
              pb: 0,
              pr: '0!important',
              textAlign: 'center',
            },
            bgcolor: !isCurrentDate ? 'primary.main' : 'transparent',
            color: !isCurrentDate ? 'white' : 'text.primary',
          }}
          value={value.month.toString()}
          variant="standard"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <MenuItem key={i} value={i + 1}>
              {new Date(2000, i).toLocaleString('default', { month: 'long' })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 100 }}>
        <Select
          IconComponent={() => null}
          onChange={handleDateChange('year')}
          sx={{
            ...commonSelectStyles,
            '& .MuiSelect-select': {
              color: !isCurrentDate ? 'white !important' : 'text.primary',
              pb: 0,
              pr: '0!important',
              textAlign: 'center',
            },
            bgcolor: !isCurrentDate ? 'primary.main' : 'transparent',
            color: !isCurrentDate ? 'white' : 'text.primary',
          }}
          value={value.year.toString()}
          variant="standard"
        >
          {years.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  )
}
