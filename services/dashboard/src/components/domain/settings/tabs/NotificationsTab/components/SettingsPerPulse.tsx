import SearchIcon from '@mui/icons-material/Search'
import {
  CircularProgress,
  SelectChangeEvent,
  SvgIcon,
  TextField,
  ToggleButton,
  toggleButtonClasses,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Stack, styled } from '@mui/system'
import type { Pulse, Topic } from '@zunou-graphql/core/graphql'
import { PulseCategory, TopicEntityType } from '@zunou-graphql/core/graphql'
import {
  NotificationPreference,
  NotificationPreferenceMode,
  useCreateNotificationPreferenceMutation,
} from '@zunou-queries/core/hooks/useCreateNotificationPreferenceMutation'
import { useGetNotificationPreferencesQuery } from '@zunou-queries/core/hooks/useGetNotificationPreferencesQuery'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { useGetTopics } from '@zunou-queries/core/hooks/useGetTopicsQuery'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { getPulseIcon } from '~/utils/getPulseIcon'

import NotificationSettingSelector from './NotificationSettingSelector'

// renders the avatar for one-to-one pulses/direct messages
const OneToOneAvatar = ({
  pulseId,
  currentUserId,
}: {
  pulseId: string
  currentUserId?: string
}) => {
  const { data: membersData, isLoading } = useGetPulseMembersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { pulseId },
  })

  const otherMember = useMemo(() => {
    return (
      membersData?.pulseMembers.data.find(
        (member) => member.user.id !== currentUserId,
      ) ?? null
    )
  }, [membersData?.pulseMembers.data, currentUserId])

  if (isLoading)
    return <LoadingSkeleton height={32} variant="circular" width={32} />

  if (otherMember)
    return (
      <Avatar
        placeholder={otherMember.user.name}
        size="small"
        src={otherMember.user.gravatar}
        variant="circular"
      />
    )
}
interface TopicItemProps {
  topic: Topic
  notificationPreferences: NotificationPreference[]
  isLoading: boolean
}

// Component for individual topic notification settings
const TopicItem = ({
  topic,
  notificationPreferences,
  isLoading,
}: TopicItemProps) => {
  const { t } = useTranslation('common')
  const [notificationSettingValue, setNotificationSettingValue] =
    useState<NotificationPreferenceMode>(() => {
      const topicPreference = notificationPreferences.find(
        (pref) => pref.scopeId === topic.id,
      )
      return topicPreference?.mode ?? 'all'
    })

  // Update the selector value if notification preferences change
  useEffect(() => {
    const topicPreference = notificationPreferences.find(
      (pref) => pref.scopeId === topic.id,
    )
    const currentMode = topicPreference?.mode ?? 'all'
    setNotificationSettingValue(currentMode)
  }, [notificationPreferences, topic.id])

  const { mutate: createNotificationPreference } =
    useCreateNotificationPreferenceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleChange = (event: SelectChangeEvent) => {
    const notificationMode = event.target.value as NotificationPreferenceMode
    setNotificationSettingValue(notificationMode)

    createNotificationPreference(
      {
        mode: notificationMode,
        scopeId: topic.id,
        scopeType: 'topic',
      },
      {
        onSuccess: () => {
          toast.success(t('setting_updated_successfully'))
        },
      },
    )
  }

  return (
    <Stack direction="row" justifyContent="space-between">
      <Stack alignItems="center" direction="row" sx={{ flex: 2 }}>
        <Typography
          sx={{
            color: 'primary.main',
            fontSize: '0.875rem',
            pl: 6,
          }}
          variant="body2"
        >
          #{topic.name}
        </Typography>
      </Stack>
      <NotificationSettingSelector
        isLoading={isLoading}
        onChange={handleChange}
        value={notificationSettingValue}
      />
    </Stack>
  )
}

interface PulseItemProps {
  pulse: Pulse
  notificationPreferences: NotificationPreference[]
  isLoading: boolean
  organizationId: string
  notificationFilter: NotificationPreferenceMode
}

