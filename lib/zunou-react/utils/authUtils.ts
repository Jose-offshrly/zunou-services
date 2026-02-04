import { User } from '@zunou-graphql/core/graphql'
import { UserRoleType } from '@zunou-react/types/role'

const AUTH_TOKEN = 'auth_token'
const USER_ROLE = 'user_role'

interface AuthState {
  lastLoginAt: string
  token?: string
  user?: User & { role: UserRoleType | null }
}

interface PersistAuthStateParams {
  user?: User
  token?: string
  role?: UserRoleType
}

export const persistAuthState = ({ user, token }: PersistAuthStateParams) => {
  try {
    const authState = {
      lastLoginAt: new Date().toISOString(),
      token,
      user,
    }

    localStorage.setItem(AUTH_TOKEN, JSON.stringify(authState))
  } catch (error) {
    console.error('Storage error:', error)
  }
}

export const getStoredRole = (): UserRoleType | undefined => {
  const storedRole = localStorage.getItem(USER_ROLE) as UserRoleType

  return storedRole
}

export const getStoredAuth = (): AuthState | null => {
  try {
    const auth = localStorage.getItem(AUTH_TOKEN)
    return auth ? JSON.parse(auth) : null
  } catch {
    return null
  }
}

export const updatePersistedUserRole = (newRole: UserRoleType) => {
  try {
    const currentAuth = getStoredAuth()
    if (!currentAuth) return

    persistAuthState({
      ...currentAuth,
      role: newRole,
    })
  } catch (error) {
    console.error('Role update error:', error)
  }
}
export const clearAuth = () => {
  // Retain flag for when to show landing page when user logs in
  const hasTriggeredLandingPageKey = 'hasTriggeredLandingPage'
  const hasTriggeredLandingPage = localStorage.getItem(
    hasTriggeredLandingPageKey,
  )

  // Retain flag for when to start onboarding tour when user logs in
  const hasTriggeredOnboardingTourKey = 'hasTriggeredOnboardingTour'
  const hasTriggeredOnboardingTour = localStorage.getItem(
    hasTriggeredOnboardingTourKey,
  )

  localStorage.clear()

  if (hasTriggeredLandingPage !== null) {
    localStorage.setItem(hasTriggeredLandingPageKey, hasTriggeredLandingPage)
  }

  if (hasTriggeredOnboardingTour !== null) {
    localStorage.setItem(
      hasTriggeredOnboardingTourKey,
      hasTriggeredOnboardingTour,
    )
  }
}
