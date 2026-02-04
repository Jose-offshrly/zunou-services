import {
  CircularProgress,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Typography,
} from '@mui/material'
import { Stack } from '@mui/system'
import { Pulse, PulseCategory } from '@zunou-graphql/core/graphql'
import {
  NotificationPreferenceMode,
  useCreateNotificationPreferenceMutation,
} from '@zunou-queries/core/hooks/useCreateNotificationPreferenceMutation'
import { useGetNotificationPreferencesQuery } from '@zunou-queries/core/hooks/useGetNotificationPreferencesQuery'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { GET_TOPICS_QUERY } from '@zunou-queries/core/hooks/useGetTopicsQuery'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

export default function ApplyToAllSettings({
  group,
}: {
  group: 'team' | 'direct_messages'
}) {
  const { t } = useTranslation('common')
  const [applyToAllSetting, setApplyToAllSetting] =
    useState<NotificationPreferenceMode | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { organizationId } = useParams()
  const { getToken, user } = useAuthContext()

  const { data: pulsesData } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const { data: notificationPreferencesData } =
    useGetNotificationPreferencesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { userId: user?.id },
    })

  const { mutate: createNotificationPreference } =
    useCreateNotificationPreferenceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  // Determine the current "apply to all" setting based on existing preferences
  useEffect(() => {
    if (!pulsesData?.pulses || !notificationPreferencesData) return

    const pulses = pulsesData.pulses
    const pulsesByGroup = pulses.filter((pulse: Pulse) => {
      if (pulse.category === PulseCategory.Personal) return false

      return group === 'team'
        ? pulse.category === PulseCategory.Team
        : pulse.category === PulseCategory.Onetoone
    })

    const preferences = notificationPreferencesData.notificationPreferences

    // get the notification mode for all pulses in the group
    const modes = pulsesByGroup.map((pulse: Pulse) => {
      const pref = preferences.find(
        (p) => p.scopeType === 'pulse' && p.scopeId === pulse.id,
      )
      return pref?.mode || 'all'
    })

    // if all pulses have the same mode, use that as the apply to all default setting
    const uniqueModes = [...new Set(modes)]
    if (uniqueModes.length === 1) {
      setApplyToAllSetting(uniqueModes[0])
    } else {
      setApplyToAllSetting(null)
    }
  }, [pulsesData, notificationPreferencesData, group])

  const handleApplyToAllChange = async (
    _: React.MouseEvent<HTMLElement>,
    notifMode: NotificationPreferenceMode | null,
  ) => {
    if (notifMode === null) return

    setApplyToAllSetting(notifMode)
    setIsUpdating(true)

    try {
      // Get pulses by group (team or direct messages)
      const pulses = pulsesData?.pulses ?? []
      const pulsesByGroup = pulses.filter((pulse: Pulse) => {
        if (pulse.category === PulseCategory.Personal) return false // skip personal pulse

        return group === 'team'
          ? pulse.category === PulseCategory.Team
          : pulse.category === PulseCategory.Onetoone
      })

      const token = await getToken()
      const coreUrl = import.meta.env.VITE_CORE_GRAPHQL_URL as string

      // Update notification preference for each pulse and their topics
      await Promise.all(
        pulsesByGroup.map(async (pulse: Pulse) => {
          // applies setting to the pulse itself
          await createNotificationPreference({
            mode: notifMode ?? applyToAllSetting,
            scopeId: pulse.id,
            scopeType: 'pulse',
          })

          // fetch topics for this pulse (skip for one-to-one pulses)
          if (pulse.category !== PulseCategory.Onetoone && organizationId) {
            try {
              const topicsData = await gqlClient(coreUrl, token).request(
                GET_TOPICS_QUERY,
                {
                  organizationId,
                  pulseId: pulse.id,
                },
              )

              // set setting per pulse
              const topics = topicsData?.topics?.data ?? []
              await Promise.all(
                topics.map((topic) =>
                  createNotificationPreference({
                    mode: notifMode ?? applyToAllSetting,
                    scopeId: topic.id,
                    scopeType: 'topic',
                  }),
                ),
              )
            } catch (error) {
              console.error(
                `Failed to update topics for pulse ${pulse.id}:`,
                error,
              )
            }
          }
        }),
      )

      toast.success(t('applied_settings_to_all_pulses'))
    } catch (error) {
      toast.error(t('could_not_update_settings'))
    } finally {
      setIsUpdating(false)
    }
  }

  // styling for the toggled group for Apply to All setting
  const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    // style of unselected buttons
    [`& .${toggleButtonGroupClasses.grouped}`]: {
      // style for the selected option
      '&.Mui-selected': {
        backgroundColor: theme.palette.primary.main + '20',
        color: theme.palette.primary.main,
      },
      border: 0,
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.text.primary,
      fontSize: 14,
      fontWeight: theme.typography.fontWeightRegular,
      margin: theme.spacing(0.5),
      [`&.${toggleButtonGroupClasses.disabled}`]: {
        border: 0,
      },

      textTransform: 'none',
    },
    [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]:
      {
        borderLeft: '1px solid transparent',
        marginLeft: -1,
      },
  }))

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      sx={{ px: 4, py: 2 }}
    >
      <Stack alignItems="center" direction="row" spacing={2}>
        <Typography color="text.secondary" sx={{ fontSize: 14 }}>
          {t('apply_to_all')}
        </Typography>

        <StyledToggleButtonGroup
          exclusive={true}
          onChange={handleApplyToAllChange}
          size="small"
          sx={{
            backgroundColor: 'grey.100',
            border: 1,
            borderColor: 'grey.300',
          }}
          value={applyToAllSetting}
        >
          <ToggleButton value="all">{t('receive_all')}</ToggleButton>
          <ToggleButton value="mentions">{t('mentions_only')}</ToggleButton>
          <ToggleButton value="off">{t('alerts_off')}</ToggleButton>
        </StyledToggleButtonGroup>
      </Stack>
      {isUpdating && (
        <Stack>
          <CircularProgress size={20} />
        </Stack>
      )}
    </Stack>
  )
}
