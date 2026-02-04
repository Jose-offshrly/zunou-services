import { SelectChangeEvent, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import {
  NotificationPreferenceMode,
  useCreateNotificationPreferenceMutation,
} from '@zunou-queries/core/hooks/useCreateNotificationPreferenceMutation'
import { useGetNotificationPreferencesQuery } from '@zunou-queries/core/hooks/useGetNotificationPreferencesQuery'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import NotificationSettingSelector from './NotificationSettingSelector'

export default function PulseAndTopicDefaultSetting() {
  const { t } = useTranslation('common')
  const { data: notificationPreferencesData, isLoading } =
    useGetNotificationPreferencesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })
  const notificationDefault = useMemo<NotificationPreferenceMode>(() => {
    const globalPreference =
      notificationPreferencesData?.notificationPreferences.find(
        (notificationPref) => notificationPref.scopeType === 'global',
      )
    return globalPreference?.mode ?? 'all'
  }, [notificationPreferencesData?.notificationPreferences])

  const { mutate: createNotificationPreference } =
    useCreateNotificationPreferenceMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleChange = (event: SelectChangeEvent) => {
    const notificationMode = event.target.value as NotificationPreferenceMode

    createNotificationPreference(
      {
        mode: notificationMode,
        scopeType: 'global',
      },
      {
        onSuccess: () => {
          toast.success(t('setting_updated_successfully'))
        },
      },
    )
  }

  return (
    <Stack alignItems="center" direction="row">
      <Typography color="text.secondary" fontSize={14} sx={{ flex: 1 }}>
        {t('default_notification_setting')}
      </Typography>

      <NotificationSettingSelector
        isLoading={isLoading}
        onChange={handleChange}
        value={notificationDefault}
      />
    </Stack>
  )
}
