import { Stack } from '@mui/system'
import { DateRangeInput } from '@zunou-graphql/core/graphql'
import dayjs, { Dayjs } from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomDatePicker } from '~/components/ui/CustomDatePicker'

interface DateRange {
  from: Dayjs | null
  to: Dayjs | null
}

interface DateSelectorProps {
  onSelectRange: (dateRange: DateRangeInput) => void
  onClose: () => void
}

export const DateRangeSelector = ({
  onSelectRange,
  onClose,
}: DateSelectorProps) => {
  const { t } = useTranslation('tasks')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  })

  const handleChange = (key: 'from' | 'to', value: Dayjs | null) => {
    const updated = { ...dateRange, [key]: value }
    setDateRange(updated)

    if (updated.from && updated.to) {
      onSelectRange({
        from: dayjs(updated.from).format('YYYY-MM-DD'),
        to: dayjs(updated.to).format('YYYY-MM-DD'),
      })

      onClose()
    }
  }

  return (
    <Stack px={2} py={1.5} spacing={1.5} width={200}>
      <CustomDatePicker
        label={t('start_date')}
        onChange={(val) => handleChange('from', val)}
        value={dateRange.from}
      />
      <CustomDatePicker
        label={t('end_date')}
        onChange={(val) => handleChange('to', val)}
        value={dateRange.to}
      />
    </Stack>
  )
}
