import { AppState, Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { User as Auth0User } from '@auth0/auth0-spa-js'
import { AcceptInvitationInput, User } from '@zunou-graphql/core/graphql'
import { acceptInvitationMutation } from '@zunou-queries/core/mutations/acceptInvitationMutation'
import { signInUserMutation } from '@zunou-queries/core/mutations/signInUserMutation'
import { getMeQuery } from '@zunou-queries/core/queries/getMeQuery'
import { ApiClient } from '@zunou-react/services/ApiClient'
import { MutationError } from '@zunou-react/types/graphql'
import { UserRoleType } from '@zunou-react/types/role'
import {
  clearAuth,
  getStoredAuth,
  getStoredRole,
  persistAuthState,
} from '@zunou-react/utils/authUtils'
import { getUserRole } from '@zunou-react/utils/getUserRole'
import { ClientError } from 'graphql-request'
import type { FC, ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import toast from 'react-hot-toast'

interface SignInInput {
  inviteCode?: string
  name?: string
  picture?: string
}

interface AuthProviderWrapperProps {
  auth0Audience: string
  auth0ClientId: string
  auth0Domain: string
  coreGraphqlUrl: string
  children?: ReactNode
}

interface AuthContextProps {
  authError?: string
  error?: MutationError
  isAuthenticated: boolean
  isLoading: boolean
  user?: User
  userRole?: UserRoleType
  setUserRole: (role: UserRoleType) => void
  logout: () => void
  refetchUser: () => Promise<void>
  getToken: () => Promise<string | null>
  apiClient: ApiClient
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const useAuthContext = (): AuthContextProps => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Main wrapper component that provides Auth0Provider
export const AuthProviderWithAuth0Wrapper: FC<AuthProviderWrapperProps> = ({
  auth0Audience,
  auth0ClientId,
  auth0Domain,
  coreGraphqlUrl,
  children,
}) => {
  const [appState, setAppState] = useState<AppState | undefined>()
  const [auth0User, setAuth0User] = useState<Auth0User | undefined>()

  const onRedirectCallback = (state?: AppState, user?: Auth0User) => {
    if (state) setAppState(state)
    if (user) setAuth0User(user)
  }

  return (
    <Auth0Provider
      authorizationParams={{
        audience: auth0Audience,
        redirect_uri: window.location.origin,
        scope: 'openid profile email offline_access read:current_user',
      }}
      cacheLocation="localstorage"
      clientId={auth0ClientId}
      domain={auth0Domain}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
    >
      <AuthProvider
        appState={appState}
        auth0Audience={auth0Audience}
        auth0ClientId={auth0ClientId}
        auth0Domain={auth0Domain}
        auth0User={auth0User}
        coreGraphqlUrl={coreGraphqlUrl}
      >
        {children}
      </AuthProvider>
    </Auth0Provider>
  )
}

// Inner auth provider that uses Auth0 hooks
interface AuthProviderProps extends AuthProviderWrapperProps {
  appState?: AppState
  auth0User?: Auth0User
}

const AuthProvider: FC<AuthProviderProps> = ({
  coreGraphqlUrl,
  appState,
  auth0User,
  children,
}) => {
  const {
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    getAccessTokenSilently,
    logout: auth0Logout,
    loginWithRedirect,
  } = useAuth0()

  const [error, setError] = useState<MutationError | undefined>()
  const [authError, setAuthError] = useState<string | undefined>()
  const [user, setUser] = useState<User | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<UserRoleType | undefined>(() => {
    return getStoredRole()
  })
  const [isInitialized, setIsInitialized] = useState(false)

  const logout = useCallback(() => {
    try {
      clearAuth()
      setUser(undefined)
      setUserRole(undefined)
      setError(undefined)
      setAuthError(undefined)

      // Use Auth0's logout
      auth0Logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      })
    } catch (err) {
      console.error('Logout error:', err)
      setError(err as MutationError)
    }
  }, [auth0Logout])

  const getToken = useCallback(
    async (forceRefresh = false): Promise<string | null> => {
      if (!auth0IsAuthenticated) {
        return null
      }

      try {
        const token = await getAccessTokenSilently(
          forceRefresh ? { cacheMode: 'off' } : {},
        )

        if (!token) {
          throw new Error('No token received from getAccessTokenSilently')
        }

        return token
      } catch (error) {
        console.error('Failed to get access token:', error)

        // Check if it's a specific Auth0 error that can be retried
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        if (
          errorMessage.includes('consent_required') ||
          errorMessage.includes('interaction_required') ||
          errorMessage.includes('login_required')
        ) {
          // These errors require user interaction
          await loginWithRedirect({
            authorizationParams: {
              redirect_uri: window.location.origin,
            },
          })
        } else if (!forceRefresh) {
          // For other errors, try once more with cache disabled (but only if we haven't already)
          try {
            const retryToken = await getAccessTokenSilently({
              cacheMode: 'off',
            })
            return retryToken
          } catch (retryError) {
            console.error('Retry also failed:', retryError)
            // Only redirect as last resort
            await loginWithRedirect({
              authorizationParams: {
                redirect_uri: window.location.origin,
              },
            })
          }
        } else {
          // If we already tried force refresh and it failed, redirect to login
          await loginWithRedirect({
            authorizationParams: {
              redirect_uri: window.location.origin,
            },
          })
        }

        return null
      }
    },
    [auth0IsAuthenticated, getAccessTokenSilently, loginWithRedirect],
  )

  const refetchUser = useCallback(async () => {
    const token = await getToken()
    if (!token) {
      console.warn('Cannot refetch user: No authentication token available')
      return
    }

    try {
      setIsLoading(true)
      const { me } = await getMeQuery(coreGraphqlUrl, token)

      if (me) {
        setUser(me)
        persistAuthState({ token, user: me })

        const role = getUserRole(me)
        setUserRole(role)
      }
    } catch (err) {
      console.error('Failed to refetch user:', err)
      setError(err as MutationError)
      toast.error('Failed to refresh user data')
    } finally {
      setIsLoading(false)
    }
  }, [coreGraphqlUrl, getToken])

  const handleAuthFlow = useCallback(
    async (signInInput?: SignInInput) => {
      const token = await getToken()
      if (!token) return

      setIsLoading(true)
      // Clear any previous auth errors before attempting authentication
      setAuthError(undefined)

      try {
        // Step 1: Sign in (optional)
        if (signInInput) {
          await signInUserMutation(coreGraphqlUrl, token, signInInput)
        }

        // Step 2: Get user
        const { me } = await getMeQuery(coreGraphqlUrl, token)
        if (!me) throw new Error('Failed to fetch user.')

        setUser(me)

        // Step 3: Persist auth
        if (!getStoredAuth()) {
          persistAuthState({ token, user: me })
        }

        // Step 4: Set user role
        setUserRole(getUserRole(me))
      } catch (error) {
        const isClientError = error instanceof ClientError

        const message = isClientError
          ? error.response?.errors?.[0]?.message ?? 'Sign in failed.'
          : 'Authentication failed. Please try again.'

        // Track specific auth errors for UI handling
        setAuthError(message)
        toast.error(`Authentication failed: ${message}`)
      } finally {
        setIsLoading(false)
      }
    },
    [coreGraphqlUrl, getToken],
  )

  const handleAcceptInvite = useCallback(
    async (options: {
      acceptInviteInput: AcceptInvitationInput
      redirectUrl?: string
    }) => {
      const token = await getToken()
      if (!token) return

      const { acceptInviteInput, redirectUrl } = options

      try {
        await acceptInvitationMutation(coreGraphqlUrl, token, acceptInviteInput)

        if (
          redirectUrl &&
          redirectUrl.replace(/\?.*$/, '') !== window.location.pathname
        ) {
          window.location.href = redirectUrl
        }
      } catch (error) {
        console.error('Error accepting invitation:', error)
        toast.error('Error accepting invitation')
      }
    },
    [coreGraphqlUrl, getToken],
  )

  // Initialize auth flow when Auth0 is ready and authenticated
  useEffect(() => {
    if (auth0IsLoading || !auth0IsAuthenticated || isInitialized) {
      return
    }

    const initializeAuth = async () => {
      // Handle invite-based sign-in
      if (appState?.inviteCode && auth0User) {
        await handleAcceptInvite({
          acceptInviteInput: {
            inviteCode: appState.inviteCode,
          },
          redirectUrl: appState.returnTo,
        })
      } else {
        // Handle regular sign-in
        await handleAuthFlow({
          name: auth0User?.name,
          picture: auth0User?.picture,
        })
      }

      setIsInitialized(true)
    }
    // 100ms delay adds a small safety buffer for consistent behavior across browsers.
    // It may work without it, but it's more reliable with the delay in place.
    const timeoutId = setTimeout(initializeAuth, 100)
    return () => clearTimeout(timeoutId)
  }, [
    auth0IsLoading,
    auth0IsAuthenticated,
    isInitialized,
    appState,
    auth0User,
    handleAcceptInvite,
    handleAuthFlow,
  ])

  // Reset initialization state when Auth0 authentication changes
  useEffect(() => {
    if (!auth0IsAuthenticated) {
      setIsInitialized(false)
      setUser(undefined)
      setUserRole(undefined)
      setError(undefined)
      setAuthError(undefined)
    }
  }, [auth0IsAuthenticated])

  // Create ApiClient instance
  const apiClient = new ApiClient({
    baseUrl: coreGraphqlUrl,
    getToken,
    onAuthError: () => {
      console.warn('API authentication error, logging out...')
      logout()
    },
  })

  const contextValue: AuthContextProps = {
    apiClient,
    authError,
    error,
    getToken,
    isAuthenticated: auth0IsAuthenticated && !!user,
    isLoading: auth0IsLoading || isLoading,
    logout,
    refetchUser,
    setUserRole,
    user,
    userRole,
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}
