import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { useOnboardingCompleteMutation } from '@zunou-queries/core/hooks/useOnboardingCompleteMutation'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const OnboardingCompletePage = () => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isPending, mutate } = useOnboardingCompleteMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.OnboardingComplete}:complete`, isPending)

  useEffect(() => {
    if (!organizationId) {
      return
    }
    mutate({ organizationId })
  }, [mutate, organizationId])

  useEffect(() => {
    if (!error && data?.onboardingComplete) {
      navigate(
        pathFor({
          pathname: Routes.DataSourceList,
          query: { organizationId },
        }),
      )
    }
  }, [data?.onboardingComplete, error, navigate, organizationId])

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout>
        <CircularProgress />
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OnboardingCompletePage, {
  onRedirecting: () => <div>Signing in...</div>,
})
