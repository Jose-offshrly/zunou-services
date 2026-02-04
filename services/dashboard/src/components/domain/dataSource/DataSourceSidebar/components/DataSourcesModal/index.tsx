import { Cancel, DeleteOutline } from '@mui/icons-material'
import {
  alpha,
  Divider,
  IconButton,
  Pagination,
  Stack,
  Typography,
} from '@mui/material'
import {
  DataSource,
  DataSourceOrigin,
  DataSourceStatus,
} from '@zunou-graphql/core/graphql'
import { useGetDataSourcesByOriginQuery } from '@zunou-queries/core/hooks/useGetDataSourcesByOriginQuery'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { CustomModal } from '~/components/ui/CustomModal'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useAccessControl } from '~/hooks/useAccessControl'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { PulsePermissionEnum } from '~/types/permissions'
import { formatDateAndTime } from '~/utils/formatDateAndTime'
import { isToday } from '~/utils/isToday'
import { truncate } from '~/utils/textUtils'
import { toTitleCase } from '~/utils/toTitleCase'

import { DeleteDataSourceModalContent } from '../../hooks'

interface DataSourcesModal {
  isOpen: boolean
  onClose: () => void
  origin: DataSourceOrigin | null
  onDelete: (content: DeleteDataSourceModalContent) => void
  onSelectDataSource: (data: { id: string; origin: DataSourceOrigin }) => void
}

interface DataSourceContent {
  metadata: string
}

export const DataSourcesModal = ({
  isOpen,
  onClose,
  onSelectDataSource,
  onDelete,
  origin,
}: DataSourcesModal) => {
  const { t } = useTranslation('sources')
  const { pulseId } = useParams()
  const { checkAccess } = useAccessControl()
  const { organizationId } = useOrganization()
  const { permissions: pulsePermissions } = usePulseStore()

  const [currentPage, setCurrentPage] = useState(0)

  const { grant: hasDeleteAccess } = checkAccess(
    [PulsePermissionEnum.DELETE_DATA_SOURCE],
    pulsePermissions,
  )

  const { data: dataSourcesData, isLoading } = useGetDataSourcesByOriginQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      origin,
      page: currentPage,
      pulseId,
    },
  })
  const dataSources = dataSourcesData?.dataSourcesByOrigin

  const handleSelectDataSource = ({
    id,
    origin,
  }: {
    id: string
    origin: DataSourceOrigin
  }) => {
    onClose()
    onSelectDataSource({ id, origin })
  }

  return (
    <CustomModal
      isOpen={isOpen}
      maxWidth={720}
      onClose={onClose}
      title={
        origin === DataSourceOrigin.Custom
          ? t('user_added_sources')
          : origin
            ? `${toTitleCase(origin)} Sources`
            : t('sources')
      }
    >
      {isLoading ? (
        <Stack spacing={1}>
          <LoadingSkeleton height={72} />
          <LoadingSkeleton height={72} />
          <LoadingSkeleton height={72} />
          <LoadingSkeleton height={72} />
        </Stack>
      ) : (
        <Stack spacing={1}>
          {dataSources &&
            dataSources.data.map((dataSource, index) => {
              const isPermanentlyFailed = (dataSource: DataSource): boolean => {
                return (
                  dataSource.status === DataSourceStatus.Failed &&
                  new Date().getTime() -
                    new Date(dataSource.updatedAt).getTime() >=
                    2 * 60 * 1000
                )
              }

              const getDataSourceContent = (
                dataSource: DataSource,
              ): DataSourceContent => {
                if (isPermanentlyFailed(dataSource)) {
                  return {
                    metadata: 'Error in Uploading',
                  }
                }

                switch (dataSource.origin) {
                  case DataSourceOrigin.Meeting:
                    return {
                      metadata: formatDateAndTime(
                        dataSource.meeting?.date || '',
                      ),
                    }
                  case DataSourceOrigin.Preset:
                  case DataSourceOrigin.Custom:
                  default:
                    return {
                      metadata: `Updated: ${formatDateAndTime(dataSource.updatedAt)}`,
                    }
                }
              }

              const isFailed = isPermanentlyFailed(dataSource)
              const content = getDataSourceContent(dataSource)

              return (
                <Stack
                  border={1}
                  borderColor="divider"
                  borderRadius={1}
                  divider={<Divider />}
                  key={index}
                  onClick={() =>
                    handleSelectDataSource({
                      id: dataSource.id,
                      origin: dataSource.origin,
                    })
                  }
                  paddingX={2}
                  paddingY={1}
                  spacing={1}
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    borderRadius: 2,
                    cursor: 'pointer',
                    padding: 1.5,
                    position: 'relative',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                  >
                    {isToday(dataSource.createdAt) && (
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
                      <Stack>
                        <Typography sx={{ color: 'text.primary' }}>
                          {truncate(dataSource.name, 20)}
                        </Typography>
                        <Typography
                          sx={{ color: 'text.secondary' }}
                          variant="caption"
                        >
                          {content.metadata}
                        </Typography>
                      </Stack>
                    </Stack>
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      hasDeleteAccess && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete({
                              id: dataSource.id,
                              metadata:
                                origin === DataSourceOrigin.Custom
                                  ? `Updated: ${formatDateAndTime(dataSource.updatedAt)}`
                                  : formatDateAndTime(
                                      dataSource.meeting?.date ?? '',
                                    ),
                              name: dataSource.name,
                            })
                          }}
                          size="small"
                        >
                          {isFailed ? (
                            <Cancel
                              fontSize="small"
                              sx={{ color: 'secondary.main' }}
                            />
                          ) : (
                            <DeleteOutline fontSize="small" />
                          )}
                        </IconButton>
                      )
                    )}
                  </Stack>
                  <Typography
                    dangerouslySetInnerHTML={{
                      __html: dataSource.description || '',
                    }}
                    sx={{
                      color: 'text.primary',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                    variant="caption"
                  />
                </Stack>
              )
            })}

          <Stack alignItems="center">
            <Pagination
              count={dataSources?.paginatorInfo.lastPage}
              onChange={(_, value) => setCurrentPage(value)}
              page={dataSources?.paginatorInfo.currentPage}
              shape="rounded"
            />
          </Stack>
        </Stack>
      )}
    </CustomModal>
  )
}
