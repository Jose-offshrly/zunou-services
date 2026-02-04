import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export const AgentsList = () => {
  const { t } = useTranslation('agent')
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography color="text.secondary">{t('no_agents')}</Typography>
    </Box>
  )
}
