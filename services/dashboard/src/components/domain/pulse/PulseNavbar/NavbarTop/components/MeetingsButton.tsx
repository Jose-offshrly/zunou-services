import {
  GraphicEqOutlined,
  HeadphonesOutlined,
  KeyboardArrowDown,
  SmartToyOutlined,
  StopCircleOutlined,
} from '@mui/icons-material'
import {
  alpha,
  ButtonGroup,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import {
  MeetingSessionStatus,
  MeetingType,
  Origin,
} from '@zunou-graphql/core/graphql'
import { useGetCollabsQuery } from '@zunou-queries/core/hooks/useGetCollabsQuery'
import { useUpdateMeetingSessionStatus } from '@zunou-queries/core/hooks/useUpdateMeetingSessionStatus'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { showLinkToast } from '~/components/domain/dataSource/InvitePulseToMeetingModal'
import {
  SettingsModal,
  SettingsTabIdentifier,
} from '~/components/domain/settings/SettingsModal'
import { useMeetingsContext } from '~/context/MeetingsContext'
import { useOrganization } from '~/hooks/useOrganization'

import { TeamCollabModal } from '../../../TeamCollabModal'

interface MeetingsButtonProps {
  isMeetingOngoing?: boolean
  onMeetingsClick?: () => void
  onInvitePulse?: () => void
}

export default function MeetingsButton({
  isMeetingOngoing = false,
  onMeetingsClick,
  onInvitePulse,
}: MeetingsButtonProps) {
  const { t } = useTranslation('pulse')
  const {
    activeCollab,
    googleCalLinked,
    isLoadingLinkStatus,
    setActiveCollab,
    isCollabModalOpen,
    setIsCollabModalOpen,
  } = useMeetingsContext()
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const queryClient = useQueryClient()

  const [isGoogleCalLinkOpen, setGoogleCalLinkOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const isDropdownOpen = Boolean(anchorEl)

  const { data: collabsData, isLoading: isCollabsLoading } = useGetCollabsQuery(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        default: true, // only return collabs that the user is part of and active & paused meetings
        organizationId,
        origin: Origin.Pulse,
        pulseId,
      },
    },
  )

  const updateMeetingStatus = useUpdateMeetingSessionStatus()

  useEffect(() => {
    setActiveCollab(
      collabsData?.collabs.find(
        (collab) =>
          collab.userId === user?.id &&
          collab.meeting_type !== MeetingType.BrainDump,
      ) ?? null,
    )
  }, [collabsData, isCollabsLoading, user])

  const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleInvitePulse = () => {
    onInvitePulse?.()
    handleClose()
  }

  const handleCollab = () => {
    if (activeCollab) {
      handleEndCollab()
    } else handleStartCollab()

    handleClose()
  }

  const handleStartCollab = useCallback(() => {
    if (googleCalLinked) setIsCollabModalOpen(true)
    else showLinkToast(() => setGoogleCalLinkOpen(true))
  }, [googleCalLinked, isLoadingLinkStatus])

  const handleEndCollab = async () => {
    if (!pulseId) return

    try {
      if (!activeCollab) {
        toast.error(t('no_ongoing_collab'))
        return
      }

      await updateMeetingStatus.mutateAsync({
        id: activeCollab.id,
        status: MeetingSessionStatus.Stopped,
      })

      // Invalidate queries after state updates
      queryClient.invalidateQueries({
        queryKey: ['meetingSessions', organizationId, pulseId],
      })
      queryClient.invalidateQueries({
        queryKey: ['collabs', organizationId, pulseId],
      })

      toast.success(t('collab_ended'))
    } catch {
      toast.error('Failed to end collaboration. Please try again.')
    }
  }

  const onGoogleCalendarLink = () => {
    setGoogleCalLinkOpen(false)
    setIsCollabModalOpen(true)
  }

  const activeStyles = {
    backgroundColor: isMeetingOngoing ? 'common.yellow' : 'transparent',
    borderColor: isMeetingOngoing
      ? alpha(theme.palette.common.lime, 0.2)
      : alpha(theme.palette.text.primary, 0.2),
    color: isMeetingOngoing ? 'common.lime' : 'text.primary',
  }

  const hoverStyles = {
    '&:hover': {
      backgroundColor: isMeetingOngoing
        ? alpha(theme.palette.common.lime, 1)
        : 'primary.main',
      border: 'none',
      color: 'white',
    },
  }

  return (
    <>
      <ButtonGroup
        className="joyride-onboarding-tour-9"
        sx={{
          border: `1px solid ${
            isMeetingOngoing
              ? alpha(theme.palette.common.lime, 0.2)
              : alpha(theme.palette.text.primary, 0.2)
          }`,
          borderRadius: 20,
        }}
        variant="outlined"
      >
        {/* Main Meetings Button */}
        <Button
          onClick={onMeetingsClick}
          startIcon={<GraphicEqOutlined />}
          sx={{
            ...activeStyles,
            ...hoverStyles,
            border: 'none',
            borderRadius: '20px 0 0 20px',
            fontSize: '14px',
            textTransform: 'none',
          }}
        >
          Meetings
        </Button>

        {/* Divider */}
        <Divider
          orientation="vertical"
          sx={{
            alignSelf: 'center',
            backgroundColor: isMeetingOngoing
              ? alpha(theme.palette.common.lime, 0.3)
              : alpha(theme.palette.text.primary, 0.2),
            height: '24px',
            margin: 0,
          }}
        />

        {/* Dropdown Arrow Button */}
        <Button
          onClick={handleDropdownClick}
          sx={{
            ...activeStyles,
            ...hoverStyles,
            border: 'none',
            borderRadius: '0 20px 20px 0',
            minWidth: 'auto',
          }}
        >
          <KeyboardArrowDown
            sx={{
              fontSize: '20px',
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          />
        </Button>
      </ButtonGroup>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        onClose={handleClose}
        open={isDropdownOpen}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 2,
            minWidth: 200,
          },
          mt: 1,
        }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
      >
        <MenuItem onClick={handleInvitePulse}>
          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            justifyContent="start"
          >
            <SmartToyOutlined fontSize="small" />
            <Typography variant="body2">Invite Pulse To A Meeting</Typography>
          </Stack>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        {activeCollab ? (
          <Stack sx={{ p: 1 }}>
            <Button
              fullWidth={true}
              onClick={handleCollab}
              startIcon={<StopCircleOutlined />}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.8),
                  color: 'white',
                },
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: 'error.main',
                textTransform: 'none',
              }}
              variant="contained"
            >
              End Collab
            </Button>
          </Stack>
        ) : (
          <MenuItem onClick={handleCollab}>
            <Stack
              alignItems="center"
              direction="row"
              gap={1}
              justifyContent="start"
            >
              <HeadphonesOutlined fontSize="small" />
              <Typography variant="body2">Start a Collab</Typography>
            </Stack>
          </MenuItem>
        )}
      </Menu>

      <TeamCollabModal
        handleClose={() => setIsCollabModalOpen(false)}
        isOpen={isCollabModalOpen && googleCalLinked}
      />

      <SettingsModal
        handleClose={() => setGoogleCalLinkOpen(false)}
        initialTab={SettingsTabIdentifier['LINKED ACCOUNTS']}
        isOpen={isGoogleCalLinkOpen}
        onGoogleCalendarLink={onGoogleCalendarLink}
      />
    </>
  )
}
