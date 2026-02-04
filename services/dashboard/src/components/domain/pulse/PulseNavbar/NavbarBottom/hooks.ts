import {
  ChecklistOutlined,
  CorporateFareOutlined,
  Groups,
  NoteOutlined,
  SmartToyOutlined,
  SvgIconComponent,
} from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'
import { PulseCategory, ThreadType } from '@zunou-graphql/core/graphql'
import { useCreateThreadMutation } from '@zunou-queries/core/hooks/useCreateThreadMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { pathFor } from '@zunou-react/services/Routes'
import { UserRoleType } from '@zunou-react/types/role'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import {
  ActiveTab,
  SelectedTab,
  SelectedTabEnum,
  ShowPulseWelcomeState,
  usePulseStore,
} from '~/store/usePulseStore'
import { useTopicStore } from '~/store/useTopicStore'

interface TabOption {
  path: SelectedTab
  label: string
  icon: SvgIconComponent
}

const threadTypeMap: Record<UserRoleType, ThreadType> = {
  [UserRoleEnum.MANAGER]: ThreadType.Admin,
  [UserRoleEnum.EMPLOYEE]: ThreadType.User,
  [UserRoleEnum.GUEST]: ThreadType.Guest,
}

const isTabOption = (tab: unknown): tab is TabOption =>
  typeof tab === 'object' && tab !== null && 'path' in tab

