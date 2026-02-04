import { OrganizationGroup, PulseMember } from '@zunou-graphql/core/graphql'
import { useGetOrganizationGroupsQuery } from '@zunou-queries/core/hooks/useGetOrganizationGroupsQuery'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export const useOrganizationGroups = () => {
  const { pulseId } = useParams()

  const [organizationGroups, setOrganizationGroups] = useState<
    OrganizationGroup[]
  >([])
  const [unassignedOrganizationGroups, setUnassignedOrganizationGroups] =
    useState<PulseMember[]>([])
  const [hasOrganizationGroups, setHasOrganizationGroups] = useState(false)

  const {
    data: orgGroupsData,
    isLoading: isLoadingOrgGroups,
    isSuccess: isFetchingOrgGroupsSuccess,
  } = useGetOrganizationGroupsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!pulseId,
    variables: { pulseId },
  })

  useEffect(() => {
    if (
      isLoadingOrgGroups ||
      !isFetchingOrgGroupsSuccess ||
      !orgGroupsData ||
      !pulseId
    )
      return

    const groups = orgGroupsData.organizationGroups.organizationGroups
    const unassignedGroup =
      orgGroupsData.organizationGroups.unassignedPulseMembers

    // Set organization groups
    const formattedGroups = groups.map((group) => ({
      ...group,
      pulseMembers: (group as OrganizationGroup).pulseMembers || [],
    })) as OrganizationGroup[]

    setOrganizationGroups(formattedGroups)
    setUnassignedOrganizationGroups(unassignedGroup as PulseMember[])

    setHasOrganizationGroups(formattedGroups.length > 0)
  }, [pulseId, isLoadingOrgGroups, isFetchingOrgGroupsSuccess, orgGroupsData])

  return {
    hasOrganizationGroups,
    isLoadingOrgGroups,
    organizationGroups,
    setHasOrganizationGroups,
    setOrganizationGroups,
    setUnassignedOrganizationGroups,
    unassignedOrganizationGroups,
  }
}
