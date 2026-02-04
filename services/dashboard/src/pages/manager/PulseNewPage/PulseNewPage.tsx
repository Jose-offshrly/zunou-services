import { withAuthenticationRequired } from '@auth0/auth0-react'
import { WebAssetOff } from '@mui/icons-material'
import { Typography, useMediaQuery } from '@mui/material'
import { Stack } from '@mui/system'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import { PulseTemplateGrid } from '~/components/domain/pulse/PulseTemplateGrid/PulseTemplateGrid'
import HeaderDecorator from '~/components/ui/HeaderDecorator'
import { BackgroundColorEnum } from '~/types/background'

import { useHooks } from './hooks'

const PulseNewPage = () => {
  const { t } = useTranslation('pulse')
  const { handleCreatePulse, masterPulses, loading } = useHooks()
  const { userRole } = useAuthContext()
  const isManager = userRole === UserRoleEnum.MANAGER
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  const getRoleColor = () => {
    return userRole === UserRoleEnum.GUEST
      ? BackgroundColorEnum.SECONDARY
      : BackgroundColorEnum.WHITE
  }

  const roleColor = getRoleColor()

  if (loading) {
    return null
  }

  return (
    <Stack
      justifyContent={isSmallScreen ? 'flex-start' : 'center'}
      minHeight="100vh"
      spacing={8}
      sx={{
        marginTop: isSmallScreen ? 10 : 0,
      }}
    >
      {isManager ? (
        <>
          <Stack alignItems="center" justifyContent="center" spacing={3}>
            <Typography fontWeight="medium" textAlign="center" variant="h4">
              {t('pulse_creation_prompt')}
            </Typography>
            <HeaderDecorator />
          </Stack>
          <PulseTemplateGrid
            createPulse={handleCreatePulse}
            templates={masterPulses}
          />
        </>
      ) : (
        <Stack alignItems="center" justifyContent="center" spacing={2}>
          <Stack
            alignItems="center"
            bgcolor={roleColor}
            borderRadius="50%"
            justifyContent="center"
            padding={3}
          >
            <WebAssetOff sx={{ color: 'white', fontSize: 100 }} />
          </Stack>
          <Typography fontWeight="medium" textAlign="center" variant="h4">
            {t('heads_up')}
            <span style={{ color: roleColor }}>{t('access_needed')}</span>
          </Typography>
          <Typography fontSize={14} textAlign="center" width="30%">
            {t('guest_no_access_message', { ns: 'pulse' })}
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}

export default withAuthenticationRequired(PulseNewPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