// sets notification per pulse
const PulseItem = ({
  pulse,
  notificationPreferences,
  isLoading,
  organizationId,
  notificationFilter,
}: PulseItemProps) => {
  const isPersonalPulse = pulse.category === PulseCategory.Personal
  if (isPersonalPulse) return // don't show if this is personal pulse
  const { t } = useTranslation('common')

  const isOneToOnePulse = pulse.category === PulseCategory.Onetoone
  const { user } = useAuthContext()
  const [notificationSettingValue, setNotificationSettingValue] =
    useState<NotificationPreferenceMode>(() => {
      const pulsePreference = notificationPreferences.find(
        (pref) => pref.scopeId === pulse.id,
      )
      return pulsePreference?.mode ?? 'all'
    })

  // get topics for this pulse
  const { data: topicsData, isLoading: isLoadingTopics } = useGetTopics({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !isOneToOnePulse,
    variables: {
      organizationId,
      pulseId: pulse.id,
      type: TopicEntityType.TeamThread,
    },
  })

  const topics = topicsData?.topics.data ?? []

  // filter topics based on notification mode
  const filteredTopics = useMemo(() => {
    if (notificationFilter === 'all') {
      return topics
    }
    return topics.filter((topic) => {
      const topicPreference = notificationPreferences.find(
        (pref) => pref.scopeId === topic.id,
      )
      const topicMode = topicPreference?.mode ?? 'all'
      return topicMode === notificationFilter
    })
  }, [topics, notificationFilter, notificationPreferences])

  // check if this pulse should be shown based on filter
  const shouldShowPulse = useMemo(() => {
    if (notificationFilter === 'all') {
      return true
    }

    const pulsePreference = notificationPreferences.find(
      (pref) => pref.scopeId === pulse.id,
    )
    const pulseMode = pulsePreference?.mode ?? 'all'
    const pulseMatches = pulseMode === notificationFilter

    if (isOneToOnePulse) {
      return pulseMatches
    }

    // for team pulses, show the pulse if its notif setting matches OR if any of its topics match
    return pulseMatches || filteredTopics.length > 0
  }, [
    notificationFilter,
    notificationPreferences,
    pulse.id,
    isOneToOnePulse,
    filteredTopics.length,
  ])

  // update the selector value if notification preferences change
  useEffect(() => {
    const pulsePreference = notificationPreferences.find(
      (pref) => pref.scopeId === pulse.id,
    )
    const currentMode = pulsePreference?.mode ?? 'all'
    setNotificationSettingValue(currentMode)
  }, [notificationPreferences, pulse.id])

  const { mutate: createNotificationPreference } =
    useCreateNotificationPreferenceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleChange = (event: SelectChangeEvent) => {
    const notificationMode = event.target.value as NotificationPreferenceMode
    setNotificationSettingValue(notificationMode)

    createNotificationPreference(
      {
        mode: notificationMode,
        scopeId: pulse.id,
        scopeType: 'pulse',
      },
      {
        onSuccess: () => {
          toast.success(t('setting_updated_successfully'))
        },
      },
    )
  }

  if (!shouldShowPulse) {
    return null
  }

  return (
    <Stack>
      <Stack direction="row" justifyContent="space-between">
        <Stack alignItems="center" direction="row" spacing={2} sx={{ flex: 2 }}>
          {isOneToOnePulse && user ? (
            <Stack>
              <OneToOneAvatar currentUserId={user.id} pulseId={pulse.id} />
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main as string, 0.2),
                borderRadius: '50%',
                height: 32,
                width: 32,
              }}
            >
              <SvgIcon
                component={getPulseIcon(pulse.icon)}
                fontSize="inherit"
                sx={{ color: 'primary.main', fontSize: 14 }}
              />
            </Stack>
          )}
          <Typography>{pulse.name}</Typography>
        </Stack>

        <NotificationSettingSelector
          isLoading={isLoading}
          onChange={handleChange}
          value={notificationSettingValue}
        />
      </Stack>
      {/* Topics list */}
      <Stack spacing={0.5} sx={{ mt: 1 }}>
        {isLoadingTopics && (
          <Stack sx={{ pl: 6 }}>
            <CircularProgress size={16} />
          </Stack>
        )}
        {!isLoadingTopics &&
          !isOneToOnePulse &&
          filteredTopics.map((topic) => (
            <TopicItem
              isLoading={isLoading}
              key={topic.id}
              notificationPreferences={notificationPreferences}
              topic={topic}
            />
          ))}
      </Stack>
    </Stack>
  )
}

