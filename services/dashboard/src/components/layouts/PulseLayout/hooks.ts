import { useQueryClient } from '@tanstack/react-query'
import { PulseCategory, ThreadType } from '@zunou-graphql/core/graphql'
import { useCreateThreadMutation } from '@zunou-queries/core/hooks/useCreateThreadMutation'
import { useGetActiveThreadQuery } from '@zunou-queries/core/hooks/useGetActiveThreadQuery'
import { useGetPulseMemberQuery } from '@zunou-queries/core/hooks/useGetPulseMemberQuery'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { useGetPulseQuery } from '@zunou-queries/core/hooks/useGetPulseQuery'
import { useGetPulseWelcomeData } from '@zunou-queries/core/hooks/useGetPulseWelcomeData'
import { useGetSavedMessagesQuery } from '@zunou-queries/core/hooks/useGetSavedMessagesQuery'
import { useGetStrategiesQuery } from '@zunou-queries/core/hooks/useGetStrategiesQuery'
import { useOrganizationNotificationsQuery } from '@zunou-queries/core/hooks/useOrganizationNotificationsQuery'
import { usePulseNotificationsQuery } from '@zunou-queries/core/hooks/usePulseNotificationsQuery'
import { useUpdatePulseLastVisitedMutation } from '@zunou-queries/core/hooks/useUpdatePulseLastVisitedMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { Step } from 'react-joyride'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { useJoyride } from '~/context/JoyrideContext'
import { useMeetingsContext } from '~/context/MeetingsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { Routes } from '~/services/Routes'
import { usePanelsStore } from '~/store/usePanelsStore'
import { ShowPulseWelcomeState, usePulseStore } from '~/store/usePulseStore'
import {
  HAS_TRIGGERED_LANDING_PAGE_KEY,
  HAS_TRIGGERED_ONBOARDING_TOUR_KEY,
} from '~/utils/localStorageKeys'
import { hasTimeExceededThreshold } from '~/utils/relativeDateWithTz'

const ONBOARDING_STEPS: Step[] = [
  {
    content: `This is your personal productivity hub. I'll give you a quick tour so you know where everything lives.`,
    target: '.joyride-onboarding-tour-1',
    title: 'Welcome to Zunou Assistant',
  },
  // {
  //   content:
  //     'Bring everything into one place connect files, meetings, and integrations (like Fireflies) to make your assistant smarter and more helpful.',
  //   placement: 'right',
  //   target: '.joyride-onboarding-tour-2',
  // },
  {
    content: `Ask Questions, get meeting summaries, and surface tasks instantly. It's like having an extra brain for work.`,
    disableScrolling: true,
    placement: 'left',
    target: '.joyride-onboarding-tour-3',
    title: 'Your personal AI workspace',
  },
  {
    content: `Use the task board to track, prioritize, and manage your progress with ease.`,
    placement: 'right',
    target: '.joyride-onboarding-tour-4',
    title: 'Stay on top of your work',
  },
  {
    content: `Use notes to jot down quick thoughts, meeting takeaways, or reminders so nothing slips through.`,
    placement: 'right',
    target: '.joyride-onboarding-tour-5',
    title: 'Capture ideas on the fly',
  },
  {
    content: `Click this button to open a new channel. From here, you'll choose between a 1-on-1 Channel or a Team Channel.`,
    placement: 'right',
    target: '.joyride-onboarding-tour-6',
    title: 'Start new conversations',
  },
  {
    content: `Collaborate directly with a teammate or your assistant - perfect for check-ins, mentoring, and feedback.`,
    placement: 'right',
    target: '.joyride-onboarding-tour-7',
    title: 'Private spaces for for focused chats',
  },
  {
    content: `Sync up in Team Channels to run stand-ups, share updates, and manage projects - all in one place.`,
    placement: 'right',
    target: '.joyride-onboarding-tour-8',
    title: 'Work together as a team',
  },
  {
    content: `Start by adding a meeting or connecting a source, and your assistant will begin surfacing what matters most.`,
    placement: 'left',
    target: '.joyride-onboarding-tour-9',
    title: `You're ready to go`,
  },
]

