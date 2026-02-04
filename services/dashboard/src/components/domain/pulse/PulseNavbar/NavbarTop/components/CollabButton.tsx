import {
  HeadphonesOutlined,
  HeadsetOutlined,
  StopCircleOutlined,
} from '@mui/icons-material'
import { alpha, darken } from '@mui/system'
import { useQueryClient } from '@tanstack/react-query'
import {
  MeetingSessionStatus,
  Origin,
  PulseCategory,
  PulseMemberRole,
} from '@zunou-graphql/core/graphql'
import { useGetCollabsQuery } from '@zunou-queries/core/hooks/useGetCollabsQuery'
import { useUpdateMeetingSessionStatus } from '@zunou-queries/core/hooks/useUpdateMeetingSessionStatus'
import { Button } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { UserRoleEnum } from '@zunou-react/enums/roleEnums'
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
import { usePulseStore } from '~/store/usePulseStore'

import { TeamCollabModal } from '../../../TeamCollabModal'
import { NavButton } from '../../NavButton'

export enum CollabButtonVariant {
  NavBar = 'NAV_BAR',
  PulseChat = 'PULSE_CHAT',
}

interface CollabButtonProps {
  variant?: CollabButtonVariant
}

const CollabButton = ({
  variant = CollabButtonVariant.NavBar,
}: CollabButtonProps) => {
  const { t } = useTranslation('pulse')
  const { activeCollab, googleCalLinked, isLoadingLinkStatus } =
    useMeetingsContext()
  const { user, userRole } = useAuthContext()
  const { pulseMembership, pulseCategory } = usePulseStore()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()
  const queryClient = useQueryClient()
  const { setActiveCollab } = useMeetingsContext()

  const isGuest = userRole === UserRoleEnum.GUEST

  const [isCollabOpen, setIsCollabOpen] = useState(false)
  const [isGoogleCalLinkOpen, setGoogleCalLinkOpen] = useState(false)

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

  useEffect(() => {
    setActiveCollab(
      collabsData?.collabs.find((collab) => collab.userId === user?.id) ?? null,
    )
  }, [collabsData, isCollabsLoading, user])

  const hasCollabPermission =
    pulseMembership?.role &&
    [PulseMemberRole.Admin, PulseMemberRole.Owner].includes(
      pulseMembership?.role,
    )

  const updateMeetingStatus = useUpdateMeetingSessionStatus()

  const handleStartCollab = useCallback(() => {
    if (googleCalLinked) setIsCollabOpen(true)
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
    setIsCollabOpen(true)
  }

  if (isGuest) return null

  return (
    <>
      {variant === CollabButtonVariant.NavBar ? (
        <NavButton
          customSx={{
            bgcolor: (theme) =>
              activeCollab
                ? alpha(theme.palette.error.main, 0.1)
                : 'transparent',
            color: (theme) =>
              activeCollab ? theme.palette.error.main : 'text.primary',
            ...(activeCollab && {
              '&:not(.Mui-disabled):hover': {
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                borderColor: (theme) => alpha(theme.palette.error.main, 0.1),
                color: (theme) => theme.palette.error.main,
              },
            }),
          }}
          disabled={!hasCollabPermission}
          label={
            activeCollab
              ? t('end')
              : pulseCategory === PulseCategory.Onetoone
                ? t('start_collab')
                : null
          }
          loading={isLoadingLinkStatus}
          onClick={activeCollab ? handleEndCollab : handleStartCollab}
          startIcon={
            activeCollab ? (
              <StopCircleOutlined sx={{ color: 'error.main' }} />
            ) : (
              <HeadphonesOutlined />
            )
          }
        />
      ) : (
        <Button
          disabled={Boolean(activeCollab)}
          onClick={handleStartCollab}
          startIcon={<HeadsetOutlined />}
          sx={{
            '&:hover:enabled': {
              bgcolor: (theme) => darken(theme.palette.common.lime, 0.1),
            },
            bgcolor: 'common.lime',
          }}
          variant="contained"
        >
          {activeCollab ? t('ongoing_collab') : t('start_collab')}
        </Button>
      )}

      <TeamCollabModal
        handleClose={() => setIsCollabOpen(false)}
        isOpen={isCollabOpen && googleCalLinked}
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

export default CollabButton
