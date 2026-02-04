import { Cancel, DeleteOutline } from '@mui/icons-material'
import { alpha, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import {
  DataSource,
  DataSourceOrigin,
  DataSourceStatus,
} from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useAccessControl } from '~/hooks/useAccessControl'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { usePulseStore } from '~/store/usePulseStore'
import { PulsePermissionEnum } from '~/types/permissions'
import { formatDateAndTime } from '~/utils/formatDateAndTime'
import { isToday } from '~/utils/isToday'

interface DataSourceContent {
  metadata: string
}

const isPermanentlyFailed = (dataSource: DataSource): boolean => {
  return (
    dataSource.status === DataSourceStatus.Failed &&
    new Date().getTime() - new Date(dataSource.updatedAt).getTime() >=
      2 * 60 * 1000
  )
}

const getDataSourceContent = (dataSource: DataSource): DataSourceContent => {
  // Show error only for permanently failed data sources (failed for more than 2 minutes)
  if (isPermanentlyFailed(dataSource)) {
    return {
      metadata: 'Error in Uploading',
    }
  }

  switch (dataSource.origin) {
    case DataSourceOrigin.Meeting:
      return {
        metadata: formatDateAndTime(dataSource.meeting?.date || ''),
      }
    case DataSourceOrigin.Preset:
    case DataSourceOrigin.Custom:
    default:
      if (dataSource.updatedAt)
        return {
          metadata: `Updated: ${formatDateAndTime(dataSource.updatedAt)}`,
        }
      else
        return {
          metadata: '',
        }
  }
}

interface DataSourceItemProps {
  dataSource: DataSource
  onDelete: () => void
  onSelect: () => void
}

export const DataSourceItem = ({
  dataSource,
  onDelete,
  onSelect,
}: DataSourceItemProps) => {
  if (dataSource.status === DataSourceStatus.Deleted) {
    return null
  }
  const { permissions: pulsePermissions } = usePulseStore()
  const { checkAccess } = useAccessControl()
  const { user } = useAuthContext()
  const timezone = user?.timezone ?? 'UTC'
  const { grant: hasDeleteAccess } = checkAccess(
    [PulsePermissionEnum.DELETE_DATA_SOURCE],
    pulsePermissions,
  )
  const content = getDataSourceContent(dataSource)
  const queryClient = useQueryClient()
  const dataSourceId = dataSource.id

  const [showDeleteWhenIndexing, setShowDeleteWhenIndexing] = useState(false)
  const [companionFailure, setCompanionFailure] = useState(false)

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onDelete()
  }

  const truncate = (text: string, maxLength: number): string => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const isLoading = dataSource.status === DataSourceStatus.Indexing

  // Treat as permanently failed only if it's been failed for more than 2 minutes
  const isFailed = isPermanentlyFailed(dataSource)

  const handleDataSourceStatusUpdated = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['dataSources'],
    })
  }, [queryClient])

  usePusherChannel({
    channelName: dataSourceId && `data-source.${dataSourceId}`,
    eventName: '.data-source-status-updated',
    onEvent: handleDataSourceStatusUpdated,
  })

  const handleDataSourceIndexed = useCallback(
    (data: { userId: string }) => {
      if (data.userId === user?.id) {
        toast.success(`${dataSource.name} has been successfully created!`)
      }
    },
    [user?.id, dataSource.name],
  )

  usePusherChannel<{ userId: string }>({
    channelName: `data-source.${dataSourceId}`,
    eventName: '.data-source-indexed',
    onEvent: handleDataSourceIndexed,
  })

  const handleCompanionStatusUpdated = useCallback(
    (payload: { data: { status: string }; userId: string }) => {
      if (payload.data.status === 'recorder_unavailable') {
        if (
          payload.userId === user?.id &&
          dataSource.status === DataSourceStatus.Indexing
        ) {
          toast.error(`Failed to create ${dataSource.name}`)
        }
        setCompanionFailure(true)
      }
    },
    [user?.id, dataSource.status, dataSource.name],
  )

  usePusherChannel<{ data: { status: string }; userId: string }>({
    channelName: `companion-data-source-status.${dataSourceId}`,
    eventName: '.companion-status-updated',
    onEvent: handleCompanionStatusUpdated,
  })

  const handleDataSourceFailed = useCallback(
    (data: { userId: string }) => {
      if (
        data.userId === user?.id &&
        dataSource.status === DataSourceStatus.Indexing
      ) {
        toast.error(`Failed to create ${dataSource.name}`)
      }
    },
    [user?.id, dataSource.status, dataSource.name],
  )

  usePusherChannel<{ userId: string }>({
    channelName: `data-source.${dataSourceId}`,
    eventName: '.data-source-failed',
    onEvent: handleDataSourceFailed,
  })

  useEffect(() => {
    if (dataSource.status !== DataSourceStatus.Indexing) {
      setShowDeleteWhenIndexing(false)
      return
    }

    const interval = setInterval(() => {
      const updatedAt = dayjs.tz(dataSource.updatedAt, timezone)
      const now = dayjs().tz(timezone)
      const hasPassed = now.diff(updatedAt, 'minutes') >= 10

      setShowDeleteWhenIndexing(hasPassed)
    }, 1000)

    return () => clearInterval(interval)
  }, [dataSource.status, dataSource.updatedAt, timezone])

  const showDelete = isLoading && (showDeleteWhenIndexing || companionFailure)

  return (
    <Tooltip disableInteractive={true} placement="top" title={dataSource.name}>
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        onClick={isLoading || isFailed ? undefined : onSelect}
        sx={{
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          },
          bgcolor: isFailed
            ? alpha(theme.palette.text.secondary, 0.05)
            : 'transparent',
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.1),
          borderRadius: 2,
          opacity: isLoading ? 0.7 : 1,
          padding: 1.5,
          position: 'relative',
          transition: 'background-color 0.2s',
        }}
      >
        {isToday(dataSource.createdAt) && !isFailed && (
          <Stack
            sx={{
              bgcolor: 'secondary.main',
              borderRadius: '50%',
              height: 8,
              position: 'absolute',
              right: 8,
              top: 8,
              width: 8,
            }}
          />
        )}
        <Stack>
          <Typography
            fontSize={14}
            fontWeight="500"
            sx={{ color: (theme) => theme.palette.text.primary }}
          >
            {truncate(dataSource.name, 20)}
          </Typography>

          {showDelete ? (
            <Stack>
              <Typography
                fontSize={12}
                sx={{ color: (theme) => theme.palette.text.secondary }}
              >
                Taking a while -{' '}
                <Typography
                  color={'error.main'}
                  component={'span'}
                  fontSize={12}
                  onClick={handleDelete}
                  sx={{
                    '&:hover': {
                      cursor: 'pointer',
                    },
                  }}
                >
                  Cancel
                </Typography>{' '}
              </Typography>
            </Stack>
          ) : (
            <Typography
              fontSize={12}
              sx={{ color: (theme) => theme.palette.text.secondary }}
            >
              {content.metadata}
            </Typography>
          )}
        </Stack>
        {isLoading ? (
          <LoadingSpinner size={14} />
        ) : (
          hasDeleteAccess && (
            <IconButton onClick={handleDelete} size="small">
              {isFailed ? (
                <Cancel fontSize="small" sx={{ color: 'secondary.main' }} />
              ) : (
                <DeleteOutline fontSize="small" />
              )}
            </IconButton>
          )
        )}
      </Stack>
    </Tooltip>
  )
}
