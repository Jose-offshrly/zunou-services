import { PulseMemberRole } from '@zunou-graphql/core/graphql'
import { useDeletePulseMemberMutation } from '@zunou-queries/core/hooks/useDeletePulseMemberMutation'
import { useUpdatePulseMemberRoleMutation } from '@zunou-queries/core/hooks/useUpdatePulseMemberRoleMutation'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'

interface FilterState {
  searchQuery: string
  roleFilter: PulseMemberRole | 'ALL'
}

export const useHooks = () => {
  const { pulseId } = useParams()
  const { pulseMembers, pulseMembership } = usePulseStore()
  const { organizationId } = useOrganization()

  const [hasGuestRole, setHasGuestRole] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    roleFilter: 'ALL',
    searchQuery: '',
  })

  const hasInvitePermission =
    pulseMembership?.role &&
    [PulseMemberRole.Admin, PulseMemberRole.Owner].includes(
      pulseMembership.role,
    )

  const filteredMembers = useMemo(() => {
    const { searchQuery, roleFilter } = filters
    const hasGuest =
      pulseMembers && pulseMembers.length > 0
        ? pulseMembers.some((member) => member.role === PulseMemberRole.Guest)
        : false
    setHasGuestRole(hasGuest)

    return pulseMembers?.filter(({ user, role }) => {
      const matchesSearch = user.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'ALL' || role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [pulseMembers, filters])

  const { mutateAsync: updateRole, isPending: isUpdatingRole } =
    useUpdatePulseMemberRoleMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    })

  const { mutateAsync: deleteMember, isPending: isDeletingMember } =
    useDeletePulseMemberMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    })

  const isProcessing = isUpdatingRole || isDeletingMember

  const handleRoleChange = useCallback(
    async (userId: string, newRole: PulseMemberRole) => {
      if (!pulseId) throw new Error('Pulse ID not found.')

      try {
        await updateRole({
          input: {
            organizationId,
            pulseId,
            role: newRole,
            userId,
          },
        })
        toast.success('Successfully updated member role!')
      } catch (error) {
        toast.error('Failed to update member role')
        console.error(error)
      }
    },
    [pulseId, updateRole],
  )

  const handleDelete = async (pulseMemberId: string) => {
    if (!pulseMemberId) throw new Error('User ID not found.')

    try {
      await deleteMember({ pulseMemberId })
      toast.success('Successfully removed member!')
    } catch (error) {
      toast.error('Failed to remove member')
      console.error(error)
    }
  }

  return {
    deleteMember,
    filteredMembers,
    filters,
    handleDelete,
    handleRoleChange,
    hasGuestRole,
    hasInvitePermission,
    isProcessing,
    pulseMembers,
    setFilters,
    updateRole,
  }
}
