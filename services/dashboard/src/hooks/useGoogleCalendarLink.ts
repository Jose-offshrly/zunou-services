import { AuthorizationParams, useAuth0 } from '@auth0/auth0-react'
import { useGoogleCalendarRevokeMutation } from '@zunou-queries/core/hooks/useGoogleCalendarRevokeMutation'
import { useLinkGoogleCalendarMutation } from '@zunou-queries/core/hooks/useLinkGoogleCalendarMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useMeetingsContext } from '~/context/MeetingsContext'

interface UseGoogleCalendarLinkProps {
  onGoogleCalendarLink?: () => void
}

export const useGoogleCalendarLink = ({
  onGoogleCalendarLink,
}: UseGoogleCalendarLinkProps = {}) => {
  const { organizationId } = useParams<{
    pulseId: string
    organizationId: string
  }>()
  const { loginWithPopup, loginWithRedirect } = useAuth0()
  const { user } = useAuthContext()
  const {
    googleCalLinked,
    setGoogleCalLinked,
    isLoadingLinkStatus,
    error: googleCalError,
    updateLinkedStatus,
  } = useMeetingsContext()

  const [error, setError] = useState<string | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)

  const coreUrl = (import.meta.env.VITE_CORE_GRAPHQL_URL || '') as string

  const {
    mutateAsync: linkGoogleCalendar,
    isPending: isLinkGoogleCalendarPending,
  } = useLinkGoogleCalendarMutation({
    coreUrl,
  })

  const {
    mutateAsync: unlinkGoogleCalendar,
    isPending: isUnlinkingGoogleCalendarPending,
  } = useGoogleCalendarRevokeMutation({
    coreUrl,
  })

  // Detect if running in Electron or other environments where popups don't work well
  const isElectron = () => {
    // Check for Electron user agent
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('electron')) return true

    // Check for Electron-specific globals
    if (typeof window !== 'undefined') {
      // @ts-expect-error Electron exposes process and electron objects on window
      if (window.process?.type || window.electron) return true
    }

    return false
  }

  // Extract linking logic into separate function for reuse
  const completeLinking = async () => {
    const orgId =
      organizationId || sessionStorage.getItem('googleCalendarLinkOrgId')

    if (!user?.email || !orgId) {
      throw new Error('Missing user email or organization ID')
    }

    // Add a delay to ensure Auth0 tokens are properly set (especially for redirect flow)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Link Google Calendar
    const linkResult = await linkGoogleCalendar({
      email: user?.email,
      organizationId: orgId,
    })

    if (linkResult.linkGoogleCalendar.success) {
      console.log('✅ Link successful, updating context immediately')

      // Update the context immediately for immediate UI feedback
      updateLinkedStatus(true)
      setGoogleCalLinked(true)

      toast.success('Google account successfully linked.')

      // Call the callback after server confirmation
      onGoogleCalendarLink?.()
    } else {
      toast.error(
        linkResult.linkGoogleCalendar.message ?? 'An error has occured.',
      )
      throw new Error(
        linkResult.linkGoogleCalendar.message ?? 'An error has occured.',
      )
    }
  }

  // Handle redirect callback after OAuth flow (for Electron)
  useEffect(() => {
    const handleRedirectCallback = async () => {
      const pendingLink = sessionStorage.getItem('pendingGoogleCalendarLink')
      const storedOrgId = sessionStorage.getItem('googleCalendarLinkOrgId')

      if (pendingLink === 'true' && user?.email && storedOrgId) {
        console.log('🔄 Detected pending Google Calendar link after redirect')

        // Clear the flags
        sessionStorage.removeItem('pendingGoogleCalendarLink')
        sessionStorage.removeItem('googleCalendarLinkOrgId')

        setIsLinking(true)
        setError(null)

        try {
          await completeLinking()
        } catch (error) {
          console.error('❌ Failed to complete linking after redirect:', error)

          if (error instanceof Error) {
            if (error.message.includes('Missing Google OAuth tokens')) {
              setError(
                'Authentication failed. Please try again or use a different browser.',
              )
            } else if (error.message.includes('CORS')) {
              setError(
                'Network error. Please check your connection and try again.',
              )
            } else {
              setError(`Failed to link Google Calendar: ${error.message}`)
            }
          } else {
            setError('Failed to complete Google Calendar linking')
          }
        } finally {
          setIsLinking(false)
        }
      }
    }

    if (user?.email && !isLinking) {
      handleRedirectCallback()
    }
  }, [user?.email])

  const linkCalendar = async () => {
    setIsLinking(true)
    setError(null)

    try {
      const redirectUri = window.location.origin
      const authParams: AuthorizationParams = {
        access_type: 'offline',
        connection: 'google-oauth2',
        connection_scope:
          'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
        login_hint: user?.email || '',
        prompt: 'consent',
        scope: 'openid profile email offline_access',
      }

      // Electron flow - use redirect to open in system browser
      if (isElectron()) {
        console.log(
          '🖥️ Electron detected, using redirect flow to open in system browser',
        )

        // Store intent to link calendar after redirect
        sessionStorage.setItem('pendingGoogleCalendarLink', 'true')
        sessionStorage.setItem('googleCalendarLinkOrgId', organizationId || '')

        // Add redirect_uri for redirect flow
        authParams.redirect_uri = redirectUri

        // Use redirect for Electron - this will open in system browser
        await loginWithRedirect({
          appState: {
            action: 'linkGoogleCalendar',
            returnTo: window.location.pathname + window.location.search,
          },
          authorizationParams: authParams,
        })
        return // redirect will navigate away; flow resumes on return
      }

      // Original popup flow for web browsers
      await loginWithPopup({
        authorizationParams: authParams,
      })

      if (!user?.email || !organizationId) return

      // Link Google Calendar
      const linkResult = await linkGoogleCalendar({
        email: user?.email,
        organizationId,
      })

      if (linkResult.linkGoogleCalendar.success) {
        console.log('✅ Link successful, updating context immediately')

        // Update the context immediately for immediate UI feedback
        updateLinkedStatus(true)
        setGoogleCalLinked(true)

        toast.success('Google account successfully linked.')

        // Call the callback after server confirmation
        onGoogleCalendarLink?.()
      } else {
        toast.error(
          linkResult.linkGoogleCalendar.message ?? 'An error has occured.',
        )
        throw new Error(
          linkResult.linkGoogleCalendar.message ?? 'An error has occured.',
        )
      }
    } catch (error) {
      console.error('❌ Failed to link Google Calendar:', error)

      if (error instanceof Error) {
        if (error.message.includes('Missing Google OAuth tokens')) {
          setError(
            'Authentication failed. Please try again or use a different browser.',
          )
        } else if (error.message.includes('CORS')) {
          setError('Network error. Please check your connection and try again.')
        } else {
          setError(`Failed to link Google Calendar: ${error.message}`)
        }
      } else {
        setError('Failed to link Google Calendar')
      }
    } finally {
      setIsLinking(false)
    }
  }

  const unlinkCalendar = async () => {
    setIsUnlinking(true)
    setError(null)

    try {
      const { googleCalendarRevoke: response } = await unlinkGoogleCalendar()

      if (response.success) {
        // Update both the hook status and context - FIXED: set to false for unlink
        updateLinkedStatus(false)
        setGoogleCalLinked(false)

        toast.success('Google account successfully unlinked.')
      }
    } catch (error) {
      // Revert optimistic update if unlinking fails
      updateLinkedStatus(true)
      setGoogleCalLinked(true)
      setError('Failed to unlink Google Calendar')
    } finally {
      setIsUnlinking(false)
    }
  }

  const toggleLink = () => {
    return googleCalLinked ? unlinkCalendar() : linkCalendar()
  }

  const isSubmitting =
    isLinkGoogleCalendarPending ||
    isUnlinkingGoogleCalendarPending ||
    isLinking ||
    isUnlinking

  return {
    error: error || googleCalError,
    // State
    googleCalLinked,
    isLinking,
    isLoadingLinkStatus,
    isSubmitting,
    isUnlinking,

    // Actions
    linkCalendar,
    toggleLink,
    unlinkCalendar,
  }
}
