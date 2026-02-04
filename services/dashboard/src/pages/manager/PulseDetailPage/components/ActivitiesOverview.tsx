import {
  Circle,
  KeyboardArrowDownOutlined,
  TextSnippetOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'
import {
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { DataSourceOrigin } from '@zunou-graphql/core/graphql'
import { useDeleteDataSourceMutation } from '@zunou-queries/core/hooks/useDeleteDataSourceMutation'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import {
  DataSourceDetails,
  MeetingDetails,
} from '~/components/domain/dataSource'
import { DataSourcesModal } from '~/components/domain/dataSource/DataSourceSidebar/components/DataSourcesModal'
import { DeleteDataSourceConfirmationModal } from '~/components/domain/dataSource/DataSourceSidebar/components/DeleteDataSourceConfirmationModal'
import { DeleteDataSourceModalContent } from '~/components/domain/dataSource/DataSourceSidebar/hooks'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'

//  Removed temporarily until AI is integrated
// const Highlight = ({ children }: { children: React.ReactNode }) => (
//   <Box
//     component="span"
//     sx={{
//       '&:hover': {
//         cursor: 'pointer',
//         textDecoration: 'underline',
//       },
//       alignItems: 'center',
//       color: 'primary.main',
//       display: 'inline-flex',
//     }}
//   >
//     <Typography component="span" variant="body1">
//       {children}
//     </Typography>
//     <ArrowDropDownOutlined fontSize="small" />
//   </Box>
// )

const ActivitiesOverview = () => {
  const { pulseWelcomeState } = usePulseStore()
  const { t } = useTranslation('sources')
  const { pulseId } = useParams<{ pulseId: string }>()
  const [isShowAllModalOpen, setShowAllModalOpen] = useState(false)
  const [selectedOrigin, setSelectedOrigin] = useState<DataSourceOrigin | null>(
    null,
  )
  const { userRole } = useAuthContext()
  const [selectedDataSource, setSelectedDataSource] = useState<{
    id: string
    origin: DataSourceOrigin
  } | null>(null)

  const navigate = useNavigate()

  const rolePrefix = useMemo(() => userRole?.toLowerCase() ?? '', [userRole])

  const { organizationId } = useOrganization()

  const [meetingsAnchor, setMeetingsAnchor] = useState<null | HTMLElement>(null)
  const [tasksAnchor, setTasksAnchor] = useState<null | HTMLElement>(null)
  const [dataSourcesAnchor, setDataSourcesAnchor] =
    useState<null | HTMLElement>(null)
  const [isDeleteDataSourceModalOpen, setIsDeleteDataSourceModalOpen] =
    useState(false)
  const [deleteDataSourceContent, setDeleteDataSourceContent] =
    useState<DeleteDataSourceModalContent | null>(null)

  const welcomeData = useMemo(() => {
    return pulseWelcomeState.find((pulse) => pulse.pulseId === pulseId)
  }, [pulseWelcomeState])

  const meetings = welcomeData?.initialData?.meetings ?? []
  const dataSources = welcomeData?.initialData?.dataSources ?? []
  const tasks = welcomeData?.initialData?.tasks ?? []

  const redirectToTaskTab = () => {
    if (!organizationId || !pulseId) {
      toast.error('Missing organization or pulse id.')
      return
    }

    navigate(
      `/${rolePrefix}/${pathFor({
        pathname: Routes.PulseTasks,
        query: { organizationId, pulseId },
      })}`,
    )
  }

  const handleOpenShowAllModal = (origin: DataSourceOrigin) => {
    setSelectedOrigin(origin)
    setShowAllModalOpen(true)
  }

  const handleMenuAction = (
    action: string,
    activity: string,
    id: string | null = null,
  ) => {
    if (action === 'openSelected' && activity === 'meetings' && id)
      setSelectedDataSource({ id, origin: DataSourceOrigin.Meeting })
    else if (action === 'openAll' && activity === 'meetings')
      handleOpenShowAllModal(DataSourceOrigin.Meeting)
    else if (action === 'openSelected' && activity === 'dataSources' && id)
      setSelectedDataSource({ id, origin: DataSourceOrigin.Custom })
    else if (action === 'openAll' && activity === 'dataSources')
      handleOpenShowAllModal(DataSourceOrigin.Custom)
    else if (action === 'openAll' && activity === 'tasks') redirectToTaskTab()

    // Close all menus
    setMeetingsAnchor(null)
    setTasksAnchor(null)
    setDataSourcesAnchor(null)
  }

  const handleCloseMenu = () => {
    setMeetingsAnchor(null)
    setTasksAnchor(null)
    setDataSourcesAnchor(null)
  }

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
    <>
      <Stack gap={2}>
        <Typography fontWeight="600" variant="body2">
          ACTIVITIES SINCE YOU LAST VISITED
        </Typography>

        <Stack
          alignItems="center"
          color="text.secondary"
          direction="row"
          divider={
            <Circle
              sx={{
                color: 'divider',
                fontSize: 8,
              }}
            />
          }
          gap={2}
        >
          {/* Meetings */}
          <Button
            disabled={meetings.length <= 0}
            endIcon={
              <KeyboardArrowDownOutlined
                fontSize="small"
                sx={{
                  transform: meetingsAnchor ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            }
            onClick={(e) => setMeetingsAnchor(e.currentTarget)}
            sx={{
              color: 'text.secondary',
            }}
            variant="text"
          >
            {`${meetings.length || '0'} Meetings`}
          </Button>

          {/* Tasks */}
          <Button
            disabled={tasks.length <= 0}
            endIcon={
              <KeyboardArrowDownOutlined
                fontSize="small"
                sx={{
                  transform: tasksAnchor ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            }
            onClick={(e) => setTasksAnchor(e.currentTarget)}
            sx={{
              color: 'text.secondary',
            }}
            variant="text"
          >
            {`${tasks.length || '0'} Tasks`}
          </Button>

          {/* Data Sources */}
          <Button
            disabled={dataSources.length <= 0}
            endIcon={
              <KeyboardArrowDownOutlined
                fontSize="small"
                sx={{
                  transform: dataSourcesAnchor
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            }
            onClick={(e) => setDataSourcesAnchor(e.currentTarget)}
            sx={{
              color: 'text.secondary',
            }}
            variant="text"
          >
            {`${dataSources.length || '0'} Data Source`}
          </Button>
        </Stack>

        {/* Meetings Menu */}
        <Menu
          anchorEl={meetingsAnchor}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
          onClose={handleCloseMenu}
          open={Boolean(meetingsAnchor)}
          transformOrigin={{
            horizontal: 'left',
            vertical: 'top',
          }}
        >
          {meetings.map((meeting) => (
            <MenuItem
              disabled={!meeting.dataSourceId}
              key={meeting.id}
              onClick={() =>
                handleMenuAction(
                  'openSelected',
                  'meetings',
                  meeting?.dataSourceId ?? null,
                )
              }
            >
              <ListItemIcon>
                <TextSnippetOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>{meeting.title}</ListItemText>
            </MenuItem>
          ))}

          <Divider />

          <MenuItem onClick={() => handleMenuAction('openAll', 'meetings')}>
            <ListItemIcon>
              <VisibilityOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open All in Sources Modal</ListItemText>
          </MenuItem>
        </Menu>

        {/* Tasks Menu */}
        <Menu
          anchorEl={tasksAnchor}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
          onClose={handleCloseMenu}
          open={Boolean(tasksAnchor)}
          transformOrigin={{
            horizontal: 'left',
            vertical: 'top',
          }}
        >
          <MenuItem onClick={() => handleMenuAction('openAll', 'tasks')}>
            <ListItemIcon>
              <VisibilityOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>View in Task Tab</ListItemText>
          </MenuItem>
        </Menu>

        {/* Data Sources Menu */}
        <Menu
          anchorEl={dataSourcesAnchor}
          anchorOrigin={{
            horizontal: 'left',
            vertical: 'bottom',
          }}
          onClose={handleCloseMenu}
          open={Boolean(dataSourcesAnchor)}
          transformOrigin={{
            horizontal: 'left',
            vertical: 'top',
          }}
        >
          {dataSources.map((dataSource) => (
            <MenuItem
              disabled={!dataSource.id}
              key={dataSource.id}
              onClick={() =>
                handleMenuAction(
                  'openSelected',
                  'dataSources',
                  dataSource?.id ?? null,
                )
              }
            >
              <ListItemIcon>
                <TextSnippetOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>{dataSource.name}</ListItemText>
            </MenuItem>
          ))}

          <Divider />

          <MenuItem onClick={() => handleMenuAction('openAll', 'dataSources')}>
            <ListItemIcon>
              <VisibilityOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText>Open All in Sources Modal</ListItemText>
          </MenuItem>
        </Menu>

        {/* Removed temporarily until AI is integrated */}
        {/* Summary */}
        {/* <Stack>
          <Typography variant="body1">
            Since your last visit, I summarized your latest{' '}
            <Highlight>sprint planning meeting</Highlight>, surfaced{' '}
            <Highlight>two follow-up tasks</Highlight> to tackle today, and
            flagged #teamchat for your review. Alex had a question about API
            versioning &mdash; you can <Highlight>reply to Alex</Highlight> or
            loop me in.
          </Typography>
        </Stack> */}
      </Stack>
      <DeleteDataSourceConfirmationModal
        isOpen={isDeleteDataSourceModalOpen}
        isSubmitting={isDeleteDataSourcePending}
        metadata={deleteDataSourceContent?.metadata ?? '-'}
        name={deleteDataSourceContent?.name ?? 'Unknown'}
        onClose={() => setIsDeleteDataSourceModalOpen(false)}
        onSubmit={handleConfirmedDeleteDataSource}
      />

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
            onToggleViewable={() => null}
          />
        )
      ) : null}
    </>
  )
}

export default ActivitiesOverview
