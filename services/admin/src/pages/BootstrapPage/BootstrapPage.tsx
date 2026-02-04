import { withAuthenticationRequired } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { CenterPageLayout } from '@zunou-react/components/layout'
import { Paragraph } from '@zunou-react/components/typography'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { hasPermission } from '@zunou-react/services/User'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Routes } from '~/services/Routes'

const BootstrapPage = () => {
  const { isLoading, user } = useAuthContext()
  const navigate = useNavigate()
  const hasAccess = hasPermission(user, 'admin:organizations')

  useEffect(() => {
    if (isLoading || !hasAccess) {
      return
    }

    navigate(
      pathFor({
        pathname: Routes.OrganizationList,
      }),
    )
  }, [isLoading, navigate])

  return (
    <CenterPageLayout sx={{ minHeight: '100vh' }}>
      {isLoading ? <CircularProgress /> : null}

      {!isLoading && !hasAccess ? (
        <Paragraph>
          You are not authorized to access this page. Contact your administrator
          for an invite.
        </Paragraph>
      ) : null}
    </CenterPageLayout>
  )
}

export default withAuthenticationRequired(BootstrapPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
