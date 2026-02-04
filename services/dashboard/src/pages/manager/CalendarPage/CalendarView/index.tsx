import { Stack } from '@mui/material'
import { Event } from '@zunou-graphql/core/graphql'
import { useDeleteDataSourceMutation } from '@zunou-queries/core/hooks/useDeleteDataSourceMutation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { DeleteDataSourceConfirmationModal } from '~/components/domain/dataSource/DataSourceSidebar/components/DeleteDataSourceConfirmationModal'
import { DeleteDataSourceModalContent } from '~/components/domain/dataSource/DataSourceSidebar/hooks'
import EventDetailsModal from '~/components/domain/pulse/EventDetailsModal'

import { CalendarPeriod, SelectedDay, SelectedWeek } from '..'
import Day from './Day'
import Month from './Month'
import Week from './Week'

export default function CalendarView({
  calendarPeriod,
  selectedDay,
  selectedWeek,
  selectedMonth,
  selectedYear,
  setSelectedDay,
}: {
  calendarPeriod: CalendarPeriod
  selectedDay: SelectedDay
  selectedWeek: SelectedWeek
  selectedMonth: number
  selectedYear: number
  setSelectedDay: (day: SelectedDay) => void
}) {
  const { t } = useTranslation('sources')
  const { organizationId } = useParams()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [deleteDataSourceContent, setDeleteDataSourceContent] =
    useState<DeleteDataSourceModalContent | null>(null)
  const [isDeleteDataSourceModalOpen, setIsDeleteDataSourceModalOpen] =
    useState(false)

  const { mutate: deleteDataSource, isPending: isDeleteDataSourcePending } =
    useDeleteDataSourceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleDeleteDataSource = ({
    id,
    name,
    metadata,
  }: DeleteDataSourceModalContent) => {
    setDeleteDataSourceContent({ id, metadata, name })
    setIsDeleteDataSourceModalOpen(true)
  }

  const handleConfirmedDeleteDataSource = () => {
    try {
      if (!deleteDataSourceContent?.id) {
        toast.error('Data Source ID is missing.')
        return
      }

      if (!organizationId) {
        toast.error('Organization ID is missing.')
        return
      }

      deleteDataSource(
        {
          id: deleteDataSourceContent.id,
          organizationId,
        },
        {
          onError: () => {
            toast.error(t('delete_source_error'))
          },
          onSuccess: () => {
            setDeleteDataSourceContent(null)
            setIsDeleteDataSourceModalOpen(false)
            toast.success(t('delete_source_success'))
          },
        },
      )
    } catch {
      toast.error('An unexpected error occurred while deleting')
    }
  }

  return (
    <Stack flex={1} overflow="hidden" spacing={2} width="100%">
      {calendarPeriod === 'day' && (
        <Day
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          setSelectedEvent={setSelectedEvent}
        />
      )}

      {calendarPeriod === 'week' && (
        <Week selectedWeek={selectedWeek} setSelectedEvent={setSelectedEvent} />
      )}

      {calendarPeriod === 'month' && (
        <Month
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          setSelectedEvent={setSelectedEvent}
        />
      )}

      {/* Upcoming / Live Meetings */}
      <EventDetailsModal
        dataSourceId={
          selectedEvent?.meetingSession?.dataSource?.id ?? undefined
        }
        eventId={selectedEvent?.id ?? null}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        onDelete={handleDeleteDataSource}
      />

      <DeleteDataSourceConfirmationModal
        isOpen={isDeleteDataSourceModalOpen}
        isSubmitting={isDeleteDataSourcePending}
        metadata={deleteDataSourceContent?.metadata ?? '-'}
        name={deleteDataSourceContent?.name ?? 'Unknown'}
        onClose={() => setIsDeleteDataSourceModalOpen(false)}
        onSubmit={handleConfirmedDeleteDataSource}
      />
    </Stack>
  )
}
