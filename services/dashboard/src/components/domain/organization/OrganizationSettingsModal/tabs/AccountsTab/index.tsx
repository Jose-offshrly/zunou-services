import { Stack } from '@mui/material'
import { useState } from 'react'

import { MemberInviteForm } from './MemberInviteForm'
import { MemberManagement } from './MemberManagement'

export const AccountsTab = ({ onUserDemote }: { onUserDemote: () => void }) => {
  const [modalView, setModalView] = useState<'invite' | 'manage'>('manage')

  return (
    <Stack spacing={2}>
      {modalView === 'manage' ? (
        <MemberManagement
          onInvite={() => setModalView('invite')}
          onUserDemote={onUserDemote}
        />
      ) : (
        <MemberInviteForm onBackClick={() => setModalView('manage')} />
      )}
    </Stack>
  )
}
