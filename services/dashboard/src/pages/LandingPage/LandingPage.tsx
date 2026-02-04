import { withAuthenticationRequired } from '@auth0/auth0-react'

import Landing from '~/components/domain/landing'

function LandingPage() {
  return <Landing />
}

export default withAuthenticationRequired(LandingPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
