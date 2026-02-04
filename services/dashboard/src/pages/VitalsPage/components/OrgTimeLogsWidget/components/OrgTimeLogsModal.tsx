import { useGetTimesheetsQuery } from '@zunou-queries/core/hooks/useGetTimesheetsQuery'
import { useMemo, useState } from 'react'

import { CustomModal } from '~/components/ui/CustomModal'

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

export const OrgTimeLogsModal = ({ isOpen, onClose }: TimeLogsModaProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.VIEW)
  const [activeTimesheetId, setActiveTimesheetId] = useState<string | null>(
    null,
  )

  const { data: timesheetsData, isLoading: isLoadingTimesheets } =
    useGetTimesheetsQuery({ coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL })
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
      title="Organization Logs"
    >
      {viewMode === ViewMode.EDIT && selectedTimesheet ? (
        <EditTimesheet onClose={resetViewMode} timesheet={selectedTimesheet} />
      ) : (
        <TimesheetList
          isLoading={isLoadingTimesheets}
          onEdit={handleEditTimeLog}
          timesheets={timesheets}
        />
      )}
    </CustomModal>
  )
}
