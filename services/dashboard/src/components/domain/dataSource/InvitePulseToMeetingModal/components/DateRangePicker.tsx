import { CalendarTodayOutlined, RestartAltOutlined } from '@mui/icons-material'
import { Menu, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import dayjs, { Dayjs } from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import { useState } from 'react'

import { formatRange } from '~/utils/dateUtils'

dayjs.extend(weekday)

export interface DateRange {
  end: Dayjs | null
  start: Dayjs | null
}

interface DateRangePickerProps {
  label?: string
  onAccept: (value: DateRange) => void
  selectedEnd: Dayjs | null
  selectedStart: Dayjs | null
  timezone?: string
}

export const DateRangePicker = ({
  label,
  onAccept,
  selectedEnd,
  selectedStart,
  timezone,
}: DateRangePickerProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isOpen = Boolean(anchorEl)

  const [end, setEnd] = useState<Dayjs | null>(selectedEnd)
  const [start, setStart] = useState<Dayjs | null>(selectedStart)
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handleCancel = () => {
    setEnd(selectedEnd)
    setStart(selectedStart)
    handleClose()
  }
  const handleReset = () => {
    setEnd(dayjs().tz(timezone).endOf('day'))
    setStart(dayjs().tz(timezone).startOf('day'))
  }
  const handleAccept = () => {
    onAccept({ end, start })
    handleClose()
  }

  return (
    <Stack spacing={1}>
      <Button
        color="inherit"
        fullWidth={true}
        onClick={handleOpen}
        startIcon={
          <CalendarTodayOutlined fontSize="small" sx={{ opacity: 0.7 }} />
        }
        sx={{
          border: `1px solid ${theme.palette.grey[300]}`,
          height: 40,
          justifyContent: 'flex-start',
        }}
        variant="outlined"
      >
        <Stack color="text.primary" direction="row" spacing={1}>
          {selectedStart || selectedEnd ? (
            <Typography component="span" variant="body2">
              {formatRange(selectedStart, selectedEnd)}
            </Typography>
          ) : (
            <Typography component="span" variant="body2">
              {label}
            </Typography>
          )}
        </Stack>
      </Button>

      <Menu
        anchorEl={anchorEl}
        onClose={handleClose}
        open={isOpen}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              minWidth: 260,
              mt: 1,
              px: 2,
              py: 1.5,
            },
          },
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={1.5} sx={{ minWidth: 240 }}>
            {/* Start Date */}
            <Stack alignItems="center" direction="row" spacing={1.5}>
              <Typography
                color="text.secondary"
                fontWeight={500}
                sx={{ minWidth: 70 }}
                variant="body2"
              >
                Start Date
              </Typography>
              <DatePicker
                onChange={(newValue) => {
                  setStart(newValue)
                  setIsStartOpen(false)
                }}
                onClose={() => setIsStartOpen(false)}
                onOpen={() => setIsStartOpen(true)}
                open={isStartOpen}
                slotProps={{
                  actionBar: { actions: ['clear'] },
                  textField: {
                    size: 'small',
                    sx: { width: 168 },
                  },
                }}
                slots={{
                  toolbar: undefined,
                }}
                value={start}
              />
            </Stack>

            {/* End Date */}
            <Stack alignItems="center" direction="row" spacing={1.5}>
              <Typography
                color="text.secondary"
                fontWeight={500}
                sx={{ minWidth: 70 }}
                variant="body2"
              >
                End Date
              </Typography>
              <DatePicker
                minDate={start || undefined}
                onChange={(newValue) => {
                  setEnd(newValue)
                  setIsEndOpen(false)
                }}
                onClose={() => setIsEndOpen(false)}
                onOpen={() => setIsEndOpen(true)}
                open={isEndOpen}
                slotProps={{
                  actionBar: { actions: ['clear'] },
                  textField: {
                    size: 'small',
                    sx: { width: 168 },
                  },
                }}
                slots={{
                  toolbar: undefined,
                }}
                value={end}
              />
            </Stack>

            {/* Form Actions */}
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Button
                onClick={handleReset}
                startIcon={<RestartAltOutlined fontSize="inherit" />}
              >
                Reset
              </Button>
              <Stack direction="row" spacing={1}>
                <Button
                  disableElevation={true}
                  onClick={handleCancel}
                  size="small"
                  type="button"
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  disabled={!start || !end}
                  onClick={handleAccept}
                  size="small"
                  type="submit"
                  variant="contained"
                >
                  OK
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </LocalizationProvider>
      </Menu>
    </Stack>
  )
}
