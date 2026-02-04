import { Close } from '@mui/icons-material'
import { Drawer, IconButton, Stack, Typography } from '@mui/material'

import { DataSourceSetup } from '~/components/domain/dataSource'
import { InvitePulseToMeetingModal } from '~/components/domain/dataSource/InvitePulseToMeetingModal'

import { DeleteDataSourceConfirmationModal } from './components/DeleteDataSourceConfirmationModal'
import { useHooks } from './hooks'
import { ExpandedView } from './views'

interface DataSourceSidebarProps {
  onClose: () => void
  open: boolean
}

export const DataSourceSidebar = ({
  onClose,
  open,
}: DataSourceSidebarProps) => {
  const {
    expanded,
    handleCloseDataSourceSetup,
    handleDeleteDataSource,
    handleConfirmedDeleteDataSource,
    initialTab,
    isDataSourceSetupOpen,
    isInvitePulseToMeetingOpen,
    isLoadingPresetDataSources,
    isLoadingUserAddedDataSources,
    organizationId,
    presetDataSources,
    pulseId,
    setIsInvitePulseToMeetingOpen,
    isDeleteDataSourcePending,
    toggleExpandSection,
    userAddedDataSources,
    isDeleteDataSourceModalOpen,
    setIsDeleteDataSourceModalOpen,
    deleteDataSourceContent,
  } = useHooks()

  return (
    <>
      <Drawer
        PaperProps={{
          sx: {
            width: 296,
          },
        }}
        anchor="right"
        className="joyride-onboarding-tour-2"
        onClose={onClose}
        open={open}
      >
        <Stack
          bgcolor="common.white"
          height="100%"
          sx={{
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <Stack
            alignItems="flex-start"
            direction="row"
            justifyContent="space-between"
            p={2}
          >
            <Stack>
              <Typography fontWeight="bold" variant="h6">
                Content
              </Typography>
              <Typography fontSize="small">
                Manage your files and documents.
              </Typography>
            </Stack>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
          <ExpandedView
            expanded={expanded}
            handleDeleteDataSource={handleDeleteDataSource}
            isLoadingPresetDataSources={isLoadingPresetDataSources}
            isLoadingUserAddedDataSources={isLoadingUserAddedDataSources}
            organizationId={organizationId}
            presetDataSources={presetDataSources}
            pulseId={pulseId}
            toggleExpandSection={toggleExpandSection}
            userAddedDataSources={userAddedDataSources}
          />
        </Stack>
        <DataSourceSetup
          initialTab={initialTab}
          isOpen={isDataSourceSetupOpen}
          onClose={handleCloseDataSourceSetup}
          organizationId={organizationId}
          pulseId={pulseId}
        />
        <InvitePulseToMeetingModal
          isOpen={isInvitePulseToMeetingOpen}
          onClose={() => setIsInvitePulseToMeetingOpen(false)}
          setModalOpen={() => setIsInvitePulseToMeetingOpen(true)}
        />
      </Drawer>

      <DeleteDataSourceConfirmationModal
        isOpen={isDeleteDataSourceModalOpen}
        isSubmitting={isDeleteDataSourcePending}
        metadata={deleteDataSourceContent?.metadata ?? '-'}
        name={deleteDataSourceContent?.name ?? 'Unknown'}
        onClose={() => setIsDeleteDataSourceModalOpen(false)}
        onSubmit={handleConfirmedDeleteDataSource}
      />
    </>
  )
}
