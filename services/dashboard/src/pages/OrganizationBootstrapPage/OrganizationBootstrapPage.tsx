import { withAuthenticationRequired } from '@auth0/auth0-react'
import { Stack } from '@mui/system'
import {
  OrganizationUserRole,
  PulseCategory,
} from '@zunou-graphql/core/graphql'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
import { pathFor } from '@zunou-react/services/Routes'
import { UserRoleType } from '@zunou-react/types/role'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'

const mapOrgRoleToUserRole = (role: OrganizationUserRole): UserRoleType => {
  switch (role) {
    case OrganizationUserRole.Owner:
      return UserRoleEnum.MANAGER
    case OrganizationUserRole.User:
      return UserRoleEnum.EMPLOYEE
    case OrganizationUserRole.Guest:
    default:
      return UserRoleEnum.GUEST
  }
}

const MAX_RETRY_ATTEMPTS = 5
const RETRY_DELAY_MS = 1000

const OrganizationBootstrapPage = () => {
  const navigate = useNavigate()
  const { organizationId } = useOrganization()
  const { user, userRole, setUserRole } = useAuthContext()
  const [retryCount, setRetryCount] = useState(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    data: organizationUserData,
    error: orgUserError,
    isLoading: isOrgUserLoading,
  } = useGetOrganizationUserQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId, userId: user?.id },
  })

  const {
    data: pulsesData,
    isLoading: isPulsesLoading,
    refetch: refetchPulses,
  } = useGetPulsesQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: { organizationId },
  })

  const orgUser = organizationUserData?.organizationUser

  const assistantPulse = useMemo(
    () =>
      pulsesData?.pulses.find(
        (pulse) => pulse.category === PulseCategory.Personal,
      ) ?? null,
    [pulsesData],
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Retry fetching pulses if no personal pulse found
  useEffect(() => {
    if (isOrgUserLoading || isPulsesLoading) return
    if (assistantPulse) return // Found personal pulse, no need to retry

    // Only retry if we haven't exceeded max attempts
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      retryTimeoutRef.current = setTimeout(() => {
        console.log(
          `[OrganizationBootstrapPage] Retrying pulse fetch (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`,
        )
        refetchPulses()
        setRetryCount((prev) => prev + 1)
      }, RETRY_DELAY_MS)
    }
  }, [
    isOrgUserLoading,
    isPulsesLoading,
    assistantPulse,
    retryCount,
    refetchPulses,
  ])

  useEffect(() => {
    if (!orgUser || !user || isOrgUserLoading || isPulsesLoading) return
    if (!assistantPulse) return

    const mappedRole = mapOrgRoleToUserRole(orgUser.role)

    if (userRole !== mappedRole) {
      setUserRole(mappedRole)
    }

    navigate(
      pathFor({
        pathname: `/${mappedRole.toLowerCase()}/${Routes.PulseDetail}`,
        query: {
          organizationId,
          pulseId: assistantPulse.id,
        },
      }),
    )
  }, [
    orgUser,
    user,
    userRole,
    isOrgUserLoading,
    isPulsesLoading,
    assistantPulse,
    organizationId,
    navigate,
    setUserRole,
  ])

  // Show loading while initial load or retrying
  if (
    isOrgUserLoading ||
    isPulsesLoading ||
    (!assistantPulse && retryCount < MAX_RETRY_ATTEMPTS)
  ) {
    return (
      <Stack
        alignItems="center"
        height="100vh"
        justifyContent="center"
        width="100%"
      >
        <LoadingSpinner />
      </Stack>
    )
  }

  if (orgUserError) {
    return <ErrorHandler error={orgUserError} />
  }

  // If no personal pulse found after all retries, show error
  if (!assistantPulse && retryCount >= MAX_RETRY_ATTEMPTS) {
    return (
      <ErrorHandler
        error={
          new Error(
            'Unable to load your personal workspace. Please try refreshing the page.',
          )
        }
      />
    )
  }

  return null
}

export default withAuthenticationRequired(OrganizationBootstrapPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
