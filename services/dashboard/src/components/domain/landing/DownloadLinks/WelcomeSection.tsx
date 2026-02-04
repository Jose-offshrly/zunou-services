import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'

import LandingButton from '../LandingButton'

const WelcomeSection = ({
  name,
  isLoading,
  onContinue,
}: {
  name: string
  isLoading: boolean
  onContinue: () => void
}) => {
  const { t } = useTranslation(['onboarding'])

  return (
    <Stack alignItems="start" gap={2} width={{ lg: '40%', md: '100%%' }}>
      <Stack direction={{ lg: 'column', md: 'row' }} gap={{ lg: 0, md: 2 }}>
        <Typography fontWeight={600} variant="h3">
          {t('welcome', { ns: 'onboarding' })}
        </Typography>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Typography color="primary.main" fontWeight={600} variant="h3">
            {name}
          </Typography>
        )}
      </Stack>
      <Typography>{t('letsGetYouStarted', { ns: 'onboarding' })}</Typography>

      <LandingButton onClick={onContinue} size="large" variant="contained">
        {t('continueToWebApp', { ns: 'onboarding' })}
      </LandingButton>
    </Stack>
  )
}

export default WelcomeSection
