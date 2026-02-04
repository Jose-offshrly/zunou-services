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
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { VitalsCustomModal } from '~/components/ui/VitalsCustomModal'
import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePresence } from '~/hooks/usePresence'
import { useTeamStore } from '~/store/useTeamStore'
import { getPresenceColor } from '~/utils/presenceUtils'

import { PulseIcon } from '../PulseNavbar/PulseIcon'
import { DirectMessage } from './components/DirectMessage'
import { PulseMembersList } from './components/PulseMembersList'

interface Props {
  handleClose: () => void
  isOpen: boolean
  pulse: Pulse | null
  pulseMembers: User[]
  isLoading: boolean
  initialSelectedMember?: User | null
  vitalsMode?: boolean
  noBackBtn?: boolean
}

export const TeamModal = ({
  handleClose,
  isOpen: isOpenProp,
  pulse,
  pulseMembers,
  isLoading,
  initialSelectedMember,
  vitalsMode = false,
  noBackBtn = false,
}: Props) => {
  const { t } = useTranslation(['common', 'pulse'])
  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'

  const { user } = useAuthContext()
  const { organizationId } = useOrganization()

  // Store state
  const {
    isOpen: isOpenStore,
    selectedMember: selectedMemberStore,
    closeModal,
  } = useTeamStore()

  // Local state for selected member
  const [selectedMember, setSelectedMember] = useState<User | null>(
    initialSelectedMember ?? selectedMemberStore ?? null,
  )

  // Sync local selectedMember with prop or store
  useEffect(() => {
    if (
      typeof initialSelectedMember !== 'undefined' &&
      initialSelectedMember !== null
    ) {
      setSelectedMember(initialSelectedMember)
    } else {
      setSelectedMember(selectedMemberStore)
    }
  }, [initialSelectedMember, selectedMemberStore])

  // Modal open state: true if either prop or store is true
  const isOpen = isOpenProp || isOpenStore

  // If in vitals mode(pulse is empty) use org's name for header
  const orgName =
    user?.organizations?.find((org) => org?.id === organizationId)?.name ?? null

  const handleMessageClick = (member: User) => {
    setSelectedMember(member)
  }

  const handleBack = () => {
    setSelectedMember(null)
  }

  const handleModalClose = () => {
    closeModal()
    handleClose()
    setSelectedMember(null)
  }
  const userIds = useMemo(() => pulseMembers.map((m) => m.id), [pulseMembers])
  const presenceMap = usePresence(userIds)

  const sortedMembers = useMemo(
    () =>
      [...pulseMembers].sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      }),
    [pulseMembers],
  )

  const renderTitle = () => {
    if (!selectedMember) {
      return pulse?.category === PulseCategory.Personal
        ? t('zunou_assistant')
        : pulse?.category !== PulseCategory.Onetoone
          ? `${pulse ? `${pulse?.name}${pulse?.name.endsWith('s') ? "'" : "'s"}` : orgName} Members (${pulseMembers.length})`
          : t('one_to_one_pulse', { ns: 'pulse' })
    }

    return (
      <Stack alignItems="center" direction="row" spacing={2}>
        {!noBackBtn && (
          <IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
            <ChevronLeft />
          </IconButton>
        )}

        <Avatar
          badgeColor={getPresenceColor(
            selectedMember
              ? presenceMap[selectedMember.id] ||
                  selectedMember.presence ||
                  UserPresence.Offline
              : UserPresence.Offline,
          )}
          isDarkMode={isDarkMode && vitalsMode}
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

  return (
    <VitalsCustomModal
      isOpen={isOpen}
      maxHeight={556}
      minHeight={556}
      onClose={handleModalClose}
      title={
        <Stack alignItems="center" direction="row" spacing={1}>
          {!selectedMember && <PulseIcon icon={pulse?.icon} />}
          <Typography fontSize={16} fontWeight={700}>
            {renderTitle()}
          </Typography>
        </Stack>
      }
      vitalsMode={vitalsMode}
      withPadding={selectedMember ? false : true}
    >
      <Stack height="100%">
        {selectedMember ? (
          <DirectMessage userId={selectedMember.id} vitalsMode={vitalsMode} />
        ) : (
          <PulseMembersList
            isLoading={isLoading}
            onMessageClick={handleMessageClick}
            pulse={pulse}
            pulseMembers={sortedMembers.map((m) => ({
              ...m,
              presence: presenceMap[m.id] || m.presence,
            }))}
            vitalsMode={vitalsMode}
          />
        )}
      </Stack>
    </VitalsCustomModal>
  )
}
