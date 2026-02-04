import {
  ContentPasteOutlined,
  PeopleAltOutlined,
  PeopleOutlined,
} from '@mui/icons-material'
import { alpha, lighten } from '@mui/system'
import {
  DataSourceOrigin,
  DataSourcePaginator,
} from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { EmptyState } from '@zunou-react/components/layout/EmptyState'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import { DataSourceItem } from '~/components/domain/dataSource/DataSourceItem'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { DeleteDataSourceModalContent } from '../../hooks'

interface DataSourcesListProps {
  isLoading: boolean
  dataSources?: DataSourcePaginator
  onDeleteDataSource: (content: DeleteDataSourceModalContent) => void
  onSelectDataSource: (data: { id: string; origin: DataSourceOrigin }) => void
  onOpenUploadModal: () => void
  onShowAll: () => void
  origin?: DataSourceOrigin
}

export const DataSourcesList = ({
  isLoading,
  dataSources,
  onDeleteDataSource,
  onSelectDataSource,
  onOpenUploadModal,
  onShowAll,
  origin,
}: DataSourcesListProps) => {
  const { t } = useTranslation(['common', 'sources'])

  const hasData = dataSources && dataSources.data.length > 0
  const hasMorePages = dataSources?.paginatorInfo?.hasMorePages

  if (isLoading) return <LoadingSkeleton height={40} />

  return (
    <>
      {hasData ? (
        <>
          {dataSources.data.map((dataSource, index) => {
            const { id, origin, updatedAt, meeting } = dataSource

            return (
              <DataSourceItem
                dataSource={dataSource}
                key={`meeting-${index}`}
                onDelete={() =>
                  onDeleteDataSource({
                    id,
                    metadata:
                      origin === DataSourceOrigin.Custom
                        ? `Updated: ${formatDateAndTime(updatedAt)}`
                        : formatDateAndTime(meeting?.date ?? ''),
                    name: dataSource.name,
                  })
                }
                onSelect={() => onSelectDataSource({ id, origin })}
              />
            )
          })}

          {hasMorePages && (
            <Button
              onClick={onShowAll}
              size="small"
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.2),
                borderStyle: 'dashed',
                borderWidth: 1.5,
                color: alpha(theme.palette.primary.main, 0.8),
              }}
            >
              {t('show_all')}
            </Button>
          )}
        </>
      ) : (
        <EmptyState
          icon={
            origin === DataSourceOrigin.Meeting ? (
              <PeopleOutlined
                sx={{
                  color: lighten(theme.palette.text.primary, 0.5),
                }}
              />
            ) : origin === DataSourceOrigin.Custom ? (
              <ContentPasteOutlined
                sx={{
                  color: lighten(theme.palette.text.primary, 0.5),
                }}
              />
            ) : (
              <PeopleAltOutlined
                sx={{
                  color: lighten(theme.palette.text.primary, 0.5),
                }}
              />
            )
          }
          message={t('no_sources', { ns: 'sources' })}
          onClick={onOpenUploadModal}
        />
      )}
    </>
  )
}
