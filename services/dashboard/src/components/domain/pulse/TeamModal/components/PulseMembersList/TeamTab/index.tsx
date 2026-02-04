import { Stack } from '@mui/material'
import { useState } from 'react'

import { TeamInviteForm } from './TeamInviteForm'
import { TeamManagement } from './TeamManagement'

interface MembersTabProps {
  onBack?: () => void
}

export const MembersTab = ({ onBack }: MembersTabProps) => {
  const [modalView, setModalView] = useState<'invite' | 'manage'>('manage')

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      setModalView('manage')
    }
  }

  return (
    <Stack spacing={2}>
      {modalView === 'manage' ? (
        <TeamManagement
          onBack={handleBack}
          onInvite={() => setModalView('invite')}
        />
      ) : (
        <TeamInviteForm onBackClick={() => setModalView('manage')} />
      )}
    </Stack>
  )
}
