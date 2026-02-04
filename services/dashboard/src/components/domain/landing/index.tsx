import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'

import DownloadLinks from './DownloadLinks'
import PulseSetup from './PulseSetup'

export type LandingPageMode = 'PulseSetup' | 'Links'

const Landing = () => {
  const { user, refetchUser } = useAuthContext()
  const { organizationId } = useOrganization()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { mutateAsync: updateMe } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  // Get mode from URL, default to 'PulseSetup'
  const modeParam = searchParams.get('mode')
  const mode: LandingPageMode = modeParam === 'welcome' ? 'Links' : 'PulseSetup'

  const isOnboarded = user?.onboarded

  const setupFinishHandler = async () => {
    // update onboarded status
    await updateMe({ lastOrganizationId: organizationId, onboarded: true })

    // fetch latest user
    await refetchUser()

    // Navigate to welcome mode (pushes to history so back button works)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('step') // Remove step param when going to welcome
    newParams.set('mode', 'welcome')
    navigate(`?${newParams.toString()}`)
  }

  if (mode === 'Links' || isOnboarded) {
    return <DownloadLinks />
  }

  return <PulseSetup setupCallback={setupFinishHandler} />
}

export default Landing
