import { ChevronLeft } from '@mui/icons-material'
import { IconButton, Stack, Typography } from '@mui/material'
import {
  Pulse,
  PulseCategory,
  User,
  UserPresence,
} from '@zunou-graphql/core/graphql'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomModal } from '~/components/ui/CustomModal'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useAgentContext } from '~/context/AgentContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePresence } from '~/hooks/usePresence'
import { useTeamStore } from '~/store/useTeamStore'
import { getPresenceColor } from '~/utils/presenceUtils'

import { DirectMessage } from './components/DirectMessage/DirectMessage'
import { PulseManagement } from './components/PulseManagement'

interface Props {
  handleClose: () => void
  isOpen: boolean
  pulse: Pulse | null
  members: User[]
  vitalsMode?: boolean
  noBackBtn?: boolean
}

export const MembersAndAgentsModal = ({
  handleClose,
  isOpen,
  pulse,
  members,
}: Props) => {
  const { t } = useTranslation(['common', 'pulse'])
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { selectedMember, setSelectedMember, closeModal } = useTeamStore()
  const {
    addAgent,
    loading,
    selectedAgent,
    setAddAgent,
    setAgentDetailId,
    setSelectedAgent,
  } = useAgentContext()

  const orgName =
    user?.organizations?.find((org) => org?.id === organizationId)?.name ?? null

  const userIds = useMemo(() => members.map((m) => m.id), [members])
  const presenceMap = usePresence(userIds)

  const handleMessageClick = (member: User) => setSelectedMember(member)
  const handleBack = () => setSelectedMember(null)
  const handleModalClose = () => {
    closeModal()
    handleClose()
    setSelectedMember(null)
    setSelectedAgent(null)
    setAgentDetailId(null)
    setAddAgent(null)
  }

  const renderTitle = () => {
    if (loading) {
      return <LoadingSkeleton height={32} width={200} />
    }

    if (selectedAgent) {
      return (
        <Typography fontWeight="bold" variant="h6">
          {selectedAgent.name}
        </Typography>
      )
    }

    if (addAgent) {
      return (
        <Typography fontWeight="bold" variant="h6">
          {addAgent.name}
        </Typography>
      )
    }

    if (selectedMember) {
      return (
        <Stack alignItems="center" direction="row" spacing={2}>
          <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
            <ChevronLeft />
          </IconButton>
          <Avatar
            badgeColor={getPresenceColor(
              selectedMember
                ? presenceMap[selectedMember.id] ||
                    selectedMember.presence ||
                    UserPresence.Offline
                : UserPresence.Offline,
            )}
            placeholder={selectedMember.name}
            showBadge={true}
            src={selectedMember.gravatar}
            variant="rounded"
          />
          <Stack alignItems="flex-start" justifyContent="flex-start">
            <Typography>{selectedMember.name}</Typography>
            <Typography color="text.secondary" variant="body2">
              {selectedMember &&
              (presenceMap[selectedMember.id] || selectedMember.presence)
                ? (presenceMap[selectedMember.id] ||
                    selectedMember.presence)[0].toUpperCase() +
                  (
                    presenceMap[selectedMember.id] || selectedMember.presence
                  )?.slice(1)
                : t('offline')}
            </Typography>
          </Stack>
        </Stack>
      )
    }

    return pulse?.category === PulseCategory.Personal
      ? t('zunou_assistant')
      : pulse?.category !== PulseCategory.Onetoone
        ? `${pulse ? `${pulse?.name}${pulse?.name.endsWith('s') ? "'" : "'s"}` : orgName} ${t('members')} (${members.length})`
        : t('one_to_one_pulse', { ns: 'pulse' })
  }

  const renderSubheader = () => {
    if (loading) return null
    if (selectedAgent) return selectedAgent.description
    return undefined
  }

  return (
    <CustomModal
      isOpen={isOpen}
      maxHeight={640}
      minHeight={640}
      onClose={handleModalClose}
      subheader={renderSubheader()}
      title={renderTitle()}
    >
      <Stack height="100%">
        {selectedMember ? (
          <DirectMessage userId={selectedMember.id} />
        ) : (
          <PulseManagement
            members={members}
            onMessageClick={handleMessageClick}
          />
        )}
      </Stack>
    </CustomModal>
  )
}
