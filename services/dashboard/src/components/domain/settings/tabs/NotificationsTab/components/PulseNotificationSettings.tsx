import { ChevronRight, ExpandMore } from '@mui/icons-material'
import { Divider, IconButton, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import ApplyToAllSettings from './ApplyToAllSettings'
import SettingsPerPulse from './SettingsPerPulse'

// Pulse notification settings for Team Pulses OR Direct Messages (1-to-1 Pulses)
export default function PulseNotificationSettings({
  group,
}: {
  group: 'team' | 'direct_messages'
}) {
  const [showPulses, setShowPulses] = useState(false)
  const { t } = useTranslation('common')

  return (
    <Stack
      sx={{
        border: 1,
        borderColor: 'grey.200',
        borderRadius: 1,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ px: 4, py: 2 }}
      >
        {/* HEADER text for this component */}
        <Stack>
          <Typography
            fontWeight="fontWeightMedium"
            sx={{
              fontSize: 14,
            }}
          >
            {group === 'team'
              ? t('pulse_and_topic_settings')
              : t('direct_messages')}
          </Typography>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 14,
            }}
          >
            {group === 'team'
              ? t('pulse_and_topic_settings_description')
              : t('dm_setting_description')}
          </Typography>
        </Stack>

        <IconButton
          onClick={() => setShowPulses(!showPulses)}
          size="small"
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            color: 'text.secondary',
          }}
        >
          {showPulses ? <ExpandMore /> : <ChevronRight />}
        </IconButton>
      </Stack>
      <Divider />
      <ApplyToAllSettings group={group} />

      {showPulses && (
        <Stack>
          <Divider />
          <SettingsPerPulse group={group} />
        </Stack>
      )}
    </Stack>
  )
}
