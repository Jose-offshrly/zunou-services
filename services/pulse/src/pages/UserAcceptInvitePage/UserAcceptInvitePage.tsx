import { useAuth0 } from '@auth0/auth0-react'
import { CircularProgress } from '@mui/material'
import { FullPageLayout } from '@zunou-react/components/layout'
import { pathFor } from '@zunou-react/services/Routes'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const UserAcceptInvitePage = () => {
  const { loginWithRedirect } = useAuth0()
  const { inviteCode } = useParams()
  const { organizationId } = useOrganization()

  useEffect(() => {
    const returnTo = pathFor({
      pathname: Routes.Dashboard,
      query: { organizationId },
    })

    loginWithRedirect({
      appState: { inviteCode, organizationId, returnTo },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FullPageLayout sx={{ alignItems: 'center' }}>
      <CircularProgress />
    </FullPageLayout>
  )
}

export default UserAcceptInvitePage
