import {
  ArrowForward,
  CalendarTodayOutlined,
  InfoOutlined,
  PlayCircleOutline,
  StopCircleOutlined,
} from '@mui/icons-material'
import {
  alpha,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { MeetingSession, MeetingType } from '@zunou-graphql/core/graphql'
import { useCreateCollaborationMutation } from '@zunou-queries/core/hooks/useCreateCollaborationMutation'
import { useGetCollabsQuery } from '@zunou-queries/core/hooks/useGetCollabsQuery'
import { Button, LoadingButton } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import brainDumpLogo from '~/assets/brain-dump-logo.png'
import pulseLogo from '~/assets/pulse-logo.png'
import { AudioVisualizer } from '~/components/ui/AudioVisualizer'
import { CustomModal } from '~/components/ui/CustomModal'

import { useMeetingPulse } from '../../dataSource/InvitePulseToMeetingModal/components/Meeting'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const NumberedIcon = ({ number }: { number: number }) => (
  <Box
    sx={{
      alignItems: 'center',
      backgroundColor: 'primary.main',
      borderRadius: '50%',
      color: 'white',
      display: 'flex',
      fontSize: 'small',
      fontWeight: 'fontWeightMedium',
      height: 24,
      justifyContent: 'center',
      width: 24,
    }}
  >
    {number}
  </Box>
)

export default function BrainDumpModal({ isOpen, onClose }: Props) {
  const { organizationId, pulseId } = useParams()

  const [ongoingBrainDump, setOngoingBrainDump] =
    useState<MeetingSession | null>(null)

  const {
    data: collabsData,
    isLoading: isCollabsLoading,
    refetch: refetchCollab,
  } = useGetCollabsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      default: true,
      organizationId,
      pulseId,
    },
  })

  const { mutateAsync: createCollaboration, isPending: isPendingCreateCollab } =
    useCreateCollaborationMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const { endMeeting, isEnding } = useMeetingPulse(ongoingBrainDump?.id)

  useEffect(() => {
    if (isCollabsLoading) return

    const ongoingBrainDump = collabsData?.collabs.find(
      (collab) => collab.meeting_type === MeetingType.BrainDump,
    )

    if (ongoingBrainDump) setOngoingBrainDump(ongoingBrainDump)
    else setOngoingBrainDump(null)
  }, [collabsData, isCollabsLoading])

  const { user } = useAuthContext()

  const timezone = user?.timezone ?? 'UTC'

  const current = dayjs().tz(timezone).format('ddd, MMM D, h:mm:ss A')

  const handleCreateBrainDump = async () => {
    if (!organizationId || !pulseId) {
      toast.error('Missing organization or pulse ID.')
      return
    }

    await createCollaboration({
      attendees: user ? [user.email] : [],
      description: 'Brain Dump',
      invite_pulse: true,
      meeting_type: MeetingType.BrainDump,
      name: `Brain Dump - ${current}`,
      organizationId: organizationId,
      pulseId: pulseId,
    })
  }

  const handleStartOrEnd = async () => {
    if (ongoingBrainDump) {
      await endMeeting()
    } else {
      await handleCreateBrainDump()
    }

    refetchCollab()
  }

  return (
    <CustomModal
      isOpen={isOpen}
      maxWidth={400}
      onClose={onClose}
      subheader="Your private space to think out loud"
      title="Brain Dump Session"
    >
      <Stack gap={4}>
        {ongoingBrainDump ? (
          <Stack
            alignItems="center"
            gap={4}
            justifyContent="center"
            pt={2}
            width="100%"
          >
            <Stack
              alignItems="center"
              borderRadius={9999}
              direction="row"
              gap={1}
              px={1}
              py={0.5}
              sx={(theme) => ({
                bgcolor: alpha(theme.palette.common.lime, 0.1),
              })}
            >
              <AudioVisualizer barCount={4} size="extraSmall" />
              <Typography color="common.lime" variant="body2">
                Live
              </Typography>
            </Stack>

            <Stack
              alignItems="center"
              direction="row"
              gap={1}
              justifyContent="space-between"
              width="100%"
            >
              <Stack>
                <Stack alignItems="center" direction="row" gap={1}>
                  <CalendarTodayOutlined
                    sx={{
                      fontSize: 14,
                    }}
                  />
                  <Typography fontWeight={500} variant="body2">
                    {ongoingBrainDump.name}
                  </Typography>
                </Stack>
                <Typography color="text.secondary" variant="caption">
                  This will appear in your calendar
                </Typography>
              </Stack>
              <Button
                onClick={() => {
                  if (ongoingBrainDump?.meetingUrl) {
                    window.open(ongoingBrainDump.meetingUrl, '_blank')
                  }
                }}
                variant="outlined"
              >
                Join
              </Button>{' '}
            </Stack>
          </Stack>
        ) : (
          <Stack
            alignItems="center"
            direction="row"
            gap={2}
            justifyContent="center"
            py={4}
          >
            <Avatar
              placeholder="Zunou"
              size="extraLarge"
              src={pulseLogo}
              variant="circular"
            />

            <ArrowForward
              fontSize="large"
              sx={{
                color: 'text.secondary',
              }}
            />

            <Avatar
              placeholder="Brain Dump"
              size="extraLarge"
              src={brainDumpLogo}
              transparentBg={true}
              variant="rounded"
            />
          </Stack>
        )}

        <Stack
          borderRadius={2}
          gap={3}
          p={3}
          sx={(theme) => ({ bgcolor: alpha(theme.palette.primary.main, 0.05) })}
        >
          <List sx={{ py: 0 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <InfoOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="How it works"
                primaryTypographyProps={{
                  color: 'primary.main',
                  fontWeight: 500,
                }}
              />
            </ListItem>

            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <NumberedIcon number={1} />
              </ListItemIcon>
              <ListItemText
                primary="Join the Google Meet Session above"
                primaryTypographyProps={{
                  variant: 'body2',
                }}
              />
            </ListItem>

            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <NumberedIcon number={2} />
              </ListItemIcon>
              <ListItemText
                primary="Speak freely about what's on your mind"
                primaryTypographyProps={{
                  variant: 'body2',
                }}
              />
            </ListItem>

            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <NumberedIcon number={3} />
              </ListItemIcon>
              <ListItemText
                primary="Companion will transcribe and generate insights"
                primaryTypographyProps={{
                  variant: 'body2',
                }}
              />
            </ListItem>
          </List>
        </Stack>

        <Stack gap={1}>
          <LoadingButton
            color={ongoingBrainDump ? 'error' : 'primary'}
            fullWidth={true}
            loading={isEnding || isPendingCreateCollab}
            onClick={handleStartOrEnd}
            size="large"
            startIcon={
              ongoingBrainDump ? <StopCircleOutlined /> : <PlayCircleOutline />
            }
            variant="contained"
          >
            {ongoingBrainDump ? 'End Session' : 'Start Session'}
          </LoadingButton>
          {!ongoingBrainDump && (
            <Button
              fullWidth={true}
              onClick={onClose}
              size="large"
              sx={{
                color: 'text.secondary',
              }}
              variant="text"
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </CustomModal>
  )
}
