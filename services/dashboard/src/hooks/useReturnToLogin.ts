import { useAuth0 } from '@auth0/auth0-react'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useCallback } from 'react'

export const useReturnToLogin = () => {
  const { logout: auth0Logout } = useAuth0()
  const { logout } = useAuthContext()

  const returnToLogin = useCallback(() => {
    logout()
    auth0Logout({
      logoutParams: {
        returnTo: globalThis.location.origin,
      },
    })
  }, [logout, auth0Logout])

  return { returnToLogin }
}
