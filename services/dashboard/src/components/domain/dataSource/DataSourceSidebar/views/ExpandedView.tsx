import { Divider, Stack } from '@mui/material'
import { alpha } from '@mui/system'
import {
  DataSourceOrigin,
  DataSourcePaginator,
} from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DataSourceDetails } from '../../DataSourceDetails/DataSourceDetails'
import { MeetingDetails } from '../../MeetingDetails/MeetingDetails'
import { DataSourcesList } from '../components/DataSourcesList'
import { DataSourcesModal } from '../components/DataSourcesModal'
import { SectionHeader } from '../components/SectionHeader'
import { UploadDataSourceModal } from '../components/UploadDataSourceModal'
import { DataSourceSectionType, DeleteDataSourceModalContent } from '../hooks'

interface ExpandedViewProps {
  expanded: Record<DataSourceSectionType, boolean>
  handleDeleteDataSource: (content: DeleteDataSourceModalContent) => void
  isLoadingPresetDataSources: boolean
  isLoadingUserAddedDataSources: boolean
  organizationId: string
  presetDataSources?: DataSourcePaginator
  pulseId?: string
  toggleExpandSection: (section: DataSourceSectionType) => void
  userAddedDataSources?: DataSourcePaginator
}

export const ExpandedView = ({
  expanded,
  handleDeleteDataSource,
  isLoadingPresetDataSources,
  isLoadingUserAddedDataSources,
  organizationId,
  presetDataSources,
  pulseId,
  toggleExpandSection,
  userAddedDataSources,
}: ExpandedViewProps) => {
  const { t } = useTranslation('sources')
  const [selectedDataSource, setSelectedDataSource] = useState<{
    id: string
    origin: DataSourceOrigin
  } | null>(null)
  const [isShowAllModalOpen, setShowAllModalOpen] = useState(false)
  const [selectedOrigin, setSelectedOrigin] = useState<DataSourceOrigin | null>(
    null,
  )
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const handleOpenShowAllModal = (origin: DataSourceOrigin) => {
    setSelectedOrigin(origin)
    setShowAllModalOpen(true)
  }

  return (
    <Stack p={2} spacing={2}>
      <Stack
        borderBottom={1}
        borderColor={alpha(theme.palette.primary.main, 0.1)}
      />

      <Button onClick={() => setIsUploadModalOpen(true)} variant="contained">
        Upload
      </Button>

      <Stack flex={1} overflow="auto">
        <Stack divider={<Divider />} spacing={3}>
          {/* Preset DataSources */}
          {presetDataSources && presetDataSources?.data.length > 0 && (
            <Stack spacing={1}>
              <SectionHeader
                expanded={expanded.preset}
                onClick={() => toggleExpandSection('preset')}
                title={t('preset')}
              />
              {expanded.preset && (
                <DataSourcesList
                  dataSources={presetDataSources}
                  isLoading={isLoadingPresetDataSources}
                  onDeleteDataSource={handleDeleteDataSource}
                  onOpenUploadModal={() => setIsUploadModalOpen(true)}
                  onSelectDataSource={setSelectedDataSource}
                  onShowAll={() =>
                    handleOpenShowAllModal(DataSourceOrigin.Preset)
                  }
                  origin={DataSourceOrigin.Preset}
                />
              )}
            </Stack>
          )}

          {/* User Added DataSources */}
          <Stack spacing={1}>
            <SectionHeader
              expanded={expanded.user}
              onClick={() => toggleExpandSection('user')}
              title={'Recent'}
            />
            {expanded.user && (
              <DataSourcesList
                dataSources={userAddedDataSources}
                isLoading={isLoadingUserAddedDataSources}
                onDeleteDataSource={handleDeleteDataSource}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onSelectDataSource={setSelectedDataSource}
                onShowAll={() =>
                  handleOpenShowAllModal(DataSourceOrigin.Custom)
                }
                origin={DataSourceOrigin.Custom}
              />
            )}
          </Stack>
        </Stack>
      </Stack>
      {selectedOrigin && (
        <DataSourcesModal
          isOpen={isShowAllModalOpen}
          onClose={() => setShowAllModalOpen(false)}
          onDelete={handleDeleteDataSource}
          onSelectDataSource={setSelectedDataSource}
          origin={selectedOrigin}
        />
      )}
      {selectedDataSource && selectedDataSource.id ? (
        selectedDataSource.origin === DataSourceOrigin.Meeting ? (
          <MeetingDetails
            dataSourceId={selectedDataSource.id}
            isOpen={true}
            onClose={() => setSelectedDataSource(null)}
            onDelete={handleDeleteDataSource}
          />
        ) : (
          <DataSourceDetails
            dataSourceId={selectedDataSource.id}
            isOpen={true}
            onClose={() => setSelectedDataSource(null)}
            onDelete={handleDeleteDataSource}
            onToggleViewable={(_id: string, _is_viewable: boolean) => {
              // No-op: DataSourceDetails handles toggle internally
            }}
          />
        )
      ) : null}
      <UploadDataSourceModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        organizationId={organizationId}
        pulseId={pulseId}
      />
    </Stack>
  )
}