export const useHooks = () => {
  const { t } = useTranslation('pulse')

  const navigate = useNavigate()
  const { currentPulseTopic } = useTopicStore()
  const { organizationId } = useOrganization()
  const { user, userRole } = useAuthContext()
  const { pulseId } = useParams()
  const queryClient = useQueryClient()
  const location = useLocation()
  const {
    pulseCategory,
    pulseWelcomeState,
    setPulseWelcomeState,
    selectedTab,
    setSelectedTab,
    isPulseRefreshDisabled,
    setActiveThreadId,
    pulseActions,
    addActionToPulse,
    pulseChatMode,
    setPulseChatMode,
  } = usePulseStore()

  const [tabIndex, setTabIndex] = useState(0)

  const pulseAction = useMemo(
    () => pulseActions.find((pulse) => pulse.id === pulseId),
    [pulseActions, pulseId],
  )

  const lastActiveTab = useMemo(
    () => pulseAction?.activeTab ?? null,
    [pulseAction],
  )
  const updateActiveTabInStore = useCallback(
    ({ id, activeTab }: { id: string; activeTab: ActiveTab }) =>
      addActionToPulse({ id, updates: { activeTab } }),
    [addActionToPulse],
  )

  const tabOptions = useMemo(() => {
    const tabs: (TabOption | false)[] = [
      {
        icon: SmartToyOutlined,
        label: t('pulse_chat'),
        path: SelectedTabEnum.PULSE,
      },
      {
        icon: Groups,
        label:
          pulseCategory === PulseCategory.Onetoone ? t('chat') : t('team_chat'),
        path: SelectedTabEnum.TEAM_CHAT,
      },
      {
        icon: ChecklistOutlined,
        label: t('tasks'),
        path: SelectedTabEnum.TASKS,
      },
      pulseCategory === PulseCategory.Team && {
        icon: CorporateFareOutlined,
        label: t('org_chart'),
        path: SelectedTabEnum.ORG_CHART,
      },
      {
        icon: NoteOutlined,
        label: t('notes'),
        path: SelectedTabEnum.NOTES,
      },
    ]

    return tabs.filter(isTabOption)
  }, [t, pulseCategory])

  const handleSelectTab = (index: number) => {
    setTabIndex(index)
    setSelectedTab(tabOptions[index].path)

    const path = pathFor({
      pathname: Routes.PulseDetail,
      query: {
        organizationId,
        pulseId,
      },
    })

    navigate(`${path}/${tabOptions[index].path}`)
  }

  const getActiveTab = (
    pathname: string,
    tabOptions: TabOption[],
  ): SelectedTab => {
    for (const tab of tabOptions) {
      if (tab.path && pathname.includes(`/${tab.path}`)) {
        return tab.path
      }
    }

    return null
  }

  const getInitialTabIndex = useCallback(
    (tabOptions: TabOption[]) => {
      const activePath = getActiveTab(location.pathname, tabOptions)
      const foundIndex = tabOptions.findIndex((tab) => tab.path === activePath)

      return foundIndex >= 0 ? foundIndex : 0
    },
    [location.pathname],
  )

  // Synchronize tab state when location or tabOptions change
  useEffect(() => {
    if (!pulseId) return

    const currentPath = location.pathname

    // Use session only if current path matches the saved path
    if (lastActiveTab && lastActiveTab.path === currentPath) {
      setTabIndex(lastActiveTab.tabIndex)
      setSelectedTab(lastActiveTab.selectedTab)
      return
    }

    const newTabIndex = getInitialTabIndex(tabOptions)
    const activeTab = getActiveTab(location.pathname, tabOptions)

    let tab: SelectedTab = SelectedTabEnum.PULSE

    // Update both tabIndex and selectedTab
    setTabIndex(newTabIndex)

    if (activeTab) {
      tab = activeTab as SelectedTab
    }

    setSelectedTab(tab)

    updateActiveTabInStore({
      activeTab: {
        path: currentPath,
        selectedTab: tab,
        tabIndex: newTabIndex,
      },
      id: pulseId,
    })
  }, [location.pathname, tabOptions, lastActiveTab])

  const timezone = user?.timezone ?? 'UTC'

  const { mutateAsync: createThread } = useCreateThreadMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const createNewThread = useCallback(async () => {
    if (!userRole) {
      throw new Error('Cannot create thread: User Role is required')
    }

    if (!pulseId) {
      throw new Error('Cannot create thread: Pulse ID is required')
    }

    await createThread(
      {
        name: 'New Chat',
        organizationId,
        pulseId,
        type: threadTypeMap[userRole],
      },
      {
        onSuccess: (res) => {
          setActiveThreadId(res.createThread.id)

          queryClient.invalidateQueries({
            queryKey: [
              'activeThread',
              pulseId,
              organizationId,
              threadTypeMap[userRole],
            ],
          })

          queryClient.removeQueries({
            queryKey: ['previousThread', pulseId, organizationId],
          })
        },
      },
    )

    const targetPulse = pulseWelcomeState.find(
      (pulse) => pulse.pulseId === pulseId,
    )

    if (!targetPulse) return

    const initialData = targetPulse.initialData

    if (!initialData) return

    const currentTime = dayjs().tz(timezone)
    const twentyFourHoursAgo = currentTime.subtract(24, 'hours')

    // The date of these are already in the correct timezone
    const meetings = initialData?.meetings ?? []
    const tasks = initialData?.tasks ?? []
    const dataSources = initialData?.dataSources ?? []

    // Filter meetings by date field (last 24 hours)
    const recentMeetings = meetings.filter((meeting) => {
      const meetingDate = dayjs.tz(meeting.date, timezone)
      return meetingDate.isAfter(twentyFourHoursAgo)
    })

    // Filter tasks by createdAt field (last 24 hours)
    const recentTasks = tasks.filter((task) => {
      const taskDate = dayjs.tz(task.createdAt, timezone)
      return taskDate.isAfter(twentyFourHoursAgo)
    })

    // Filter dataSources by createdAt field (last 24 hours)
    const recentDataSources = dataSources.filter((dataSource) => {
      const dataSourceDate = dayjs.tz(dataSource.createdAt, timezone)
      return dataSourceDate.isAfter(twentyFourHoursAgo)
    })

    // Create new initialData object instead of mutating the original
    const updatedInitialData = {
      ...initialData,
      dataSources: recentDataSources,
      meetings: recentMeetings,
      tasks: recentTasks,
    }

    // Pulse's welcome state should already be set in pulse layout, update it to first time.
    setPulseWelcomeState(
      pulseWelcomeState.map((pulse) =>
        pulse.pulseId === pulseId
          ? {
              ...pulse,
              initialData: updatedInitialData,
              showRevertThread: true,
              state: ShowPulseWelcomeState.Show,
            }
          : pulse,
      ),
    )
  }, [
    userRole,
    pulseId,
    organizationId,
    createThread,
    threadTypeMap,
    queryClient,
    pulseWelcomeState,
    timezone,
    setPulseWelcomeState,
  ])

  return {
    createNewThread,
    currentPulseTopic,
    handleSelectTab,
    isPulseRefreshDisabled,
    pulseCategory,
    pulseChatMode,
    pulseId,
    selectedTab,
    setPulseChatMode,
    t,
    tabIndex,
    tabOptions,
  }
}
