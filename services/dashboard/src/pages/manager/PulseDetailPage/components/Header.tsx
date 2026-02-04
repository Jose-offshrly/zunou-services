import { StreamOutlined } from '@mui/icons-material'
import { alpha, Stack, Typography } from '@mui/material'
import { PulseCategory } from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import HeaderDecorator from '~/components/ui/HeaderDecorator'
import { ShowPulseWelcomeState, usePulseStore } from '~/store/usePulseStore'

const Header = () => {
  const { t } = useTranslation('pulse')
  const { user } = useAuthContext()
  const { pulse, pulseWelcomeState } = usePulseStore()
  const { pulseId } = useParams<{ pulseId: string }>()

  const welcomeData = useMemo(() => {
    return pulseWelcomeState.find((pulse) => pulse.pulseId === pulseId) ?? null
  }, [pulseWelcomeState])

  const isFirstTimeInPulse =
    welcomeData?.state === ShowPulseWelcomeState.FirstTime

  const capsuleText = useMemo(() => {
    return `${(pulse?.name ?? 'Pulse').toUpperCase()} ${t('assistant').toUpperCase()}`
  }, [pulse?.name])

  const mainText = useMemo(() => {
    if (isFirstTimeInPulse)
      return `${t('pulse_welcome_message')} ${user?.name}!`
    return `${t('greeting')} ${user?.name ? user.name : ''}?`
  }, [user?.name])

  const getSubText = () => {
    switch (pulse?.category) {
      case PulseCategory.Personal:
        return t('personal_assistant_intro')
      case PulseCategory.Team:
        return t('pulse_assistant_intro')
      case PulseCategory.Onetoone:
        return t('one_to_one_pulse_assistant_intro')
      default:
        return t('pulse_intro')
    }
  }

  const subText = isFirstTimeInPulse
    ? t('pulse_onboarding_message')
    : `${getSubText()} ${t('pulse_description')}`

  return (
    <Stack gap={2}>
      {/* Capsule */}
      <Stack
        alignItems="center"
        bgcolor={(theme) => alpha(theme.palette.primary.light, 0.1)}
        borderRadius={9999}
        direction="row"
        gap={1}
        px={2}
        py={1}
        width="fit-content"
      >
        <StreamOutlined fontSize="small" sx={{ color: 'primary.main' }} />
        <Typography color="primary.main" fontSize="small">
          {capsuleText}
        </Typography>
      </Stack>

      <Typography variant="h5">{mainText}</Typography>

      <Typography color="text.secondary" variant="body1">
        {subText}
      </Typography>

      <HeaderDecorator color="secondary.main" />
    </Stack>
  )
}

export default Header
