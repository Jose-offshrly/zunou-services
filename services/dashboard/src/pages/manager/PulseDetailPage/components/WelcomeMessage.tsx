import { Stack } from '@mui/material'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { ShowPulseWelcomeState, usePulseStore } from '~/store/usePulseStore'

import ActivitiesOverview from './ActivitiesOverview'
import Header from './Header'
import QuickActions from './QuickActions'
import Return from './Return'

interface WelcomeMessageProps {
  onReturn: () => void
}

const WelcomeMessage = ({ onReturn }: WelcomeMessageProps) => {
  const { pulseId } = useParams<{ pulseId: string }>()
  const { pulseWelcomeState } = usePulseStore()

  const welcomeData = useMemo(() => {
    return pulseWelcomeState.find((pulse) => pulse.pulseId === pulseId) ?? null
  }, [pulseWelcomeState])

  const isFirstTimeInPulse =
    welcomeData?.state === ShowPulseWelcomeState.FirstTime

  return (
    <Stack gap={2} py={5}>
      <Header />

      {!isFirstTimeInPulse && <ActivitiesOverview />}

      <QuickActions onReturn={onReturn} />

      {!isFirstTimeInPulse && <Return onReturn={onReturn} />}
    </Stack>
  )
}

export default WelcomeMessage
