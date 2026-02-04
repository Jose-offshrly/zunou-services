import { PulseMember, PulseMemberRole } from '@zunou-graphql/core/graphql'
import { useDeletePulseMemberMutation } from '@zunou-queries/core/hooks/useDeletePulseMemberMutation'
import { useUpdatePulseMemberRoleMutation } from '@zunou-queries/core/hooks/useUpdatePulseMemberRoleMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { Routes } from '~/services/Routes'
import { usePulseStore } from '~/store/usePulseStore'

interface FilterState {
  searchQuery: string
  roleFilter: PulseMemberRole | 'ALL'
}

export const useHooks = () => {
  const { t } = useTranslation(['common', 'pulse'])
  const { pulse } = usePulseStore()
  const { pulseId } = useParams()
  const { pulseMembers, pulseMembership } = usePulseStore()
  const { organizationId } = useOrganization()
  const { user: currentUser } = useAuthContext()
  const navigate = useNavigate()

  const [hasGuestRole, setHasGuestRole] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    roleFilter: 'ALL',
    searchQuery: '',
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<PulseMember | null>(null)

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

  const handleDeleteClick = (member: PulseMember) => {
    setMemberToDelete(member)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return

    const isSelfDeletion = currentUser?.id === memberToDelete.userId

    try {
      await deleteMember({ pulseMemberId: memberToDelete.id })
      toast.success('Successfully removed member!')
      setShowDeleteModal(false)
      setMemberToDelete(null)

      if (isSelfDeletion) {
        navigate(
          pathFor({
            pathname: Routes.OrganizationBootstrap,
            query: { organizationId },
          }),
        )
      }
    } catch (error) {
      toast.error('Failed to remove member')
      console.error(error)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setMemberToDelete(null)
  }

  return {
    filteredMembers,
    filters,
    handleCancelDelete,
    handleConfirmDelete,
    handleDeleteClick,
    handleRoleChange,
    hasGuestRole,
    hasInvitePermission,
    isProcessing,
    memberToDelete,
    pulse,
    pulseMembers,
    setFilters,
    showDeleteModal,
    t,
  }
}
