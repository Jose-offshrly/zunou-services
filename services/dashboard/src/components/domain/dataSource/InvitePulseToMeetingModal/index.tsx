import { ErrorOutlineOutlined } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import {
  SettingsModal,
  SettingsTabIdentifier,
} from '~/components/domain/settings/SettingsModal'
import { VitalsCustomModal } from '~/components/ui/VitalsCustomModal'
import { usePulseStore } from '~/store/usePulseStore'

import AddMeetingLinkModal from '../AddMeetingLinkModal'
import { MeetingListIdentifier, MeetingManager } from './components'
import GoogleCalendarManager from './components/GoogleCalendarManager'

export const showLinkToast = (callback?: () => void) => {
  toast(
    (t) => (
      <Stack
        alignItems="center"
        direction="row"
        gap={2}
        justifyContent="center"
        sx={{ width: '100%' }}
      >
        <ErrorOutlineOutlined
          fontSize="medium"
          sx={(theme) => ({
            bgcolor: theme.palette.warning.light,
            borderRadius: 9999,
            color: 'white',
          })}
        />
        <Typography>
          Google Calendar isn&apos;t linked. Head to{' '}
          <Typography
            component="span"
            onClick={() => {
              callback?.()
              toast.dismiss(t.id)
            }}
            sx={{
              '&:hover': {
                textDecoration: 'underline',
              },
              color: 'primary.main',
              cursor: 'pointer',
            }}
          >
            Settings
          </Typography>{' '}
          to connect and start collaborating.
        </Typography>
      </Stack>
    ),
    {
      style: {
        maxWidth: '90vw',
        width: 400,
      },
    },
  )
}

interface InvitePulseToMeetingModalProps {
  isOpen: boolean
  onClose: () => void
  isVitalsMode?: boolean
  setModalOpen?: () => void
  isGoogleCalendarOnlyMode?: boolean
}

export enum InvitePulseModalMode {
  Default = 'DEFAULT',
  GoogleCalendar = 'GOOGLE_CALENDAR',
  MicrosoftTeams = 'MICROSOFT_TEAMS',
  Zoom = 'ZOOM',
}

export const InvitePulseToMeetingModal = ({
  isOpen,
  onClose,
  setModalOpen,
  isVitalsMode = false,
  isGoogleCalendarOnlyMode = false,
}: InvitePulseToMeetingModalProps) => {
  const { t } = useTranslation('vitals')
  const { pulse } = usePulseStore()

  const [isAddMeetingLinkOpen, setIsAddMeetingLinkOpen] = useState(false)
  const [isGoogleCalLinkOpen, setGoogleCalLinkOpen] = useState(false)

  const [modalMode, setModalMode] = useState<InvitePulseModalMode>(
    InvitePulseModalMode.Default,
  )

  const [initialTab, setInitialTab] = useState<MeetingListIdentifier>(
    MeetingListIdentifier.UPCOMING,
  )

  const handleOpenAddMeetingLink = () => {
    setIsAddMeetingLinkOpen(true)
  }

  const handleCloseAddMeetingLink = () => {
    setIsAddMeetingLinkOpen(false)
  }

  const handleGoogleLink = () => {
    onModalClose()
    setGoogleCalLinkOpen(true)
  }

  const onGoogleCalendarLinked = () => {
    setGoogleCalLinkOpen(false)
    setInitialTab(MeetingListIdentifier.UPCOMING)
    setModalMode(InvitePulseModalMode.GoogleCalendar)
    setModalOpen?.()
  }

  const onModalClose = () => {
    setInitialTab(MeetingListIdentifier.UPCOMING)
    setModalMode(InvitePulseModalMode.Default)
    onClose()
  }

  const getTitle = useMemo(() => {
    switch (modalMode) {
      case InvitePulseModalMode.GoogleCalendar:
        return 'Google Calendar'
      case InvitePulseModalMode.MicrosoftTeams:
        return 'Microsoft Teams'
      case InvitePulseModalMode.Zoom:
        return 'Zoom'
      default:
        return `${pulse ? pulse.name + ' |' : ''} ${t('pulse_manager')}`
    }
  }, [pulse, modalMode, t])

  return (
    <>
      <VitalsCustomModal
        height="100vh"
        isOpen={isOpen}
        maxWidth={750}
        onClose={onModalClose}
        title={getTitle}
        vitalsMode={isVitalsMode}
        withPadding={false}
      >
        <Stack height="100%" width="100%">
          {/* Scrollable area */}
          <Stack flexGrow={1} overflow="auto" pb={2}>
            {modalMode === InvitePulseModalMode.Default &&
              !isGoogleCalendarOnlyMode && (
                <MeetingManager
                  handleGoogleLink={handleGoogleLink}
                  handleOpenAddMeetingLink={handleOpenAddMeetingLink}
                  initialTab={initialTab}
                  isVitalsMode={isVitalsMode}
                  setModalMode={setModalMode}
                />
              )}
            {(modalMode === InvitePulseModalMode.GoogleCalendar ||
              isGoogleCalendarOnlyMode) && (
              <GoogleCalendarManager
                isGoogleCalendarOnlyMode={isGoogleCalendarOnlyMode}
                isVitalsMode={isVitalsMode}
                setModalMode={setModalMode}
              />
            )}
          </Stack>
        </Stack>
      </VitalsCustomModal>

      <AddMeetingLinkModal
        isOpen={isAddMeetingLinkOpen}
        isVitalsMode={isVitalsMode}
        onClose={handleCloseAddMeetingLink}
      />

      {createPortal(
        <SettingsModal
          handleClose={() => setGoogleCalLinkOpen(false)}
          initialTab={SettingsTabIdentifier['LINKED ACCOUNTS']}
          isOpen={isGoogleCalLinkOpen}
          onGoogleCalendarLink={onGoogleCalendarLinked}
        />,
        document.body,
      )}
    </>
  )
}
