import { Stack } from '@mui/material'
import { useState } from 'react'

import { TeamInviteForm } from './TeamInviteForm'
import { TeamManagement } from './TeamManagement'

interface ManageMembersTabProps {
  onBack?: () => void
}

export const ManageMembersView = ({ onBack }: ManageMembersTabProps) => {
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
