import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { useUpdateMeMutation } from '@zunou-queries/core/hooks/useUpdateMeMutation'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { Paragraph } from '@zunou-react/components/typography'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const BootstrapPage = () => {
  const navigate = useNavigate()
  const { error: authError, isLoading: authPending, user } = useAuthContext()
  const { loading: queriesPending, useTrackQuery } = useLoadingContext()

  const {
    error: updateError,
    isPending,
    mutateAsync,
  } = useUpdateMeMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })
  useTrackQuery(`${Routes.Bootstrap}:updateUser`, isPending)

  const loading = authPending || queriesPending

  const redirect = useCallback(
    (organizationId: string) => {
      navigate(
        pathFor({
          pathname: Routes.OrganizationBootstrap,
          query: {
            organizationId,
          },
        }),
      )
    },
    [navigate],
  )

  useEffect(() => {
    const perform = async () => {
      if (loading || !user) {
        return
      }

      // Start tracking only if mutate is going to be called
      if (
        user.lastOrganizationId &&
        user.organizationUsers.data.find(
          ({ organizationId }) => organizationId === user.lastOrganizationId,
        )
      ) {
        redirect(user.lastOrganizationId)
      } else if (user.organizationUsers.data[0]?.organizationId) {
        const lastOrganizationId = user.organizationUsers.data[0].organizationId
        await mutateAsync({ lastOrganizationId })
        redirect(lastOrganizationId)
      } else {
        // Stop tracking if no mutation occurs
        useTrackQuery(`${Routes.Bootstrap}:updateUser`, false)
      }
    }
    perform().catch((err) => {
      console.error(err)
      // Stop tracking on error
      useTrackQuery(`${Routes.Bootstrap}:updateUser`, false)
    })
  }, [loading, mutateAsync, redirect, user, useTrackQuery])

  const error = authError || updateError
  const noOrganizations = user?.organizationUsers?.data?.length === 0

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout sx={{ minHeight: '100vh' }}>
        {error || noOrganizations ? null : <CircularProgress />}

        {noOrganizations ? (
          <Paragraph>
            You do not have access to Zunou. Contact your administrator for an
            invite.
          </Paragraph>
        ) : null}
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(BootstrapPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
