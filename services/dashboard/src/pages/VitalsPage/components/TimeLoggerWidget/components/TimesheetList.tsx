import {
  ChevronLeftOutlined,
  ChevronRightOutlined,
  EditOutlined,
} from '@mui/icons-material'
import {
  alpha,
  ButtonGroup,
  Menu,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Timesheet } from '@zunou-graphql/core/graphql'
import { Button, IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { WeekSelector } from '~/components/ui/date/WeekSelector'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { getWeekRange } from '~/utils/dateUtils'

import { TimeLogChip } from './TimeLogChip'

interface TimesheetListProps {
  isLoading?: boolean
  onEdit: (id: string) => void
  timesheets: Timesheet[]
  selectedDate: Dayjs | null
  onDateFilterChange: (date: Dayjs) => void
}

export const TimesheetList = ({
  timesheets,
  isLoading,
  selectedDate,
  onEdit,
  onDateFilterChange,
}: TimesheetListProps) => {
  const { t } = useTranslation(['common', 'vitals'])
  const { user } = useAuthContext()
  const timezone = user?.timezone ?? 'UTC'

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleSelectDate = (date: Dayjs) => onDateFilterChange(date)

  const handleCloseWeekSelector = () => setAnchorEl(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const renderWeekRange = (date: Dayjs | null) => {
    if (!date) return

    const { endDate, startDate } = getWeekRange(date)
    return `${dayjs(startDate).format('MMM DD')} - ${dayjs(endDate).format('MMM DD')}`
  }

  return (
    <Stack maxHeight={560} spacing={2}>
      {/* navigation */}
      <Stack direction="row" justifyContent="space-between">
        <Stack alignItems="center" direction="row" spacing={1}>
          <IconButton>
            <ChevronLeftOutlined fontSize="small" />
          </IconButton>
          <Button onClick={handleClick}>
            <Typography>{renderWeekRange(selectedDate)}</Typography>
          </Button>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              horizontal: 'left',
              vertical: 'bottom',
            }}
            onClose={handleCloseWeekSelector}
            open={Boolean(anchorEl)}
            slotProps={{
              paper: {
                style: {
                  marginTop: 4,
                  minWidth: 1,
                },
              },
            }}
          >
            <WeekSelector
              onSelect={handleSelectDate}
              selectedDate={selectedDate}
            />
          </Menu>
          <IconButton>
            <ChevronRightOutlined fontSize="small" />
          </IconButton>
        </Stack>

        <ButtonGroup
          color="inherit"
          disableElevation={true}
          sx={{
            '& .MuiButton-root': {
              '&:disabled': {
                backgroundColor: alpha(theme.palette.grey[100], 0.5),
                color: 'text.primary',
              },
              backgroundColor: 'common.white',
            },
            backgroundColor: alpha(theme.palette.primary.main, 0.2),
            padding: 1,
          }}
          variant="contained"
        >
          <Button>{t('weekly', { ns: 'vitals' })}</Button>
          <Button disabled={true}>{t('monthly', { ns: 'vitals' })}</Button>
        </ButtonGroup>
      </Stack>

      {/* table */}
      <Stack flex={1} minHeight={0} overflow="scroll">
        <TableContainer>
          <Table stickyHeader={true} sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('date', { ns: 'vitals' })}</TableCell>
                <TableCell>{t('check_in_time', { ns: 'vitals' })}</TableCell>
                <TableCell>{t('check_out_time', { ns: 'vitals' })}</TableCell>
                <TableCell>{t('log_hours', { ns: 'vitals' })}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : timesheets.length > 0 ? (
                timesheets.map(
                  ({
                    id,
                    checked_in_at: checkIn,
                    checked_out_at: checkOut,
                    total,
                  }) => {
                    return (
                      <TableRow key={id}>
                        <TableCell>
                          {checkIn
                            ? dayjs.utc(checkIn).tz(timezone).format('MMMM D')
                            : '-:--'}
                        </TableCell>
                        <TableCell>
                          {checkIn
                            ? dayjs.utc(checkIn).tz(timezone).format('h:mm A')
                            : '-:--'}
                        </TableCell>
                        <TableCell>
                          {checkOut
                            ? dayjs.utc(checkOut).tz(timezone).format('h:mm A')
                            : '-:--'}
                        </TableCell>
                        <TableCell>
                          <TimeLogChip checkOut={checkOut} total={total} />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => onEdit(id)}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  },
                )
              ) : (
                <TableRow>
                  <TableCell align="center" colSpan={5}>
                    <Typography variant="body2">{t('no_data')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  )
}
