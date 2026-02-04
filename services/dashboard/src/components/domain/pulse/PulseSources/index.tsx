import {
  DescriptionOutlined,
  FolderOpenOutlined,
  GroupsOutlined,
} from '@mui/icons-material'
import { Divider, Typography } from '@mui/material'
import { alpha, lighten, Stack } from '@mui/system'
import { DataSourceOrigin, PulseMemberRole } from '@zunou-graphql/core/graphql'
import { useDeleteDataSourceMutation } from '@zunou-queries/core/hooks/useDeleteDataSourceMutation'
import { useGetDataSourcesQuery } from '@zunou-queries/core/hooks/useGetDataSourcesQuery'
import { EmptyState } from '@zunou-react/components/layout/EmptyState'
import { theme } from '@zunou-react/services/Theme'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import {
  DataSourceDetails,
  DataSourceItem,
} from '~/components/domain/dataSource'
import { SectionHeader } from '~/components/domain/dataSource/DataSourceSidebar/components/SectionHeader'
import { SidebarItem } from '~/components/layouts/MainLayout/components/SidebarItem'
import { SidebarItemIcon } from '~/components/layouts/MainLayout/components/SidebarItemIcon'
import { IconActionButton } from '~/components/ui/button/IconActionButton'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'
import { formatDateAndTime } from '~/utils/formatDateAndTime'

import { MeetingSessionsList } from '../../dataSource/DataSourceSidebar/components/MeetingSessionsList'
import { DeleteDataSourceModalContent } from '../../dataSource/DataSourceSidebar/hooks'

const SIDEBAR_VIEW_STATE_KEY = 'pulse-sources-view-state'

export const PulseSources = () => {
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const [selectedDataSourceId, setSelectedDataSourceId] = useState<
    string | null
  >(null)

  const [expanded, setExpanded] = useState<{
    sources: boolean
    collab: boolean
  }>({
    collab: true,
    sources: true,
  })

  const [isCollapsed, setIsCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_VIEW_STATE_KEY) !== null
      ? localStorage.getItem(SIDEBAR_VIEW_STATE_KEY) === 'false'
      : false,
  )

  const toggleExpandSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleToggleView = (section?: keyof typeof expanded) => {
    if (section) toggleExpandSection(section)

    setIsCollapsed(!isCollapsed)
    localStorage.setItem(SIDEBAR_VIEW_STATE_KEY, isCollapsed.toString())
  }

  const { data: pulseSourcesData, isFetching: isFetchingDatasources } =
    useGetDataSourcesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
        pulseId,
      },
    })
  const { pulseMembership } = usePulseStore()
  const userAddedSources = pulseSourcesData?.dataSources.data.filter(
    (datasource) =>
      datasource.origin === DataSourceOrigin.Custom &&
      (pulseMembership?.role === PulseMemberRole.Owner ||
        pulseMembership?.role === PulseMemberRole.Admin ||
        datasource.is_viewable),
  )

  const { mutate: deleteDataSource } = useDeleteDataSourceMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const handleDeleteDataSource = (content: DeleteDataSourceModalContent) => {
    try {
      deleteDataSource(
        {
          id: content.id,
          organizationId,
        },
        {
          onError: () => {
            toast.error('Failed to delete data source')
          },
          onSuccess: () => {
            toast.success('Data source deleted successfully')
          },
        },
      )
    } catch {
      toast.error('An unexpected error occurred while deleting')
    }
  }

  return (
    <>
      <Stack
        bgcolor="common.white"
        borderRight={1}
        flexShrink={0}
        sx={{
          borderColor: alpha(theme.palette.primary.main, 0.1),
        }}
        width={!isCollapsed ? 296 : 80}
      >
        <Stack
          alignItems="center"
          borderBottom={1}
          borderColor={alpha(theme.palette.primary.main, 0.1)}
          direction="row"
          p={3}
          spacing={1}
        >
          <IconActionButton
            onClick={() => handleToggleView()}
            size="small"
            variant="outlined"
          >
            <DescriptionOutlined fontSize="small" />
          </IconActionButton>
          {!isCollapsed && (
            <Typography
              color="text.primary"
              fontWeight="fontWeightBold"
              variant="h6"
            >
              Sources
            </Typography>
          )}
        </Stack>
        <Stack p={3}>
          {!isCollapsed ? (
            <Stack divider={<Divider />} gap={1}>
              <Stack gap={1} py={1}>
                <SectionHeader
                  expanded={expanded.sources}
                  onClick={() => toggleExpandSection('sources')}
                  title="Files"
                />

                {expanded.sources &&
                  (isFetchingDatasources ? (
                    <LoadingSkeleton height={80} />
                  ) : userAddedSources && userAddedSources.length > 0 ? (
                    userAddedSources.map((dataSource) => {
                      const { id, name, updatedAt, meeting, origin } =
                        dataSource

                      return (
                        <DataSourceItem
                          dataSource={dataSource}
                          key={id}
                          onDelete={() =>
                            handleDeleteDataSource({
                              id,
                              metadata:
                                origin === DataSourceOrigin.Custom
                                  ? `Updated: ${formatDateAndTime(updatedAt)}`
                                  : formatDateAndTime(meeting?.date ?? ''),
                              name,
                            })
                          }
                          onSelect={() => setSelectedDataSourceId(id)}
                        />
                      )
                    })
                  ) : (
                    <EmptyState
                      hasNoAccess={true}
                      icon={
                        <FolderOpenOutlined
                          sx={{
                            color: lighten(theme.palette.text.primary, 0.5),
                          }}
                        />
                      }
                      message="No user added sources yet"
                    />
                  ))}
              </Stack>

              <Stack gap={1} py={1}>
                <SectionHeader
                  expanded={expanded.collab}
                  onClick={() => toggleExpandSection('collab')}
                  title="Meetings"
                />

                {expanded.collab && <MeetingSessionsList />}
              </Stack>
            </Stack>
          ) : (
            <Stack divider={<Divider />} gap={1}>
              <SidebarItem onClick={() => handleToggleView('sources')}>
                <SidebarItemIcon>
                  <FolderOpenOutlined fontSize="small" />
                </SidebarItemIcon>
              </SidebarItem>

              <SidebarItem onClick={() => handleToggleView('collab')}>
                <SidebarItemIcon>
                  <GroupsOutlined fontSize="small" />
                </SidebarItemIcon>
              </SidebarItem>
            </Stack>
          )}
        </Stack>
      </Stack>
      {selectedDataSourceId && (
        <DataSourceDetails
          dataSourceId={selectedDataSourceId}
          isOpen={!!selectedDataSourceId}
          onClose={() => setSelectedDataSourceId(null)}
          onDelete={handleDeleteDataSource}
          onToggleViewable={() => null}
        />
      )}
    </>
  )
}
