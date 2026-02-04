import { useGetTimesheetsQuery } from '@zunou-queries/core/hooks/useGetTimesheetsQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomModal } from '~/components/ui/CustomModal'
import { getWeekRange } from '~/utils/dateUtils'

import { EditTimesheet } from './EditTimesheet'
import { TimesheetList } from './TimesheetList'

interface TimeLogsModaProps {
  isOpen: boolean
  onClose: () => void
}

export enum ViewMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

export const TimeLogsModal = ({ isOpen, onClose }: TimeLogsModaProps) => {
  const { t } = useTranslation('vitals')
  const { user } = useAuthContext()

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VIEW)
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs())
  const [activeTimesheetId, setActiveTimesheetId] = useState<string | null>(
    null,
  )
  const { endDate, startDate } = getWeekRange(selectedDate)

  const { data: timesheetsData, isLoading: isLoadingTimesheets } =
    useGetTimesheetsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        dateRange: { from: startDate, to: endDate },
        userId: user?.id,
      },
    })
  const timesheets = timesheetsData?.timesheets ?? []

  const selectedTimesheet = useMemo(() => {
    return timesheets.find(({ id }) => id === activeTimesheetId)
  }, [timesheets, activeTimesheetId])

  const handleEditTimeLog = (id: string) => {
    setViewMode(ViewMode.EDIT)
    setActiveTimesheetId(id)
  }
  const resetViewMode = () => {
    setViewMode(ViewMode.VIEW)
    setActiveTimesheetId(null)
  }

  const handleCloseModal = () => {
    onClose()
    resetViewMode()
  }

  return (
    <CustomModal
      isOpen={isOpen}
      maxWidth={viewMode === ViewMode.EDIT ? 240 : undefined}
      onClose={handleCloseModal}
      title={t('logs')}
    >
      {viewMode === ViewMode.EDIT && selectedTimesheet ? (
        <EditTimesheet onClose={resetViewMode} timesheet={selectedTimesheet} />
      ) : (
        <TimesheetList
          isLoading={isLoadingTimesheets}
          onDateFilterChange={setSelectedDate}
          onEdit={handleEditTimeLog}
          selectedDate={selectedDate}
          timesheets={timesheets}
        />
      )}
    </CustomModal>
  )
}
