import { DataSourceOrigin } from '@zunou-graphql/core/graphql'
import { useDeleteDataSourceMutation } from '@zunou-queries/core/hooks/useDeleteDataSourceMutation'
import { useGetDataSourcesByOriginQuery } from '@zunou-queries/core/hooks/useGetDataSourcesByOriginQuery'
import { useGetIntegrations } from '@zunou-queries/core/hooks/useGetIntegrations'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useIntegrationContext } from '~/context/IntegrationContext'
import { useMeetingsContext } from '~/context/MeetingsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { MockMeeting } from '~/libs/mockMeetings'
import { useDataSourceSidebar } from '~/store/useDataSourceSidebar'

const SIDEBAR_VIEW_STATE_KEY = 'datasource-sidebar-view-state'

export type DataSourceSectionType =
  | 'integrations'
  | 'meetings'
  | 'preset'
  | 'user'

export interface DeleteDataSourceModalContent {
  id: string
  name: string
  metadata: string
}

export const useHooks = () => {
  const { t } = useTranslation('sources')
  const { pulseId } = useParams()
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { googleCalLinked } = useMeetingsContext()
  const { setCurrentView } = useIntegrationContext()
  const { isCollapsed, setIsCollapsed } = useDataSourceSidebar()

  const [isDataSourceSetupOpen, setIsDataSourceSetupOpen] = useState(false)
  const [initialTab, setInitialTab] = useState<string | null>(null)
  const [isInvitePulseToMeetingOpen, setIsInvitePulseToMeetingOpen] =
    useState(false)
  const [isDeleteDataSourceModalOpen, setIsDeleteDataSourceModalOpen] =
    useState(false)
  const [deleteDataSourceContent, setDeleteDataSourceContent] =
    useState<DeleteDataSourceModalContent | null>(null)

  const [expanded, setExpanded] = useState<
    Record<DataSourceSectionType, boolean>
  >({
    integrations: true,
    meetings: true,
    preset: true,
    user: true,
  })

  useEffect(() => {
    setIsCollapsed(
      localStorage.getItem(SIDEBAR_VIEW_STATE_KEY) !== null
        ? localStorage.getItem(SIDEBAR_VIEW_STATE_KEY) === 'false'
        : false,
    )
  }, [])

  // TODO: Technical Debt: Refactor to put this into the meetings context to prevent prop drilling
  const [meetingsData, setMeetingsData] = useState<MockMeeting[]>([])

  const filteredMeetings = googleCalLinked
    ? meetingsData
    : meetingsData.filter((meeting) => meeting.source === 'manual')

  const {
    data: meetingDataSourcesData,
    isLoading: isLoadingMeetingDataSources,
    refetch: refetchDataSourcesData,
  } = useGetDataSourcesByOriginQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      origin: DataSourceOrigin.Meeting,
      pulseId,
    },
  })
  const meetingDataSources = meetingDataSourcesData?.dataSourcesByOrigin

  const {
    data: userAddedDataSourcesData,
    isLoading: isLoadingUserAddedDataSources,
  } = useGetDataSourcesByOriginQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      origin: DataSourceOrigin.Custom,
      pulseId,
    },
  })
  const userAddedDataSources = userAddedDataSourcesData?.dataSourcesByOrigin

  const { data: presetDataSourcesData, isLoading: isLoadingPresetDataSources } =
    useGetDataSourcesByOriginQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        organizationId,
        origin: DataSourceOrigin.Preset,
        pulseId,
      },
    })
  const presetDataSources = presetDataSourcesData?.dataSourcesByOrigin

  const handleDataSourceCreated = useCallback(() => {
    refetchDataSourcesData()
  }, [refetchDataSourcesData])

  usePusherChannel({
    channelName: `data-source.${organizationId}.pulse.${pulseId}`,
    eventName: '.data-source-created',
    onEvent: handleDataSourceCreated,
  })

  const { data: integrationsData, isLoading: isLoadingIntegrations } =
    useGetIntegrations({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { pulseId, userId: user?.id },
    })
  const integrations = integrationsData?.integrations ?? []

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

  const handleOpenDataSourceSetup = (initialTab: string) => {
    setInitialTab(initialTab)
    setIsDataSourceSetupOpen(true)
  }

  const handleCloseDataSourceSetup = () => {
    setIsDataSourceSetupOpen(false)
    setCurrentView(null)
  }

  const toggleExpandSection = (section: DataSourceSectionType) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const handleToggleView = () => {
    setIsCollapsed(!isCollapsed)
    localStorage.setItem(SIDEBAR_VIEW_STATE_KEY, isCollapsed.toString())

    // Dispatch custom event to notify other components of the change
    window.dispatchEvent(new Event('localStorageChange'))
  }

  const handleOpenInvitePulseToMeeting = () => {
    setIsInvitePulseToMeetingOpen(true)
  }

  return {
    deleteDataSourceContent,
    expanded,
    filteredMeetings,
    handleCloseDataSourceSetup,
    handleConfirmedDeleteDataSource,
    handleDeleteDataSource,
    handleOpenDataSourceSetup,
    handleOpenInvitePulseToMeeting,
    handleToggleView,
    initialTab,
    integrations,
    isCollapsed,
    isDataSourceSetupOpen,
    isDeleteDataSourceModalOpen,
    isDeleteDataSourcePending,
    isInvitePulseToMeetingOpen,
    isLoadingIntegrations,
    isLoadingMeetingDataSources,
    isLoadingPresetDataSources,
    isLoadingUserAddedDataSources,
    meetingDataSources,
    meetingsData,
    organizationId,
    presetDataSources,
    pulseId,
    setCurrentView,
    setIsDeleteDataSourceModalOpen,
    setIsInvitePulseToMeetingOpen,
    setMeetingsData,
    toggleExpandSection,
    userAddedDataSources,
  }
}
