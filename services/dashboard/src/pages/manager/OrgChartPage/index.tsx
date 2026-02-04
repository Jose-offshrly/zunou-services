import { withAuthenticationRequired } from '@auth0/auth0-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import {
  PeopleOutlined,
  SvgIconComponent,
  WorkspacesOutlined,
} from '@mui/icons-material'
import {
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/system'
import {
  OrganizationGroup,
  PulseMember,
  PulseMemberRole,
} from '@zunou-graphql/core/graphql'
import { useCreateOrganizationGroupMutation } from '@zunou-queries/core/hooks/useCreateOrganizationGroupMutation'
import { useGetOrganizationGroupsQuery } from '@zunou-queries/core/hooks/useGetOrganizationGroupsQuery'
import { useUpdateOrCreateOrganizationGroupMemberMutation } from '@zunou-queries/core/hooks/useUpdateOrCreateOrganizationGroupMemberMutation'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { useOrganizationGroups } from '~/hooks/useOrganizationGroups'
import { usePulseStore } from '~/store/usePulseStore'

import CreateGroupModal from './components/CreateGroupModal'
import { Group } from './components/Group'
import { Header } from './components/Header'
import { MemberCard } from './components/MemberCard'
import { Sidebar } from './components/Sidebar'

interface GroupActionCardProps {
  title: string
  description: string
  onClick?: () => void
  disabled?: boolean
  icon?: SvgIconComponent
}

export const GroupActionCard = ({
  description,
  disabled,
  onClick,
  title,
  icon: Icon,
}: GroupActionCardProps) => {
  return (
    <Card
      sx={{
        '&:hover': {
          borderColor: 'primary.main',
          borderStyle: 'dashed',
        },
        border: 1,
        borderColor: 'divider',
        boxShadow: 0,
        transition: 'border-color 200ms ease, border-style 200ms ease',
        width: 296,
      }}
    >
      <CardActionArea
        disableRipple={true}
        disabled={disabled}
        onClick={onClick}
        sx={{
          '.MuiCard-root:hover &': {
            bgcolor: (theme) => alpha(theme.palette.primary.light, 0.1),
          },
          bgcolor: disabled ? 'grey.100' : 'white',
          height: '100%',
          transition: 'background-color 200ms ease',
        }}
      >
        <CardContent sx={{ height: '100%' }}>
          <Stack alignItems="center" gap={2} p={2}>
            <Stack
              alignItems="center"
              bgcolor="grey.100"
              borderRadius={99}
              justifyContent="center"
              p={2}
              sx={{
                '.MuiCard-root:hover &': {
                  bgcolor: theme.palette.primary.main,
                },
                transition: 'background-color 200ms ease',
              }}
            >
              {Icon ? (
                <Icon
                  fontSize="large"
                  sx={{
                    '.MuiCard-root:hover &': {
                      color: theme.palette.common.white,
                    },
                    color: 'grey.500',
                    transition: 'color 200ms ease',
                  }}
                />
              ) : (
                <PeopleOutlined
                  fontSize="large"
                  sx={{
                    '.MuiCard-root:hover &': {
                      color: theme.palette.common.white,
                    },
                    color: 'grey.500',
                    transition: 'color 200ms ease',
                  }}
                />
              )}
            </Stack>
            <Stack>
              <Typography
                color="text.secondary"
                sx={{
                  '.MuiCard-root:hover &': {
                    color: theme.palette.primary.main,
                  },
                  transition: 'color 200ms ease',
                }}
                textAlign="center"
                variant="h6"
              >
                {title}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  '.MuiCard-root:hover &': {
                    color: theme.palette.primary.main,
                  },
                  transition: 'color 200ms ease',
                }}
                textAlign="center"
                variant="subtitle2"
              >
                {description}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

interface OrgChartPulseMember extends PulseMember {
  groupId: string
  order?: number | null
}

const DEFAULT_GROUPS = [
  {
    description: 'Complete tasks, aid project goals, and assist the team.',
    name: 'Workers',
  },
  {
    description:
      'Lead teams, handle daily operations, and facilitate communication.',
    name: 'Managers',
  },
  {
    description:
      'A clear vision aligned with goals is vital for strategy, ensuring informed decisions and collaboration.',
    name: 'Leaders',
  },
]

const GroupSkeleton = () => {
  return (
    <Stack
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '30px',
        flexShrink: 0,
        gap: 2,
        height: '100%',
        maxWidth: 400,
        minWidth: 400,
        width: 400,
      }}
    >
      <Stack
        sx={{
          height: 120,
          p: 3,
          position: 'relative',
        }}
      >
        <Skeleton height={32} width="60%" />
        <Skeleton height={20} sx={{ mt: 1 }} width="80%" />
      </Stack>
      <Stack
        gap={2}
        height="80%"
        sx={{
          minHeight: '50px',
          overflowY: 'auto',
          p: 2,
        }}
      >
        {[1, 2, 3].map((i) => (
          <Skeleton height={80} key={i} variant="rounded" />
        ))}
      </Stack>
    </Stack>
  )
}

