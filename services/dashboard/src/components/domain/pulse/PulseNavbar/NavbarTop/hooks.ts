import { useGetOrganizationUsersQuery } from '@zunou-queries/core/hooks/useGetOrganizationUsersQuery'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { useGetPulseQuery } from '@zunou-queries/core/hooks/useGetPulseQuery'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { usePulseStore } from '~/store/usePulseStore'

export const useHooks = ({
  onNotificationToggle,
}: {
  onNotificationToggle: () => void
}) => {
  const { t } = useTranslation()
  const { pulse, pulseMembership, pulseCategory } = usePulseStore()
  const { pulseId } = useParams()

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [isSetupOpen, setIsSetupOpen] = useState(false)
  const { organizationId } = useOrganization()
  const [isDeleteOneToOneOpen, setIsDeleteOneToOneOpen] = useState(false)

  const { isLoading: isLoadingPulse } = useGetPulseQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
      pulseId,
    },
  })

  const { data: membersData, isLoading: isLoadingPulseMembers } =
    useGetPulseMembersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        pulseId,
      },
    })

  const pulseMembers = useMemo(() => {
    return (
      membersData?.pulseMembers.data.map((member) => ({
        ...member.user,
        one_to_one: member.one_to_one,
      })) ?? []
    )
  }, [membersData])

  const { data: allOrganizationUsers } = useGetOrganizationUsersQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId,
    },
  })

  const handleCloseTeamModal = () => setIsTeamModalOpen(false)
  const handleOpenSetup = () => setIsSetupOpen(true)
  const handleOpenTeamModal = () => setIsTeamModalOpen(true)
  const handleCloseSetup = () => setIsSetupOpen(false)
  const handleNotificationToggle = () => {
    onNotificationToggle()
  }
  const handleDeleteOneToOne = () => {
    setIsDeleteOneToOneOpen(true)
  }

  const handleCloseDeleteOneToOne = () => setIsDeleteOneToOneOpen(false)

  return {
    allOrganizationUsers,
    handleCloseDeleteOneToOne,
    handleCloseSetup,
    handleCloseTeamModal,
    handleDeleteOneToOne,
    handleNotificationToggle,
    handleOpenSetup,
    handleOpenTeamModal,
    isDeleteOneToOneOpen,
    isLoadingPulse,
    isLoadingPulseMembers,
    isSetupOpen,
    isTeamModalOpen,
    pulse,
    pulseCategory,
    pulseMembers,
    pulseMembership,
    t,
  }
}
