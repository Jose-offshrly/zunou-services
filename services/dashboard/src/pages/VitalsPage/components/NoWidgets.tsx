import { WidgetsOutlined } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { SettingMode } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import { useVitalsContext } from '~/context/VitalsContext'

interface NoWidgetsProps {
  isGuest?: boolean
}

const NoWidgets = ({ isGuest }: NoWidgetsProps) => {
  const { t } = useTranslation('vitals')
  const { setting, background } = useVitalsContext()

  const isTransparent = background && setting.mode === SettingMode.Image

  return (
    <Stack alignItems="center" height="90vh" justifyContent="center">
      <Stack
        alignItems="center"
        color={theme.palette.common.white}
        gap={3}
        justifyContent="center"
        textAlign="center"
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            bgcolor: isTransparent
              ? alpha(theme.palette.secondary.main, 0.5)
              : theme.palette.secondary.main,
            borderRadius: 9999,
            height: 120,
            width: 120,
          }}
        >
          <WidgetsOutlined
            sx={{
              height: 70,
              width: 70,
            }}
          />
        </Stack>

        <Typography variant="h3">
          {isGuest ? t('heads_up') : t('no_widgets')}
        </Typography>

        <Typography maxWidth={400}>
          {isGuest ? t('no_widget_permissions') : t('no_widget_added')}
        </Typography>

        <Typography maxWidth={400}>
          {isGuest ? t('request_access') : t('add_new_widget_prompt')}
        </Typography>
      </Stack>
    </Stack>
  )
}

export default NoWidgets
