import { Divider, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useTranslation } from 'react-i18next'

import PulseAndTopicDefaultSetting from './components/PulseAndTopicDefaultSetting'
import PulseNotificationSettings from './components/PulseNotificationSettings'

export default function NotificationsTab() {
  const { t } = useTranslation('common')

  return (
    <>
      <Stack spacing={2}>
        <Stack>
          <Typography fontWeight="fontWeightMedium">
            {t('notification_settings')}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 14 }}>
            {t('notification_settings_description')}
          </Typography>
        </Stack>
        <PulseAndTopicDefaultSetting />
        <Divider />
        <PulseNotificationSettings group="team" />
        <Divider />
        <PulseNotificationSettings group="direct_messages" />
      </Stack>
    </>
  )
}