export const useHooks = () => {
  const queryClient = useQueryClient()
  const { user, userRole } = useAuthContext()
  const { isBrainDumpModalOpen, setIsBrainDumpModalOpen } = useMeetingsContext()
  const {
    isLoading,
    pulseMembership,
    setPermissions,
    setPulse,
    setPulseCategory,
    setPulseMembers,
    setPulseMembership,
    setPulseStatusOption,
  } = usePulseStore()

  const navigate = useNavigate()

  const rolePrefix = useMemo(() => userRole?.toLowerCase() ?? '', [userRole])

  const location = useLocation()

  const { startTour } = useJoyride()

  const { pulseWelcomeState, setPulseWelcomeState, setActiveThreadId } =
    usePulseStore()
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()
  const hasCreated = useRef(false)
  const timezone = user?.timezone ?? 'UTC'
  const fetchedPulses = useRef<Record<string, boolean>>({})
  const hasNavigatedToLanding = useRef(false)

  const {
    data: activeThreadData,
    isLoading: isLoadingActiveThread,
    isRefetching: isRefetchingActiveThread,
    refetch: refetchActiveThreadData,
  } = useGetActiveThreadQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: false,
    variables: {
      organizationId,
      pulseId,
      type:
        userRole === UserRoleEnum.MANAGER
          ? ThreadType.Admin
          : userRole === UserRoleEnum.GUEST
            ? ThreadType.Guest
            : ThreadType.User,
    },
  })

  const { mutate: createThread, isPending: isCreatingThread } =
    useCreateThreadMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  useEffect(() => {
    if (activeThreadData?.activeThread)
      setActiveThreadId(activeThreadData.activeThread.id)

    if (hasCreated.current) return

    if (
      !isLoadingActiveThread &&
      !activeThreadData?.activeThread &&
      !isRefetchingActiveThread &&
      !isCreatingThread
    ) {
      hasCreated.current = true

      createThread(
        {
          name: 'New Thread',
          organizationId,
          pulseId,
          type:
            userRole === UserRoleEnum.MANAGER
              ? ThreadType.Admin
              : userRole === UserRoleEnum.GUEST
                ? ThreadType.Guest
                : ThreadType.User,
        },
        {
          onError: (error) => {
            console.error('Error creating thread:', error)
            toast.error('Failed to create thread')
          },
          onSuccess: () => {
            refetchActiveThreadData()
          },
        },
      )
    }
  }, [
    activeThreadData,
    isLoadingActiveThread,
    isRefetchingActiveThread,
    refetchActiveThreadData,
  ])

  useEffect(() => {
    console.log('[DEBUG]: ', pulseWelcomeState)
  }, [pulseWelcomeState])

  const { panels, setPanels, togglePanel } = usePanelsStore()

  // Close notifications panel when pulseId changes
  useEffect(() => {
    setPanels((prev) => ({
      ...prev,
      notifications: false,
    }))
  }, [pulseId])

  const threadTypeMapping: Record<string, ThreadType> = {
    [UserRoleEnum.EMPLOYEE]: ThreadType.User,
    [UserRoleEnum.MANAGER]: ThreadType.Admin,
    [UserRoleEnum.GUEST]: ThreadType.Guest,
  }

  const { data: pulseData, isFetching: isFetchingPulse } = useGetPulseQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      pulseId,
    },
  })
  const pulse = pulseData?.pulse
  const isPersonalPulse = pulse?.category === PulseCategory.Personal

  const { data: welcomeData, isLoading: isWelcomeDataLoading } =
    useGetPulseWelcomeData({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: Boolean(user?.id) && Boolean(pulseId),
      variables: {
        pulseId,
        userId: user?.id,
      },
    })

  const { mutateAsync: updatePulseLastVisited } =
    useUpdatePulseLastVisitedMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { data: membersData, isFetching: isFetchingPulseMembers } =
    useGetPulseMembersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        pulseId,
      },
    })
  const pulseMembers = membersData?.pulseMembers.data ?? []

  const { data: savedMessagesData, isFetching: isFetchingSavedMessages } =
    useGetSavedMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!user,
      variables: {
        organizationId: organizationId,
        pulseId: pulseId,
        userId: user?.id,
      },
    })

  const savedMessages =
    userRole && savedMessagesData?.savedMessages
      ? savedMessagesData.savedMessages.data.filter((savedMessage) => {
          return savedMessage.thread?.type === threadTypeMapping[userRole]
        })
      : []

  const { data: strategiesData } = useGetStrategiesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { pulseId },
  })

  // use per pulse notifications if NOT in personal pulse
  const { data: notificationsData, isLoading: isLoadingNotifs } =
    usePulseNotificationsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !isPersonalPulse,
      variables: {
        pulseId,
      },
    })

  // use per org notifications if in personal pulse
  const { data: orgNotificationsData, isLoading: isLoadingOrgNotifs } =
    useOrganizationNotificationsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: isPersonalPulse,
      variables: {
        organizationId,
        page: 1,
      },
    })

  const notifications = isPersonalPulse
    ? orgNotificationsData?.organizationNotifications?.data ?? []
    : notificationsData?.pulseNotifications ?? []

  const pendingNotificationCount = notifications.filter(
    (notif) => !notif.readAt,
  ).length

  // Set the welcome message state and update lastVisited.
  // Note: These updates won't be reflected in context until the next page load.
  useEffect(() => {
    if (isFetchingPulse || isWelcomeDataLoading || !pulseId || !user) {
      return
    }

    if (fetchedPulses.current[pulseId]) {
      return
    }

    if (!welcomeData) {
      console.error('Failed to retrieve welcome data.')

      // Still set state for pulses without welcome data
      setPulseWelcomeState((prev) => {
        fetchedPulses.current[pulseId] = true

        return [
          ...prev,
          {
            initialData: null,
            pulseId,
            state: ShowPulseWelcomeState.Hidden,
          },
        ]
      })

      updatePulseLastVisited({ pulseId, userId: user.id })
      return
    }

    // Handle pulse with welcome data
    setPulseWelcomeState((prev) => {
      fetchedPulses.current[pulseId] = true

      const lastVisited = welcomeData.pulseWelcomeData.lastVisited

      let welcomeState: ShowPulseWelcomeState
      if (!lastVisited) {
        welcomeState = ShowPulseWelcomeState.FirstTime
      } else {
        const hasExceeded = hasTimeExceededThreshold(
          lastVisited,
          timezone,
          60 * 5, // 5 mins for testing
        )
        welcomeState = hasExceeded
          ? ShowPulseWelcomeState.Show
          : ShowPulseWelcomeState.Hidden
      }

      return [
        ...prev,
        {
          initialData: welcomeData.pulseWelcomeData,
          pulseId,
          state: welcomeState,
        },
      ]
    })

    updatePulseLastVisited({ pulseId, userId: user.id })
  }, [
    pulseId,
    user,
    isFetchingPulse,
    isWelcomeDataLoading,
    welcomeData,
    timezone,
  ])

  // Update pulse in store immediately to instantly update the pulse name
  useEffect(() => {
    if (pulse && user && pulseId) {
      setPulse(pulse)
      setPulseCategory(pulse.category ?? PulseCategory.Team)
      setPulseStatusOption(pulse.status_option ?? null)
    }
  }, [pulse, pulseId, user, setPulse, setPulseCategory, setPulseStatusOption])

  useEffect(() => {
    if (!isFetchingPulseMembers) {
      setPulseMembers(pulseMembers)
    }
  }, [isFetchingPulseMembers, pulseId])

  const { data: pulseMemberData, isFetching: isFetchingMembership } =
    useGetPulseMemberQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { pulseId, userId: user?.id },
    })
  const pulseMember = pulseMemberData?.pulseMember

  useEffect(() => {
    if (isFetchingMembership) return

    if (!pulseId || !user || !pulseMember) {
      setPulseMembership(null)

      return
    }

    setPulseMembership(pulseMember)
    setPermissions(pulseMember.role)
  }, [isFetchingMembership, pulseId, pulseMember, setPulseMembership, user])

  // Navigate to landing if user has not yet onboarded AND has not visited landing page
  // If user has explicitly clicked "Continue to Web App" (hasTriggeredLandingPage is set),
  // we trust that and don't redirect them back to landing
  useEffect(() => {
    if (!user || !organizationId) return

    // Prevent running more than once
    if (hasNavigatedToLanding.current) return

    const hasTriggeredLandingPage = localStorage.getItem(
      HAS_TRIGGERED_LANDING_PAGE_KEY,
    )

    // Only redirect to landing if user hasn't onboarded AND hasn't explicitly
    // completed/skipped the landing flow (by clicking "Continue to Web App")
    if (!user?.onboarded && !hasTriggeredLandingPage) {
      // Prevent navigation if already on landing page
      if (location.pathname.includes('/landing/')) {
        hasNavigatedToLanding.current = true
        return
      }

      const path = pathFor({
        pathname: Routes.Landing,
        query: { organizationId },
      })

      hasNavigatedToLanding.current = true

      navigate(`/${path}`, { replace: true })
    }
  }, [user, organizationId, navigate, location.pathname])

  // For triggering onboarding tour
  useEffect(() => {
    const path = `/${rolePrefix}/${pathFor({
      pathname: Routes.PulseDetail,
      query: {
        organizationId,
        pulseId,
      },
    })}`

    if (
      !pulse ||
      pulse.category !== PulseCategory.Personal ||
      isLoading ||
      isFetchingMembership ||
      !pulseMembership ||
      !location.pathname.includes(path)
    )
      return

    const hasTriggeredOnboardingTour = localStorage.getItem(
      HAS_TRIGGERED_ONBOARDING_TOUR_KEY,
    )

    // If user has already finished onboarding tour do not start tour
    if (hasTriggeredOnboardingTour) return

    startTour(ONBOARDING_STEPS, () =>
      localStorage.setItem(HAS_TRIGGERED_ONBOARDING_TOUR_KEY, 'true'),
    )
  }, [
    pulse,
    isLoading,
    isFetchingMembership,
    pulseMembership,
    location.pathname,
  ])

  const handlePulseNotification = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ['notifications', pulseId],
    })
    queryClient.invalidateQueries({
      queryKey: ['pulseNotifications', pulseId],
    })

    // invalidate org-scoped notifications
    queryClient.invalidateQueries({
      queryKey: ['organizationNotifications', organizationId],
    })
  }, [queryClient, pulseId])

  // subscribe to org notifs when user is in personal pulse
  if (!isPersonalPulse) {
    usePusherChannel({
      channelName: pulseId && `pulse-notification.${pulseId}`,
      eventName: '.pulse-notification',
      onEvent: handlePulseNotification,
    })
  } else {
    usePusherChannel({
      channelName:
        organizationId && `organization-notification.${organizationId}`,
      eventName: '.organization-notification',
      onEvent: handlePulseNotification,
    })
  }

  return {
    isBrainDumpModalOpen,
    isFetchingMembership,
    isFetchingSavedMessages,
    isLoading,
    isLoadingNotifs: notificationsData ? isLoadingNotifs : isLoadingOrgNotifs,
    notifications,
    panels,
    pendingNotificationCount,
    pulseMembership,
    savedMessages,
    setIsBrainDumpModalOpen,
    strategiesData,
    togglePanel,
    user,
  }
}
