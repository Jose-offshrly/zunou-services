import { Divider, Menu, MenuItem, Typography } from '@mui/material'
import { DateRangeInput } from '@zunou-graphql/core/graphql'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ChipButton } from '~/components/ui/button/ChipButton'
import { DateRangeSelector } from '~/components/ui/date/DateRangeSelector'

import { DateSelector } from '../DateSelector'

interface DateFilterProps {
  isActive: boolean
  onClear: () => void
  onSelect: (date: Date) => void
  onSelectRange: (dateRange: DateRangeInput) => void
  selectedDate?: string | null
  selectedDateRange?: DateRangeInput | null
}

type DateFilterView = 'date' | 'date-range' | null

export const DateFilter = ({
  isActive,
  onClear,
  onSelect,
  onSelectRange,
  selectedDate,
  selectedDateRange,
}: DateFilterProps) => {
  const { t } = useTranslation(['common', 'tasks'])

  const [view, setView] = useState<DateFilterView>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClear = () => {
    onClear()
    handleClose()
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <ChipButton
        isActive={isActive}
        label={
          selectedDate
            ? selectedDate
            : selectedDateRange
              ? `${selectedDateRange.from} - ${selectedDateRange.to}`
              : t('date', { ns: 'tasks' })
        }
        onClick={handleClick}
        onDelete={isActive ? handleClear : undefined}
      />
      <Menu
        TransitionProps={{
          onExited: () => setView(null),
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'left',
          vertical: 'bottom',
        }}
        onClose={handleClose}
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
        {!view && [
          <MenuItem key="date" onClick={() => setView('date')}>
            <Typography fontSize="small">
              {t('date', { ns: 'tasks' })}
            </Typography>
          </MenuItem>,
          <MenuItem key="date-range" onClick={() => setView('date-range')}>
            <Typography fontSize="small">
              {t('date_range', { ns: 'tasks' })}
            </Typography>
          </MenuItem>,
          <Divider key="divider" />,
          <MenuItem
            key="clear"
            onClick={handleClear}
            sx={{ color: 'text.secondary' }}
          >
            <Typography fontSize="small">{t('clear')}</Typography>
          </MenuItem>,
        ]}

        {view === 'date' && (
          <DateSelector onClose={handleClose} onSelect={onSelect} />
        )}

        {view === 'date-range' && (
          <DateRangeSelector
            onClose={handleClose}
            onSelectRange={onSelectRange}
          />
        )}
      </Menu>
    </>
  )
}
