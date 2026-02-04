import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { ToggleThemeIcon } from './ToggleThemeIcon'

export const ThemeSelector = () => {
  const { t } = useTranslation('vitals')

  return (
    <Stack alignItems="center" direction="row" spacing={2}>
      <Typography fontWeight="bold" variant="body2">
        {t('theme_mode')}
      </Typography>
      <ToggleThemeIcon />
    </Stack>
  )
}