const OrgChartPage = () => {
  const { t } = useTranslation('org')
  const { pulseId } = useParams()
  const { pulseMembership } = usePulseStore()
  const { organizationId } = useOrganization()

  const isDragging = useRef(false)
  const [groupOrder, setGroupOrder] = useState<string[]>([])
  const [groupNameMap, setGroupNameMap] = useState<Record<string, string>>({})

  const [members, setMembers] = useState<OrgChartPulseMember[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [activeMember, setActiveMember] = useState<OrgChartPulseMember | null>(
    null,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const groupBgColors = [
    alpha(theme.palette.text.primary, 0.05),
    alpha(theme.palette.primary.main, 0.05),
    alpha(theme.palette.secondary.main, 0.05),
  ]

  const {
    organizationGroups: sharedOrgGroups,
    unassignedOrganizationGroups: sharedUnassignedGroups,
    isLoadingOrgGroups: isLoadingSharedGroups,
  } = useOrganizationGroups()

  const { data: orgGroupsData, isPending: isLoadingDirectGroups } =
    useGetOrganizationGroupsQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: !!pulseId,
      variables: { pulseId },
    })

  const {
    mutate: createOrganizationGroup,
    isPending: isCreatingOrganizationGroup,
  } = useCreateOrganizationGroupMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      pulseId,
    },
  })

  const { mutate: updateOrganizationMember } =
    useUpdateOrCreateOrganizationGroupMemberMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const isUpdatingGroup = useRef(false)

  const organizationGroups = useMemo(() => {
    const groups =
      sharedOrgGroups?.length > 0
        ? sharedOrgGroups
        : (orgGroupsData?.organizationGroups?.organizationGroups?.map(
            (group) => ({
              ...group,
              pulseMembers: (group as OrganizationGroup).pulseMembers || [],
            }),
          ) as OrganizationGroup[]) || []

    // Initialize group order if empty
    if (groupOrder.length === 0 && groups.length > 0) {
      setGroupOrder(groups.map((g) => g.id))
    }

    // Sort groups based on stable order
    return [...groups].sort((a, b) => {
      const aIndex = groupOrder.indexOf(a.id)
      const bIndex = groupOrder.indexOf(b.id)

      // If both are missing, maintain original order
      if (aIndex === -1 && bIndex === -1) return 0
      // If only a is missing, put it at the end
      if (aIndex === -1) return 1
      // If only b is missing, put it at the end
      if (bIndex === -1) return -1

      return aIndex - bIndex
    })
  }, [sharedOrgGroups, orgGroupsData, groupOrder])

  const unassignedOrganizationGroups = useMemo(() => {
    if (sharedUnassignedGroups?.length > 0) {
      return sharedUnassignedGroups
    }

    if (orgGroupsData?.organizationGroups?.unassignedPulseMembers) {
      return orgGroupsData.organizationGroups
        .unassignedPulseMembers as PulseMember[]
    }

    return []
  }, [sharedUnassignedGroups, orgGroupsData])

  const isLoadingOrgGroups = isLoadingSharedGroups || isLoadingDirectGroups

  useEffect(() => {
    // Skip member updates if we're currently updating a group
    if (isDragging.current || isUpdatingGroup.current) return

    const processedMembers = new Map<string, OrgChartPulseMember>()

    // Process unassigned members
    unassignedOrganizationGroups
      .filter((member): member is NonNullable<typeof member> => member !== null)
      .forEach((member, index) => {
        processedMembers.set(member.id, {
          ...(member as unknown as PulseMember),
          groupId: 'UNASSIGNED',
          order: index, // Add order based on array position
        })
      })

    // Process group members
    organizationGroups.forEach((group) => {
      const typedGroup = group as unknown as OrganizationGroup
      ;(typedGroup.pulseMembers ?? [])
        .filter(
          (member): member is NonNullable<typeof member> => member !== null,
        )
        .forEach((member, index) => {
          processedMembers.set(member.id, {
            ...(member as unknown as PulseMember),
            groupId: typedGroup.id,
            order: index, // Members are already in order, just need to add order property based on array position
          })
        })
    })

    setMembers(Array.from(processedMembers.values()))
  }, [organizationGroups, unassignedOrganizationGroups])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const userId = active.id as string
    const draggedMember = members.find((member) => member.id === userId)

    if (draggedMember) {
      isDragging.current = true
      setActiveMember(draggedMember)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !pulseId) return

    const memberId = active.id.toString()
    const targetId = over.id.toString()
    const isOverGroup = over.data.current?.type === 'group'
    const isOverMember = over.data.current?.type === 'member'

    const draggedMember = members.find((member) => member.id === memberId)
    if (!draggedMember) return

    // Create a new members array to avoid state conflicts
    const updatedMembers = [...members]
    const draggedMemberIndex = updatedMembers.findIndex(
      (m) => m.id === memberId,
    )

    if (isOverGroup) {
      const targetGroupId = targetId
      if (draggedMember.groupId === targetGroupId) return

      // Update the dragged member's group and order
      updatedMembers[draggedMemberIndex] = {
        ...draggedMember,
        groupId: targetGroupId,
        order: members.filter((m) => m.groupId === targetGroupId).length,
      }

      // Update all affected members' orders
      const targetGroupMembers = updatedMembers
        .filter((m): m is OrgChartPulseMember => m !== null)
        .filter((m) => m.groupId === targetGroupId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      targetGroupMembers.forEach((member, index) => {
        const memberIndex = updatedMembers.findIndex((m) => m.id === member.id)
        if (memberIndex !== -1) {
          updatedMembers[memberIndex] = { ...member, order: index }
        }
      })

      setMembers(updatedMembers)

      // Update backend
      updateOrganizationMember({
        orderedMemberIds: targetGroupMembers.map((m) => m.id),
        organizationGroupId:
          targetGroupId === 'UNASSIGNED' ? null : targetGroupId,
        pulseId,
      })
    } else if (isOverMember) {
      const overMember = members.find((member) => member.id === targetId)
      if (!overMember) return

      const targetGroupId = overMember.groupId || 'UNASSIGNED'

      if (draggedMember.groupId !== targetGroupId) {
        // Moving to a different group
        const targetGroupMembers = updatedMembers
          .filter((m) => m.groupId === targetGroupId && m.id !== memberId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))

        const overMemberIndex = targetGroupMembers.findIndex(
          (m) => m.id === targetId,
        )
        if (overMemberIndex === -1) return

        // Insert the dragged member at the correct position
        targetGroupMembers.splice(overMemberIndex + 1, 0, {
          ...draggedMember,
          groupId: targetGroupId,
        })

        // Update all members with new orders
        targetGroupMembers.forEach((member, index) => {
          const memberIndex = updatedMembers.findIndex(
            (m) => m.id === member.id,
          )
          if (memberIndex !== -1) {
            updatedMembers[memberIndex] = { ...member, order: index }
          }
        })

        // Update the dragged member
        updatedMembers[draggedMemberIndex] = {
          ...draggedMember,
          groupId: targetGroupId,
          order: overMemberIndex + 1,
        }

        setMembers(updatedMembers)

        updateOrganizationMember({
          orderedMemberIds: targetGroupMembers.map((m) => m.id),
          organizationGroupId:
            targetGroupId === 'UNASSIGNED' ? null : targetGroupId,
          pulseId,
        })
      } else {
        // Reordering within the same group
        const groupId = draggedMember.groupId || 'UNASSIGNED'
        const groupMembers = updatedMembers
          .filter((m) => m.groupId === groupId)
          .sort((a, b) => (a.order || 0) - (b.order || 0))

        const oldIndex = groupMembers.findIndex((m) => m.id === memberId)
        const newIndex = groupMembers.findIndex((m) => m.id === targetId)

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedMembers = arrayMove(groupMembers, oldIndex, newIndex)

          // Update all members with new orders
          reorderedMembers.forEach((member, index) => {
            const memberIndex = updatedMembers.findIndex(
              (m) => m.id === member.id,
            )
            if (memberIndex !== -1) {
              updatedMembers[memberIndex] = { ...member, order: index }
            }
          })

          setMembers(updatedMembers)

          updateOrganizationMember({
            orderedMemberIds: reorderedMembers.map((m) => m.id),
            organizationGroupId: groupId === 'UNASSIGNED' ? null : groupId,
            pulseId,
          })
        }
      }
    }

    isDragging.current = false
    setActiveMember(null)
  }

  const createDefaultGroups = () => {
    if (!pulseId || !organizationId) return

    DEFAULT_GROUPS.forEach((group) => {
      createOrganizationGroup({
        description: group.description,
        name: group.name,
        organizationId,
        pulseId,
      })
    })

    toast.success(t('create_default_group_success'))
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members

    return members.filter((member) => {
      const name = member.user.name?.toLowerCase() || ''
      const jobTitle = member.organizationUser?.jobTitle?.toLowerCase() || ''
      const jobDescription =
        member.organizationUser?.jobDescription?.toLowerCase() || ''
      const responsibilities =
        member.organizationUser?.responsibilities?.join(' ').toLowerCase() || ''

      const searchLower = searchQuery.toLowerCase()

      return (
        name.includes(searchLower) ||
        jobTitle.includes(searchLower) ||
        jobDescription.includes(searchLower) ||
        responsibilities.includes(searchLower)
      )
    })
  }, [members, searchQuery])

  const canEdit = Boolean(
    pulseMembership?.role &&
      [PulseMemberRole.Admin, PulseMemberRole.Owner].includes(
        pulseMembership.role,
      ),
  )

  const handleGroupRename = (groupId: string, newName: string) => {
    isUpdatingGroup.current = true
    setGroupNameMap((prev) => ({
      ...prev,
      [groupId]: newName,
    }))
    setTimeout(() => {
      isUpdatingGroup.current = false
    }, 100)
  }

  const getGroupDisplayName = (groupId: string, defaultName: string) => {
    return groupNameMap[groupId] || defaultName
  }

  return (
    <Stack direction="row" height="100%" overflow="hidden" width="100%">
      <DndContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <Sidebar
          canEdit={canEdit}
          isExpanded={isExpanded}
          isSidebarExpanded={isSidebarExpanded}
          members={filteredMembers.filter(
            (member) => member.groupId === 'UNASSIGNED',
          )}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />
        <Stack
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            p: 2,
            width: '100%',
          }}
        >
          <Header
            canEdit={canEdit}
            isExpanded={isExpanded}
            onCreateClick={() => setIsCreateOpen(true)}
            onSearchChange={handleSearchChange}
            searchQuery={searchQuery}
            setIsExpanded={setIsExpanded}
          />

          {isLoadingOrgGroups || isCreatingOrganizationGroup ? (
            <Stack
              direction="row"
              gap={2}
              p={2}
              sx={{
                alignItems: 'flex-start',
                flexGrow: 1,
                justifyContent: 'flex-start',
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
              }}
            >
              {[1, 2, 3].map((i) => (
                <GroupSkeleton key={i} />
              ))}
            </Stack>
          ) : organizationGroups.length > 0 ? (
            <Stack
              direction="row"
              gap={2}
              p={2}
              sx={{
                alignItems: 'flex-start',
                flexGrow: 1,
                justifyContent: 'flex-start',
                overflowX: 'auto',
                overflowY: 'hidden',
                width: '100%',
              }}
            >
              {organizationGroups.map((group, index) => {
                const typedGroup = group as unknown as OrganizationGroup
                const bgColor = groupBgColors[index % groupBgColors.length]
                const groupMembers = filteredMembers
                  .filter((member) => member.groupId === typedGroup.id)
                  .sort((a, b) => {
                    if (
                      a.order !== undefined &&
                      a.order !== null &&
                      b.order !== undefined &&
                      b.order !== null
                    ) {
                      return a.order - b.order
                    }
                    return 0
                  })

                console.log(group.name)

                return (
                  <Group
                    backgroundColor={bgColor}
                    canEdit={canEdit}
                    description={typedGroup.description ?? ''}
                    id={typedGroup.id}
                    isExpanded={isExpanded}
                    key={typedGroup.id}
                    members={groupMembers}
                    onRename={(newName) =>
                      handleGroupRename(typedGroup.id, newName)
                    }
                    title={getGroupDisplayName(typedGroup.id, typedGroup.name)}
                  />
                )
              })}
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              gap={2}
              height="100%"
              justifyContent="center"
              width="100%"
            >
              {canEdit ? (
                <>
                  <Stack direction="row" gap={2}>
                    <GroupActionCard
                      description={t('default_group_action_description', {
                        ns: 'org',
                      })}
                      disabled={!canEdit || isCreatingOrganizationGroup}
                      onClick={createDefaultGroups}
                      title={t('build_your_team')}
                    />
                    <GroupActionCard
                      description={t('add_custom_group', { ns: 'org' })}
                      icon={WorkspacesOutlined}
                      onClick={() => setIsCreateOpen(true)}
                      title={t('start_from_scratch')}
                    />
                  </Stack>
                </>
              ) : (
                <>
                  <Typography variant="h6">
                    {t('no_groups_found')}. {t('only')}{' '}
                    <span
                      style={{
                        color: theme.palette.primary.main,
                        fontWeight: 'bold',
                      }}
                    >
                      {t('admins_and_owners')}
                    </span>{' '}
                    {t('can_create_groups')}.
                  </Typography>
                  <Typography variant="body2">
                    {t('group_creation_prompt')}.
                  </Typography>
                </>
              )}
            </Stack>
          )}

          <DragOverlay
            dropAnimation={{
              duration: 300,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
            zIndex={1200}
          >
            {activeMember ? (
              <MemberCard canEdit={canEdit} member={activeMember} />
            ) : null}
          </DragOverlay>
        </Stack>
      </DndContext>

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </Stack>
  )
}

export default withAuthenticationRequired(OrgChartPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
