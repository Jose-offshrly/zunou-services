import { Avatar, Typography } from '@mui/material'
import { alpha, lighten, Stack } from '@mui/system'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import pulseLogo from '~/assets/pulse-logo.png'
import { usePulseStore } from '~/store/usePulseStore'

interface WelcomeMessageProps {
  topicName?: string
}

export const WelcomeMessage = ({ topicName }: WelcomeMessageProps) => {
  const { t } = useTranslation('pulse')
  const { pulse } = usePulseStore()

  const displayText = topicName
    ? topicName
    : pulse
      ? `${pulse.name}${pulse.name.endsWith('s') ? `'` : `'s`} ${t('team_chat')}`
      : `Pulse's ${t('team_chat')}`

  return (
    <Stack
      alignItems="flex-end"
      direction="row"
      flexGrow={1}
      marginBottom={2}
      maxWidth="100%"
      spacing={2}
      width="100%"
    >
      <Avatar alt="assistant" src={pulseLogo} sx={{ height: 48, width: 48 }} />
      <Stack
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: `1px solid ${lighten(theme.palette.primary.main, 0.5)}`,
          borderRadius: '0px 16px 16px 16px',
          minWidth: 240,
          padding: 2,
          width: '100%',
        }}
      >
        <Typography
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 500,
          }}
          variant="body2"
        >
          {t('feed_start_label')}{' '}
          <Typography color="primary.main" component="span" fontWeight="bold">
            {displayText}
          </Typography>
        </Typography>
      </Stack>
    </Stack>
  )
}
