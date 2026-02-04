import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { OrganizationStatus } from '@zunou-graphql/core/graphql'
import { useGetOrganizationQuery } from '@zunou-queries/core/hooks/useGetOrganizationQuery'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useLoadingContext } from '@zunou-react/contexts/LoadingContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const OrganizationBootstrapPage = () => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { useTrackQuery } = useLoadingContext()

  const { data, error, isLoading } = useGetOrganizationQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })
  useTrackQuery(`${Routes.OrganizationBootstrap}:organization`, isLoading)

  useEffect(() => {
    if (!data) {
      return
    }

    const { organization } = data

    switch (organization.status) {
      case OrganizationStatus.Active:
        navigate(
          pathFor({
            pathname: Routes.Dashboard,
            query: { organizationId: organization.id },
          }),
        )
        break

      case OrganizationStatus.OnboardingTerms:
        navigate(
          pathFor({
            pathname: Routes.OnboardingTerms,
            query: { organizationId },
          }),
        )
        break
    }
  }, [data, navigate, organizationId])

  return (
    <ErrorHandler error={error}>
      <CenterPageLayout>
        <CircularProgress />
      </CenterPageLayout>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(OrganizationBootstrapPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
