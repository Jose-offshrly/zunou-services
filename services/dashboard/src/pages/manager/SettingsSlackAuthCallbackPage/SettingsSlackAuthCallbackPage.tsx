import { CircularProgress } from '@mui/material'
import { useOnboardingConfirmSlackMutation } from '@zunou-queries/core/hooks/useOnboardingConfirmSlackMutation'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { useSnackbarContext } from '@zunou-react/contexts/SnackbarContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const SettingsSlackAuthCallbackPage = () => {
  const { alertSuccess } = useSnackbarContext()
  const { isAuthenticated } = useAuthContext()
  const navigate = useNavigate()
  const { search } = useLocation()
  const { useTrackQuery } = useLoadingContext()

  const queryParams = new URLSearchParams(search)
  const code = queryParams.get('code')!
  const authError = queryParams.get('error')!
  const organizationId = queryParams.get('organizationId')!

  const { data, error, isPending, mutate } = useOnboardingConfirmSlackMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.SettingsSlackAuthCallback}:confirm`, isPending)

  useEffect(() => {
    if (!isAuthenticated || !organizationId || !code) {
      return
    }

    // Delay this a little to get time to load the token from local storage.
    setTimeout(() => {
      mutate({ code, organizationId })
    }, 1000)
  }, [code, isAuthenticated, mutate, organizationId])

  useEffect(() => {
    if (!error && data?.onboardingConfirmSlack) {
      alertSuccess('Congratulations! Your Pulse Slack team is ready to use.')
      navigate(
        pathFor({
          pathname: Routes.OrganizationBootstrap,
          query: { organizationId },
        }),
      )
    }
  }, [
    alertSuccess,
    data?.onboardingConfirmSlack,
    error,
    navigate,
    organizationId,
  ])

  useEffect(() => {
    if (authError == 'access_denied') {
      navigate(
        pathFor({
          pathname: Routes.OrganizationBootstrap,
          query: { organizationId },
        }),
      )
    }
  }, [authError, navigate, organizationId])

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout sx={{ minHeight: '100vh' }}>
        <CircularProgress />
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default SettingsSlackAuthCallbackPage
