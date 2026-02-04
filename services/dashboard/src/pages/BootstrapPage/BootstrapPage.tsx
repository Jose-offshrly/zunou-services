import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { Button } from '@zunou-react/components/form'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { hasPermission } from '@zunou-react/services/User'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import zunouLogo from '~/assets/zunou-logo.png'
import { Routes } from '~/services/Routes'
import { HAS_TRIGGERED_LANDING_PAGE_KEY } from '~/utils/localStorageKeys'

const BootstrapPage = () => {
  const navigate = useNavigate()
  const { logout: auth0Logout } = useAuth0()
  const {
    authError,
    error: authContextError,
    isLoading: authPending,
    logout,
    user,
  } = useAuthContext()
  const hasAccess = hasPermission(user, 'read:organizations')

  const { error: updateError, mutateAsync: updateMe } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const hasRedirected = useRef(false)

  const redirect = (organizationId: string) => {
    navigate(
      pathFor({
        pathname: Routes.OrganizationBootstrap,
        query: {
          organizationId,
        },
      }),
      { replace: true },
    )
  }

  const getTargetOrganizationId = (user: User): string => {
    const [firstOrgUser] = user.organizationUsers.data

    if (!firstOrgUser) {
      throw new Error('No organization found for user')
    }

    const hasLastOrgAccess =
      user.lastOrganizationId &&
      user.organizationUsers.data.some(
        ({ organizationId }) => organizationId === user.lastOrganizationId,
      )

    return hasLastOrgAccess
      ? user.lastOrganizationId!
      : firstOrgUser.organizationId
  }

  useEffect(() => {
    if (authPending || !user || !hasAccess) {
      return
    }

    // Prevent running more than once
    if (hasRedirected.current) {
      return
    }

    const handleRedirect = async () => {
      try {
        const targetOrgId = getTargetOrganizationId(user)

        if (targetOrgId !== user.lastOrganizationId) {
          await updateMe({ lastOrganizationId: targetOrgId })
        }

        // Has user visited the landing page
        const hasTriggeredLandingPage = localStorage.getItem(
          HAS_TRIGGERED_LANDING_PAGE_KEY,
        )

        // Has user completed the onboarding setup
        const onboardedSetup = user.onboarded

        hasRedirected.current = true

        // Only skip landing page if user has BOTH onboarded AND triggered landing
        // This ensures new users always see the landing page
        if (hasTriggeredLandingPage && onboardedSetup) {
          redirect(targetOrgId)
        } else {
          navigate(
            pathFor({
              pathname: Routes.Landing,
              query: {
                organizationId: targetOrgId,
              },
            }),
            { replace: true },
          )

          localStorage.setItem(HAS_TRIGGERED_LANDING_PAGE_KEY, 'true')
        }
      } catch (error) {
        console.error('Error in organization redirect:', error)
        hasRedirected.current = false // Reset on error so it can retry
      }
    }

    handleRedirect()
  }, [authPending, user, hasAccess, updateMe, navigate])

  const handleLogout = () => {
    logout()
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    })
  }

  const error = authContextError || updateError
  const noOrganizations = user?.organizationUsers?.data?.length === 0
  const isUserNotFound = authError?.includes('User not found')

  // Redirect to /no-account page when user is not found
  useEffect(() => {
    if (!authPending && isUserNotFound) {
      navigate(Routes.NoAccount, { replace: true })
    }
  }, [authPending, isUserNotFound, navigate])

  return (
    <ErrorHandler error={error}>
      <Stack
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        p={4}
        spacing={3}
      >
        {/* Logo */}
        <Box
          alt="Zunou"
          component="img"
          src={zunouLogo}
          sx={{ maxHeight: 48, mb: 2, width: 'auto' }}
        />

        {/* Show spinner only when loading and no errors */}
        {!authError && !error && !noOrganizations && hasAccess ? (
          <CircularProgress />
        ) : null}

        {/* No organizations or no access (but user exists) */}
        {!authPending &&
        !isUserNotFound &&
        (noOrganizations || (!!user && !hasAccess)) ? (
          <Stack alignItems="center" maxWidth={500} spacing={2}>
            <Typography fontWeight={700} textAlign="center" variant="h4">
              Access Denied
            </Typography>
            <Typography
              color="text.secondary"
              fontSize="1.1rem"
              textAlign="center"
            >
              You are not authorized to access this page. Contact your
              administrator for an invite.
            </Typography>
            <Button onClick={handleLogout} sx={{ mt: 2 }} variant="contained">
              Logout
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(BootstrapPage, {
  onRedirecting: () => {
    const location = useLocation()
    const isSigningOut = new URLSearchParams(location.search).has('signout')
    return <div>{isSigningOut ? 'Signing out...' : 'Signing in...'}</div>
  },
})
