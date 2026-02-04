import { useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AddMeetings from './AddMeetings'
import CalendarSetup from './CalendarSetup'
import UserSetup from './UserSetup'

interface Props {
  setupCallback: () => Promise<void>
}

const TOTAL_STEPS = 3
const VALID_STEPS = new Set([1, 2, 3])

const PulseSetup = ({ setupCallback }: Props) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Get step from URL, default to 1
  const stepParam = searchParams.get('step')
  const step = stepParam ? Number.parseInt(stepParam, 10) : 1
  const currentStep = VALID_STEPS.has(step) ? step : 1

  // Navigate to a specific step by updating URL (pushes to history)
  const goToStep = useCallback(
    (nextStep: number) => {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('step', nextStep.toString())
      navigate(`?${newParams.toString()}`)
    },
    [navigate, searchParams],
  )

  // Redirect to step 1 if invalid step in URL
  useEffect(() => {
    if (stepParam && !VALID_STEPS.has(step)) {
      const newParams = new URLSearchParams(searchParams)
      newParams.set('step', '1')
      navigate(`?${newParams.toString()}`, { replace: true })
    }
  }, [stepParam, step, searchParams, navigate])

  if (currentStep === 1)
    return (
      <UserSetup
        currentStep={currentStep}
        nextCallback={() => goToStep(2)}
        totalSteps={TOTAL_STEPS}
      />
    )
  else if (currentStep === 2)
    return (
      <CalendarSetup
        currentStep={currentStep}
        nextCallback={() => goToStep(3)}
        skipCallback={() => setupCallback()}
        totalSteps={TOTAL_STEPS}
      />
    )
  else
    return (
      <AddMeetings
        currentStep={currentStep}
        nextCallback={setupCallback}
        totalSteps={TOTAL_STEPS}
      />
    )
}

export default PulseSetup
