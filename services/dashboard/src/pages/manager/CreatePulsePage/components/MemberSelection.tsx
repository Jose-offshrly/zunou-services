import { Stack } from '@mui/material'
import {
  OrganizationUser,
  PulseGuestRole,
  PulseMember,
  User,
} from '@zunou-graphql/core/graphql'
import { useState } from 'react'

import { PeopleCard } from '../cards/PeopleCard'

interface MemberSelectionProps {
  onMembersChange: (members: PulseMember[]) => void
  selectedMemberId?: string | null
  setSelectedMemberId?: (id: string | null) => void
  setSelectedMemberRole?: (role: PulseGuestRole) => void
  isCustomPulse?: boolean
}

interface TempPulseMember {
  id: string
  userId: string
  pulseId: string
  role: PulseGuestRole
  created_at: string | null
  updated_at: string | null
  user: User
  pulse: null
  organizationUser: OrganizationUser
  job_description: string | null
  responsibilities: string[] | null
}

export const MemberSelection = ({
  onMembersChange,
  selectedMemberId,
  setSelectedMemberId,
  setSelectedMemberRole,
  isCustomPulse = false,
}: MemberSelectionProps) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [selectedMembers, setSelectedMembers] = useState<
    Map<string, OrganizationUser>
  >(new Map())
  const [memberRoles, setMemberRoles] = useState<
    Record<string, PulseGuestRole>
  >({})

  const buildPulseMembers = (
    memberIds: string[],
    membersMap: Map<string, OrganizationUser>,
    roles: Record<string, PulseGuestRole>,
  ): TempPulseMember[] => {
    return memberIds
      .map((id) => {
        const member = membersMap.get(id)
        if (!member?.user) return null

        return {
          created_at: null,
          id: id,
          job_description: null,
          organizationUser: member,
          pulse: null,
          pulseId: '',
          responsibilities: null,
          role: roles[id] || PulseGuestRole.Staff,
          updated_at: null,
          user: member.user,
          userId: id,
        } as TempPulseMember
      })
      .filter((member): member is TempPulseMember => member !== null)
  }

  const handleMemberToggle = (member: OrganizationUser) => {
    const memberId = member.user.id

    setSelectedMembers((prev) => {
      const newMap = new Map(prev)
      if (newMap.has(memberId)) {
        newMap.delete(memberId)
      } else {
        newMap.set(memberId, member)
      }
      return newMap
    })

    setSelectedMemberIds((prev) => {
      const newSelected = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]

      // Update members map and build pulse members
      const newMembersMap = new Map(selectedMembers)
      if (newMembersMap.has(memberId)) {
        newMembersMap.delete(memberId)
      } else {
        newMembersMap.set(memberId, member)
      }

      const pulseMembers = buildPulseMembers(
        newSelected,
        newMembersMap,
        memberRoles,
      )
      onMembersChange(pulseMembers as unknown as PulseMember[])
      return newSelected
    })
  }

  const handleRoleChange = (
    member: OrganizationUser,
    newRole: PulseGuestRole,
  ) => {
    const memberId = member.user.id

    // Ensure member is in the map
    setSelectedMembers((prev) => {
      const newMap = new Map(prev)
      if (!newMap.has(memberId)) {
        newMap.set(memberId, member)
      }
      return newMap
    })

    setMemberRoles((prev) => {
      const newRoles = { ...prev, [memberId]: newRole }

      // Update members map if needed
      const newMembersMap = new Map(selectedMembers)
      if (!newMembersMap.has(memberId)) {
        newMembersMap.set(memberId, member)
      }

      const pulseMembers = buildPulseMembers(
        selectedMemberIds,
        newMembersMap,
        newRoles,
      )
      onMembersChange(pulseMembers as unknown as PulseMember[])
      return newRoles
    })
  }

  return (
    <Stack
      spacing={2}
      sx={{
        height: '100%',
        width: '100%',
      }}
    >
      <PeopleCard
        isCustomPulse={isCustomPulse}
        onMemberToggle={handleMemberToggle}
        onRoleChange={handleRoleChange}
        selectedMemberId={selectedMemberId}
        selectedMemberIds={selectedMemberIds}
        setSelectedMemberId={setSelectedMemberId}
        setSelectedMemberRole={setSelectedMemberRole}
      />
    </Stack>
  )
}
