import { CircularProgress, Stack, Typography } from '@mui/material'
import { DataSource, DataSourceOrigin } from '@zunou-graphql/core/graphql'
import { useDeleteDataSourceMutation } from '@zunou-queries/core/hooks/useDeleteDataSourceMutation'
import { useGetDataSourcesByOriginWithInfiniteQuery } from '@zunou-queries/core/hooks/useGetDataSourcesByOriginWithInfiniteQuery'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import _ from 'lodash'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { InView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'

import { DeleteDataSourceConfirmationModal } from '~/components/domain/dataSource/DataSourceSidebar/components/DeleteDataSourceConfirmationModal'
import { DeleteDataSourceModalContent } from '~/components/domain/dataSource/DataSourceSidebar/hooks'
import { SearchInput } from '~/components/ui/form/SearchInput'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

import EventDetailsModal from '../../EventDetailsModal'
import DataSourceItem from './DataSourceItem'

const DebouncedSearchInput = React.memo(
  ({ onDebouncedChange }: { onDebouncedChange: (value: string) => void }) => {
    const [inputValue, setInputValue] = useState('')

    const DEBOUNCED_TIME = 1000

    const debouncedChange = useRef(
      _.debounce((value: string) => {
        onDebouncedChange(value)
      }, DEBOUNCED_TIME),
    ).current

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setInputValue(value)
        debouncedChange(value)
      },
      [debouncedChange],
    )

    const handleClear = useCallback(() => {
      setInputValue('')
      debouncedChange.cancel()
      onDebouncedChange('')
    }, [debouncedChange, onDebouncedChange])

    return (
      <SearchInput
        autofocus={false}
        innerSx={{
          borderRadius: 2,
          p: 1.5,
          py: 2.5,
        }}
        onChange={handleChange}
        onClear={handleClear}
        placeholder="Search Meeting Name"
        value={inputValue}
      />
    )
  },
)

DebouncedSearchInput.displayName = 'DebouncedSearchInput'

export default function PastMeetings() {
  const { t } = useTranslation('sources')
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()
  const timezone = user?.timezone ?? 'UTC'

  const [query, setQuery] = useState('')
  const [selectedDataSource, setSelectedDataSource] =
    useState<DataSource | null>(null)
  const [isDeleteDataSourceModalOpen, setIsDeleteDataSourceModalOpen] =
    useState(false)
  const [deleteDataSourceContent, setDeleteDataSourceContent] =
    useState<DeleteDataSourceModalContent | null>(null)

  const {
    data: meetingDataSourcesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchDataSourceByOrigin,
  } = useGetDataSourcesByOriginWithInfiniteQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(pulseId),
    variables: {
      meetingName: query,
      organizationId,
      origin: DataSourceOrigin.Meeting,
      pulseId,
    },
  })

  const { mutate: deleteDataSource, isPending: isDeleteDataSourcePending } =
    useDeleteDataSourceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const meetingDataSources = useMemo(
    () =>
      meetingDataSourcesData?.pages
        ?.flatMap((page) => page.dataSourcesByOrigin.data)
        .flat() ?? [],
    [meetingDataSourcesData],
  )

  const groupedByDay = useMemo(() => {
    const groups: Record<string, typeof meetingDataSources> = {}

    meetingDataSources.forEach((src) => {
      const dayKey = dayjs(src.createdAt).format('MMM D')
      if (!groups[dayKey]) groups[dayKey] = []
      groups[dayKey].push(src)
    })

    // Sort each group by newest to oldest
    Object.values(groups).forEach((group) => {
      group.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      )
    })

    // Sort day keys by newest to oldest
    const sortedKeys = Object.keys(groups).sort(
      (a, b) =>
        dayjs(groups[b][0].createdAt).valueOf() -
        dayjs(groups[a][0].createdAt).valueOf(),
    )

    return sortedKeys.map((key) => ({
      day: key,
      meetings: groups[key],
      timezone,
    }))
  }, [meetingDataSources, timezone])

  const handleLoadMore = useCallback(
    (inView: boolean) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  const handleDebouncedQueryChange = useCallback((value: string) => {
    setQuery(value)
  }, [])

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

  const centerContent = (content: React.ReactNode) => (
    <Stack alignItems="center" height="100%" justifyContent="center">
      {content}
    </Stack>
  )

  usePusherChannel({
    channelName: `data-source.${organizationId}.pulse.${pulseId}`,
    eventName: '.data-source-created',
    onEvent: () => refetchDataSourceByOrigin(),
  })

  // Loading state
  if (isLoading) {
    return (
      <Stack gap={2} height="100%">
        <DebouncedSearchInput onDebouncedChange={handleDebouncedQueryChange} />
        {centerContent(<CircularProgress size={20} />)}
      </Stack>
    )
  }

  // Empty state
  if (meetingDataSources.length === 0) {
    return (
      <Stack gap={2} height="100%">
        <DebouncedSearchInput onDebouncedChange={handleDebouncedQueryChange} />
        {centerContent(
          <Stack gap={1}>
            <Typography
              color="text.secondary"
              fontWeight={500}
              textAlign="center"
              variant="body1"
            >
              {query
                ? 'No Past Meetings Match your Search'
                : 'No Past Meetings'}
            </Typography>
            <Typography
              color="text.secondary"
              textAlign="center"
              variant="body2"
            >
              {query
                ? 'Try searching with different keywords.'
                : 'Your past meetings will show up here once available.'}
            </Typography>
          </Stack>,
        )}
      </Stack>
    )
  }

  // Main content
  return (
    <Stack gap={2} height="100%" sx={{ overflow: 'hidden' }}>
      <DebouncedSearchInput onDebouncedChange={handleDebouncedQueryChange} />

      <Stack gap={2} sx={{ flex: 1, overflowY: 'auto' }}>
        {groupedByDay.map(({ day, meetings }) => (
          <Stack gap={1} key={day}>
            <Typography
              color="text.secondary"
              fontWeight={500}
              variant="caption"
            >
              {day}
            </Typography>
            <Stack spacing={1}>
              {meetings.map((src) => (
                <DataSourceItem
                  dataSource={src}
                  key={src.id}
                  onClick={setSelectedDataSource}
                />
              ))}
            </Stack>
          </Stack>
        ))}

        {hasNextPage && (
          <InView onChange={handleLoadMore} threshold={0.1} triggerOnce={false}>
            {({ ref }) => (
              <div
                ref={ref}
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  minHeight: 32,
                  paddingTop: 20,
                }}
              >
                {isFetchingNextPage && <CircularProgress size={20} />}
              </div>
            )}
          </InView>
        )}
      </Stack>

      <EventDetailsModal
        dataSourceId={selectedDataSource?.id ?? undefined}
        eventId={selectedDataSource?.meeting?.meetingSession?.event_id ?? null}
        isOpen={Boolean(selectedDataSource)}
        onClose={() => setSelectedDataSource(null)}
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
