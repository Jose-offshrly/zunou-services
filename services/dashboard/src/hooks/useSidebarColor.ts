import {
  OrganizationUser,
  OrganizationUserRole,
  PulseMemberRole,
} from '@zunou-graphql/core/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { useSidebarContext } from '~/context/SidebarContext'
import { usePulseStore } from '~/store/usePulseStore'
import { BackgroundColorEnum, BackgroundColorType } from '~/types/background'

export const useSidebarColor = (orgUser?: OrganizationUser) => {
  const { user } = useAuthContext()
  const { pulseId } = useParams()
  const { pulseMembership } = usePulseStore()
  const { backgroundColor, updateSidebarColor } = useSidebarContext()

  const getBackgroundColor = (
    role: string | undefined | null,
  ): BackgroundColorType =>
    role === 'guest' ||
    role === OrganizationUserRole.Guest ||
    role === PulseMemberRole.Guest
      ? BackgroundColorEnum.SECONDAY_LIGHT
      : BackgroundColorEnum.WHITE

  useEffect(() => {
    if (!orgUser) return

    if (!pulseId) {
      updateSidebarColor(BackgroundColorEnum.WHITE)
      return
    }

    const roleToUse = pulseMembership?.role ?? orgUser.role
    updateSidebarColor(getBackgroundColor(roleToUse))
  }, [orgUser, pulseId, pulseMembership, updateSidebarColor, user])

  return {
    backgroundColor,
  }
}