// component which list all pulses and their notification settings
export default function SettingsPerPulse({
  group,
}: {
  group: 'team' | 'direct_messages'
}) {
  const { t } = useTranslation('common')
  const [notificationFilter, setNotificationFilter] =
    useState<NotificationPreferenceMode>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { organizationId } = useParams()

  // get list of pulses to display
  const { data: pulsesData, isLoading } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  // get notification preferences
  const { data: notificationPreferencesData, isLoading: isLoadingPreferences } =
    useGetNotificationPreferencesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const notificationPreferences =
    notificationPreferencesData?.notificationPreferences ?? []

  const filteredPulses = useMemo(() => {
    const pulses = pulsesData?.pulses ?? []

    const pulsesByGroup = pulses.filter((pulse) =>
      group === 'team'
        ? pulse.category === PulseCategory.Team
        : pulse.category === PulseCategory.Onetoone,
    )

    return pulsesByGroup
      .filter((pulse) => {
        // filter by search query
        if (
          searchQuery &&
          !pulse.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [
    pulsesData?.pulses,
    group,
    searchQuery,
    notificationFilter,
    notificationPreferences,
  ])

  const handleFilterChange = (
    _: React.MouseEvent<HTMLElement>,
    newValue: NotificationPreferenceMode,
  ) => {
    if (newValue !== null) {
      setNotificationFilter(newValue)
    }
  }

  // style for the filter buttons
  const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    borderColor: theme.palette.text.secondary,
    gap: '0.5rem',

    [`& .${toggleButtonGroupClasses.firstButton}, & .${toggleButtonGroupClasses.middleButton}`]:
      {
        borderBottomRightRadius: theme.shape.borderRadius,
        borderTopRightRadius: theme.shape.borderRadius,
      },
    [`& .${toggleButtonGroupClasses.lastButton}, & .${toggleButtonGroupClasses.middleButton}`]:
      {
        borderBottomLeftRadius: theme.shape.borderRadius,
        borderLeft: `1px solid ${theme.palette.divider}`,
        borderTopLeftRadius: theme.shape.borderRadius,
      },
    [`& .${toggleButtonGroupClasses.lastButton}.${toggleButtonClasses.disabled}, & .${toggleButtonGroupClasses.middleButton}.${toggleButtonClasses.disabled}`]:
      {
        borderLeft: `1px solid ${theme.palette.action.disabledBackground}`,
      },

    // style for the selected option
    [`& .${toggleButtonGroupClasses.grouped}`]: {
      '&.Mui-selected': {
        backgroundColor: alpha(theme.palette.primary.main as string, 0.2),
        color: theme.palette.primary.main,
      },
      border: `1px solid ${theme.palette.grey[300]}`,
      fontSize: 12,
      padding: '4px 12px',

      textTransform: 'none',
    },
  }))

  return (
    <Stack spacing={1} sx={{ padding: 2 }}>
      {/* FILTERS for pulses based on notification setting */}
      <StyledToggleButtonGroup
        exclusive={true}
        onChange={handleFilterChange}
        size="small"
        sx={{
          px: 2,
          py: 1,
        }}
        value={notificationFilter}
      >
        <ToggleButton value="all">{t('all')}</ToggleButton>
        <ToggleButton value="mentions">{t('mentions_only')}</ToggleButton>
        <ToggleButton value="off">{t('alerts_off')}</ToggleButton>
      </StyledToggleButtonGroup>

      {/* SEARCH BAR */}
      <TextField
        InputProps={{
          startAdornment: (
            <SearchIcon sx={{ color: 'grey.400', fontSize: 18, mr: 1 }} />
          ),
        }}
        fullWidth={true}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('search_bv_pulse')}
        size="small"
        sx={{
          backgroundColor: 'grey.100',
        }}
        value={searchQuery}
      />

      {/*  PULSE LIST */}
      {isLoading && <CircularProgress size={24} />}
      {!isLoading && filteredPulses.length > 0 && (
        <Stack sx={{ px: 2, py: 1 }}>
          {organizationId &&
            filteredPulses.map((pulse) => (
              <PulseItem
                isLoading={isLoadingPreferences}
                key={pulse.id}
                notificationFilter={notificationFilter}
                notificationPreferences={
                  notificationPreferencesData?.notificationPreferences ?? []
                }
                organizationId={organizationId}
                pulse={pulse}
              />
            ))}
        </Stack>
      )}
    </Stack>
  )
}
