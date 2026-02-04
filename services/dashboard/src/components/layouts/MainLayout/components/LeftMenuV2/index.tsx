import { useAuth0 } from '@auth0/auth0-react'
import { Stack } from '@mui/material'
import {
  OrganizationUserRole,
  PulseCategory,
} from '@zunou-graphql/core/graphql'
import { useGetOrganizationUserQuery } from '@zunou-queries/core/hooks/useGetOrganizationUserQuery'
import { useUpdatePulseOrderMutation } from '@zunou-queries/core/hooks/useUpdatePulseOrderMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ReactNode, useMemo } from 'react'
import toast from 'react-hot-toast'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useOrganization } from '~/hooks/useOrganization'
import { BackgroundColorType } from '~/types/background'

import { UserMenu } from '../UserMenu'
import { OrganizationSelector } from './OrganizationSelector'
import PersonalPulseGroup from './PersonalPulseGroup'
import PulseGroupComponent from './PulseGroup'

export enum PulseGroup {
  ASSISTANT = 'ASSISTANT',
  ONE_TO_ONE = 'ONE_TO_ONE',
  TEAM = 'TEAM',
  DIRECT_MESSAGES = 'DIRECT_MESSAGES',
}

export interface MenuLink {
  baseUrl: string
  icon: ReactNode
  label: string
  hasGuest?: boolean
  category: PulseCategory
  pulseId: string
}

interface PageLeftMenuProps {
  backgroundColor: BackgroundColorType
  isInverted?: boolean
  links: MenuLink[]
  isLoading?: boolean
  collapsed?: boolean
}

const Loader = () => {
  const renderSkeletons = (count: number) =>
    Array.from({ length: count }).map((_, i) => (
      <LoadingSkeleton
        height={40}
        key={i}
        sx={{ aspectRatio: '1' }}
        width="100%"
      />
    ))

  return (
    <Stack gap={7} width="100%">
      <Stack gap={2} width="100%">
        {renderSkeletons(1)}
      </Stack>
      <Stack gap={2} width="100%">
        {renderSkeletons(4)}
      </Stack>
      <Stack gap={2} width="100%">
        {renderSkeletons(3)}
      </Stack>
    </Stack>
  )
}

export const LeftMenuV2 = ({
  backgroundColor,
  // isInverted = false,
  links,
  isLoading = false,
  collapsed = false,
}: PageLeftMenuProps) => {
  // Hooks
  const { user: authUser, isAuthenticated } = useAuth0()
  const { user } = useAuthContext()
  const { organizationId = '' } = useOrganization()

  // Queries
  const { data: organizationUserData } = useGetOrganizationUserQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      userId: user?.id,
    },
  })

  // Mutation
  const { mutate: updatePulseOrder, isPending: isPendingUpdatePulseOrder } =
    useUpdatePulseOrderMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  // Computed values
  const currentUserRole = organizationUserData?.organizationUser?.role
  const isManager = currentUserRole === OrganizationUserRole.Owner
  // const isGuest = currentUserRole === OrganizationUserRole.Guest

  // Link categories
  const oneToOneLinks = useMemo(
    () => links.filter((link) => link.category === PulseCategory.Onetoone),
    [links],
  )
  const personalLinks = useMemo(
    () => links.filter((link) => link.category === PulseCategory.Personal),
    [links],
  )
  const teamLinks = useMemo(
    () =>
      links.filter(
        (link) =>
          link.category === PulseCategory.Team || link.category === null,
      ),
    [links],
  )

  const personalPulse = personalLinks[0]

  const handlePulseReorder = (links: MenuLink[]) => {
    updatePulseOrder(
      links.map((link, index) => ({
        order: String(index + 1),
        pulseId: link.pulseId,
      })),
      { onSuccess: () => toast.success('Pulses successfully reordered!') },
    )
  }

  return (
    <Stack
      alignItems="center"
      borderRight={1}
      gap={1}
      height="100dvh"
      justifyContent="space-between"
      p={2}
      sx={{
        backgroundColor,
        borderColor: 'divider',
        transition: 'background-color 1s ease',
      }}
    >
      <OrganizationSelector collapsed={collapsed} />

      {/* Scrollable menu area */}
      <Stack
        alignItems="center"
        flexGrow={1}
        gap={3}
        minHeight={0}
        overflow="auto"
        sx={{
          '&::-webkit-scrollbar': {
            background: 'transparent',
            width: '0px',
          },
          msOverflowStyle: 'none',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
        }}
        width="100%"
      >
        {isLoading ? (
          <Loader />
        ) : (
          <>
            {/* Zunou Assistant */}
            {personalPulse && (
              <PersonalPulseGroup collapsed={collapsed} link={personalPulse} />
            )}

            {/* 1 to 1 Section */}
            {(isManager || oneToOneLinks.length > 0) && (
              <PulseGroupComponent
                category={PulseCategory.Onetoone}
                collapsed={collapsed}
                disableReordering={isPendingUpdatePulseOrder}
                links={oneToOneLinks}
                onLinksReorder={handlePulseReorder}
                titleClassName="joyride-onboarding-tour-7"
              />
            )}

            {/* Team Section */}
            {(isManager || teamLinks.length > 0) && (
              <PulseGroupComponent
                category={PulseCategory.Team}
                collapsed={collapsed}
                disableReordering={isPendingUpdatePulseOrder}
                links={teamLinks}
                onLinksReorder={handlePulseReorder}
                titleClassName="joyride-onboarding-tour-8"
              />
            )}
          </>
        )}
      </Stack>

      {/* Bottom fixed section */}
      <Stack
        alignItems="center"
        borderTop={1}
        pt={1}
        sx={{ borderColor: 'divider' }}
        width="100%"
      >
        {isAuthenticated && authUser && (
          <UserMenu
            collapsed={collapsed}
            isManager={isManager}
            showUserDetails={true}
          />
        )}
      </Stack>
    </Stack>
  )
}
