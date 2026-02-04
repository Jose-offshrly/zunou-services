import {
  CalendarTodayOutlined,
  ChevronRight,
  EditOutlined,
} from '@mui/icons-material'
import {
  Menu,
  MenuItem,
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
import dayjs from 'dayjs'
import { useState } from 'react'

import { SearchInput } from '~/components/ui/form/SearchInput'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { TimeLogChip } from '~/pages/VitalsPage/components/TimeLoggerWidget/components/TimeLogChip'

interface TimesheetListProps {
  isLoading: boolean
  onEdit: (id: string) => void
  timesheets: Timesheet[]
}

export const TimesheetList = ({
  isLoading,
  onEdit,
  timesheets,
}: TimesheetListProps) => {
  const { user } = useAuthContext()
  const timezone = user?.timezone ?? 'UTC'

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleFilter = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseFilter = () => setAnchorEl(null)

  return (
    <Stack maxHeight={560} spacing={2}>
      {/* navigation */}
      <Stack direction="row" justifyContent="space-between">
        <SearchInput
          autofocus={false}
          onChange={() => null}
          onClear={() => null}
          placeholder="Search by User"
          value=""
        />
        <Button
          color="inherit"
          endIcon={
            <ChevronRight
              fontSize="small"
              sx={{ transform: 'rotate(90deg)' }}
            />
          }
          onClick={handleFilter}
          size="small"
          startIcon={<CalendarTodayOutlined fontSize="small" />}
          variant="outlined"
        >
          Today
        </Button>
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
          onClose={handleCloseFilter}
          open={Boolean(anchorEl)}
          slotProps={{
            paper: {
              style: {
                marginTop: 4,
                width: 120,
              },
            },
          }}
        >
          <MenuItem>
            <Typography fontSize="small">Today</Typography>
          </MenuItem>
          <MenuItem>
            <Typography fontSize="small">Clear</Typography>
          </MenuItem>
        </Menu>
      </Stack>

      {/* table */}
      <Stack flex={1} minHeight={0} overflow="scroll">
        <TableContainer>
          <Table stickyHeader={true} sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
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
                    user,
                  }) => {
                    return (
                      <TableRow key={id}>
                        <TableCell>{user?.name}</TableCell>
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
                  <TableCell align="center" colSpan={6}>
                    <Typography variant="body2">Nothing to show.</Typography>
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
