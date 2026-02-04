import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SearchIcon from '@mui/icons-material/Search'
import {
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { Dayjs } from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useVitalsContext } from '~/context/VitalsContext'

import { DateRange, DateRangePicker } from './DateRangePicker'

export enum MeetingFilterType {
  All = 'ALL',
  Meet = 'MEET',
  Teams = 'TEAMS',
  Zoom = 'ZOOM',
}

interface MeetingsToolbarProps {
  endDate: Dayjs | null
  isVitalsMode?: boolean
  onDateRangeChange: (value: DateRange) => void
  onSearchChange: (query: string) => void
  onTypeChange?: (type: MeetingFilterType) => void
  searchQuery: string
  selectedType?: MeetingFilterType
  startDate: Dayjs | null
  withTypeFilter?: boolean
}

export const MeetingsToolbar = ({
  endDate,
  isVitalsMode = false,
  onDateRangeChange,
  onSearchChange,
  onTypeChange,
  searchQuery,
  selectedType = MeetingFilterType.All,
  startDate,
  withTypeFilter = true,
}: MeetingsToolbarProps) => {
  const { t } = useTranslation(['common', 'vitals'])
  const { user } = useAuthContext()
  const { setting } = useVitalsContext()

  const [typeAnchorEl, setTypeAnchorEl] = useState<null | HTMLElement>(null)

  const muiTheme = useTheme()
  const isDarkMode = setting.theme === 'dark' && isVitalsMode
  const timezone = user?.timezone ?? 'UTC'

  const typeMenuOpen = Boolean(typeAnchorEl)

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value)
  }

  const handleTypeFilterClose = () => {
    setTypeAnchorEl(null)
  }

  const handleTypeFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    if (typeAnchorEl) {
      handleTypeFilterClose()
    } else {
      setTypeAnchorEl(event.currentTarget)
    }
  }

  const handleTypeChange = (type: MeetingFilterType) => {
    if (onTypeChange) {
      onTypeChange(type)
    }
    handleTypeFilterClose()
  }

  const getTypeLabel = () => {
    switch (selectedType) {
      case MeetingFilterType.Meet:
        return 'Meet'
      case MeetingFilterType.Teams:
        return 'Teams'
      case MeetingFilterType.Zoom:
        return 'Zoom'
      default:
        return 'All Types'
    }
  }

  return (
    <Stack alignItems="center" direction="row" px={2} spacing={2}>
      {/* Search Term filter */}
      <Stack flex={2}>
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ color: isDarkMode ? 'text.secondary' : undefined }}
                />
              </InputAdornment>
            ),
          }}
          onChange={handleSearchChange}
          placeholder={t('search_meetings', { ns: 'vitals' })}
          size="small"
          sx={{
            '& .MuiInputBase-input::placeholder': {
              fontSize: 14,
            },
            '& .MuiInputBase-root': {
              backgroundColor: isDarkMode ? 'grey.900' : undefined,
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
              color: isDarkMode ? 'common.white' : undefined,
              height: 40,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            flex: 1,
          }}
          value={searchQuery}
        />
      </Stack>

      {/* Date Range filter */}
      <DateRangePicker
        label="Select Date"
        onAccept={onDateRangeChange}
        selectedEnd={endDate}
        selectedStart={startDate}
        timezone={timezone}
      />

      {/* Meeting Type filter */}
      {withTypeFilter && (
        <Stack alignItems="center" direction="row" flex={1} spacing={1}>
          <Stack
            direction="row"
            onClick={handleTypeFilterClick}
            style={{
              alignItems: 'center',
              backgroundColor: isDarkMode
                ? muiTheme.palette.grey[900]
                : undefined,
              border: `1px solid ${isDarkMode ? muiTheme.palette.grey[700] : muiTheme.palette.grey[300]}`,
              borderRadius: muiTheme.shape.borderRadius,
              color: isDarkMode
                ? muiTheme.palette.common.white
                : muiTheme.palette.text.primary,
              cursor: 'pointer',
              fontFamily: muiTheme.typography.fontFamily,
              height: 40,
              justifyContent: 'space-between',
              padding: '4px 16px',
              width: '100%',
            }}
          >
            <Typography variant="body2">{getTypeLabel()}</Typography>
            <KeyboardArrowDownIcon
              style={{ fontSize: '20px', marginLeft: '8px' }}
            />
          </Stack>

          <Menu
            PaperProps={{
              style: {
                backgroundColor: isDarkMode
                  ? muiTheme.palette.grey[900]
                  : muiTheme.palette.background.paper,
                border: `1px solid ${isDarkMode ? muiTheme.palette.grey[700] : muiTheme.palette.grey[300]}`,
                color: isDarkMode
                  ? muiTheme.palette.common.white
                  : muiTheme.palette.text.primary,
              },
            }}
            anchorEl={typeAnchorEl}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            onClose={handleTypeFilterClose}
            open={typeMenuOpen}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            <MenuItem
              onClick={() => handleTypeChange(MeetingFilterType.All)}
              sx={{
                color:
                  selectedType === MeetingFilterType.All
                    ? 'primary.main'
                    : 'inherit',
                fontSize: '14px',
                py: 1,
              }}
            >
              All Types
            </MenuItem>
            <MenuItem
              onClick={() => handleTypeChange(MeetingFilterType.Meet)}
              sx={{
                color:
                  selectedType === MeetingFilterType.Meet
                    ? 'primary.main'
                    : 'inherit',
                fontSize: '14px',
                py: 1,
              }}
            >
              Meet
            </MenuItem>
            <MenuItem
              disabled={true}
              sx={{
                color: isDarkMode ? 'grey.600' : 'grey.400',
                fontSize: '14px',
                py: 1,
              }}
            >
              Teams
            </MenuItem>
            <MenuItem
              disabled={true}
              sx={{
                color: isDarkMode ? 'grey.600' : 'grey.400',
                fontSize: '14px',
                py: 1,
              }}
            >
              Zoom
            </MenuItem>
          </Menu>
        </Stack>
      )}
    </Stack>
  )
}
