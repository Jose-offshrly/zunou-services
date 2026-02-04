import {
  ArrowBackOutlined,
  FlareOutlined,
  PersonAddAlt1Outlined,
  VideocamOutlined,
} from '@mui/icons-material'
import { Stack } from '@mui/material'
import { Button } from '@zunou-react/components/form'

import { showLinkToast } from '~/components/domain/dataSource/InvitePulseToMeetingModal'
import { SettingsTabIdentifier } from '~/components/domain/settings/SettingsModal'
import { useMeetingsContext } from '~/context/MeetingsContext'
import { usePulseStore } from '~/store/usePulseStore'
import { useUserSettingsStore } from '~/store/useUserSettingsStore'

export default function Actions() {
  const {
    googleCalLinked,
    setIsCollabModalOpen,
    setIsInvitePulseManuallyModalOpen,
    setIsBrainDumpModalOpen,
  } = useMeetingsContext()

  const { setPulseChatMode } = usePulseStore()

  const { setCurrentTab, setIsOpen } = useUserSettingsStore()

  const handleLinkGoogleCal = () => {
    setIsOpen(true)
    setCurrentTab(SettingsTabIdentifier['LINKED ACCOUNTS'])
  }

  const handleInviteCompanion = () => setIsInvitePulseManuallyModalOpen(true)

  const handleMeetingWithYourself = () => setIsBrainDumpModalOpen(true)

  const headerBtnStyling = {
    borderRadius: 9999,
    color: 'text.secondary',
    fontSize: 12,
    px: 2,
  }

  const handleStartCollab = () => {
    if (googleCalLinked) setIsCollabModalOpen(true)
    else showLinkToast(() => handleLinkGoogleCal())
  }

  return (
    <Stack alignItems="center" direction="row" gap={3} justifyContent="center">
      <Button
        onClick={() => setPulseChatMode('CHAT')}
        startIcon={<ArrowBackOutlined fontSize="small" />}
        sx={headerBtnStyling}
      >
        Return to Chat
      </Button>

      <Button
        onClick={handleMeetingWithYourself}
        startIcon={<FlareOutlined fontSize="small" />}
        sx={headerBtnStyling}
      >
        Meeting with Yourself
      </Button>

      <Button
        onClick={handleStartCollab}
        startIcon={<VideocamOutlined fontSize="small" />}
        sx={headerBtnStyling}
      >
        Start a Collab
      </Button>

      <Button
        onClick={handleInviteCompanion}
        startIcon={<PersonAddAlt1Outlined fontSize="small" />}
        sx={headerBtnStyling}
      >
        Invite a Companion
      </Button>
    </Stack>
  )
}
