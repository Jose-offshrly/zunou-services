import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SelectProps,
} from '@mui/material'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { Dispatch, forwardRef, useCallback, useEffect, useState } from 'react'

import { filterWidth } from '../../services/Theme'

// eslint-disable-next-line import/no-named-as-default-member
dayjs.extend(quarterOfYear)

export interface DateRangeFilterProps
  extends Omit<SelectProps<string>, 'onChange'> {
  setFrom?: Dispatch<Date | undefined>
  setUntil?: Dispatch<Date | undefined>
}

enum options {
  AllTime = 'All Time',
  Last7Days = 'Last 7 days',
  Last30Days = 'Last 30 days',
  ThisMonth = 'This Month',
  LastMonth = 'Last Month',
  ThisQuarter = 'This Quarter',
  LastQuarter = 'Last Quarter',
  ThisYear = 'This Year',
  LastYear = 'Last Year',
  Last12Months = 'Last 12 Months',
}

export const DateRangeFilter = forwardRef(
  (
    { label = 'Date Range', setFrom, setUntil, ...props }: DateRangeFilterProps,
    ref,
  ) => {
    const [selected, setSelected] = useState<string>(options.AllTime)

    useEffect(() => {
      if ((selected as options) === options.AllTime) {
        setFrom?.(undefined)
        setUntil?.(undefined)
      } else if ((selected as options) === options.Last7Days) {
        setFrom?.(dayjs().subtract(7, 'day').toDate())
        setUntil?.(dayjs().endOf('day').toDate())
      } else if ((selected as options) === options.Last30Days) {
        setFrom?.(dayjs().subtract(30, 'day').toDate())
        setUntil?.(dayjs().endOf('day').toDate())
      } else if ((selected as options) === options.ThisMonth) {
        setFrom?.(dayjs().startOf('month').toDate())
        setUntil?.(dayjs().endOf('day').toDate())
      } else if ((selected as options) === options.LastMonth) {
        setFrom?.(dayjs().startOf('month').subtract(1, 'month').toDate())
        setUntil?.(dayjs().subtract(1, 'month').endOf('month').toDate())
      } else if ((selected as options) === options.ThisQuarter) {
        setFrom?.(dayjs().startOf('quarter').toDate())
        setUntil?.(dayjs().endOf('day').toDate())
      } else if ((selected as options) === options.LastQuarter) {
        setFrom?.(dayjs().startOf('quarter').subtract(1, 'quarter').toDate())
        setUntil?.(dayjs().subtract(1, 'quarter').endOf('quarter').toDate())
      } else if ((selected as options) === options.ThisYear) {
        setFrom?.(dayjs().startOf('year').toDate())
        setUntil?.(dayjs().endOf('month').toDate())
      } else if ((selected as options) === options.LastYear) {
        setFrom?.(dayjs().startOf('year').subtract(1, 'year').toDate())
        setUntil?.(dayjs().subtract(1, 'year').endOf('year').toDate())
      } else if ((selected as options) === options.Last12Months) {
        setFrom?.(dayjs().subtract(12, 'month').toDate())
        setUntil?.(dayjs().endOf('day').toDate())
      }
    }, [selected, setFrom, setUntil])

    const onChange = useCallback((event: SelectChangeEvent) => {
      setSelected(event.target.value || options.AllTime)
    }, [])

    return (
      <FormControl variant="outlined">
        <InputLabel htmlFor={props.id} size="small">
          {label}
        </InputLabel>
        <Select
          id={props.id}
          inputRef={ref}
          label={label}
          onChange={onChange}
          size="small"
          sx={{ width: filterWidth }}
          value={selected}
          {...props}
        >
          {Object.entries(options).map(([name, value]) => (
            <MenuItem key={name} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  },
)
