import { KeyboardArrowDown, NotificationsOutlined } from '@mui/icons-material'
import { Badge, Box, Divider, Stack, Theme, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  PulseCategory,
  User as BaseUser,
  UserPresence,
} from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import { getFirstLetter } from '@zunou-react/utils/getFirstLetter'
import { useMemo } from 'react'

// import { useLocation } from 'react-router-dom'
import ChatbotIcon from '~/assets/zunou-icon'
import AddMeetingLinkModal from '~/components/domain/dataSource/AddMeetingLinkModal'
import { PulseIcon } from '~/components/domain/pulse/PulseNavbar/PulseIcon'
import { SetupSettingsModal } from '~/components/domain/pulse/SetupSettingsModal'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useLiveMeetings } from '~/context/LiveMeetingsContext'
import { useMeetingsContext } from '~/context/MeetingsContext'
// import { useAccessControl } from '~/hooks/useAccessControl'
import { usePresence } from '~/hooks/usePresence'
// import { useTaskStore } from '~/store/useTaskStore'
// import { PulsePermissionEnum, PulsePermissionMap } from '~/types/permissions'
import { getPresenceColor } from '~/utils/presenceUtils'

import { MembersAndAgentsModal } from '../../MembersAndAgentsModal'
import { NavButton } from '../NavButton'
// import { TaskIcon } from '../TaskIcon'
import ContentButton from './components/ContentButton'
import { DeleteOneToOneModal } from './components/DeleteOneToOneModal'
import FeedButton from './components/FeedButton'
import MeetingsButton from './components/MeetingsButton'
import PulseSettingsButton from './components/PulseSettingsButton'
import { useHooks } from './hooks'

// interface ButtonConfig {
//   label: string | number
//   icon: ReactNode
//   onClick: () => void
//   side: 'left' | 'right'
//   showLabel: boolean
// }

interface User extends BaseUser {
  one_to_one?: string | null
}

interface NavbarTopProps {
  savedMessagesCount: number
  openFeedDrawer: () => void
  openSavedChat: () => void
  openStrategiesDrawer: () => void
  openContentDrawer: () => void
  openMeetingsDrawer: () => void
  pendingNotificationCount: number
  onNotificationToggle: () => void
  isNotificationsOpen?: boolean
}

// const getRoleButtons = (
//   pulseMembership: PulseMember | null,
//   savedMessagesCount: number,
//   {
//     openSavedChat,
//     handleOpenSetup,
//     openStrategiesDrawer,
//   }: {
//     openSavedChat: () => void
//     handleOpenSetup: () => void
//     openStrategiesDrawer: () => void
//   },
// ): ButtonConfig[] => {
//   const commonButtons: ButtonConfig[] = [
//     {
//       icon: <BookmarkBorderOutlined />,
//       label: savedMessagesCount,
//       onClick: openSavedChat,
//       showLabel: true,
//       side: 'right',
//     },
//   ]

//   if (
//     pulseMembership?.role === PulseMemberRole.Admin ||
//     pulseMembership?.role === PulseMemberRole.Owner
//   ) {
//     return [
//       {
//         icon: <SettingsOutlined />,
//         label: i18n.t('setup'),
//         onClick: handleOpenSetup,
//         showLabel: true,
//         side: 'left',
//       },
//       ...commonButtons,
//       {
//         icon: <Radar />,
//         label: i18n.t('strategy'),
//         onClick: openStrategiesDrawer,
//         showLabel: false,
//         side: 'right',
//       },
//     ]
//   }
//   return commonButtons
// }

export const NavbarTop = ({
  openFeedDrawer,
  openMeetingsDrawer,
  pendingNotificationCount,
  onNotificationToggle,
  isNotificationsOpen,
  openContentDrawer,
}: NavbarTopProps) => {
  const {
    allOrganizationUsers,
    handleCloseDeleteOneToOne,
    handleCloseSetup,
    handleCloseTeamModal,
    handleNotificationToggle,
    handleOpenSetup,
    handleOpenTeamModal,
    isDeleteOneToOneOpen,
    isLoadingPulse,
    isLoadingPulseMembers,
    isSetupOpen,
    isTeamModalOpen,
    pulse,
    pulseCategory,
    pulseMembers,
    pulseMembership,
    t,
  } = useHooks({ onNotificationToggle })

  const { totalLive } = useLiveMeetings()

  const { isInvitePulseManuallyModalOpen, setIsInvitePulseManuallyModalOpen } =
    useMeetingsContext()

  // const roleButtons = getRoleButtons(pulseMembership, savedMessagesCount, {
  //   handleOpenSetup,
  //   openSavedChat,
  //   openStrategiesDrawer,
  // })

  // const rolePermissions = pulseMembership?.role
  //   ? PulsePermissionMap[pulseMembership.role]
  //   : []

  // const { checkAccess } = useAccessControl()
  // const { grant: hasCreateAccess } = checkAccess(
  //   [
  //     PulsePermissionEnum.CREATE_PULSE_TASK,
  //     PulsePermissionEnum.CREATE_PULSE_TASK_LIST,
  //   ],
  //   rolePermissions,
  // )

  // const location = useLocation()
  // const currentPath = location.pathname
  // const inTasksPage = currentPath.includes('/tasks')

  // const { handleCreateTask, handleCreateTaskList } = useTaskStore()

  const { user } = useAuthContext()
  const otherMember = pulseMembers.find(
    (member) => member.id !== pulseMembership?.user.id,
  )
  const userIds = useMemo(
    () => (otherMember ? [otherMember.id] : []),
    [otherMember],
  )
  const presenceMap = usePresence(userIds)

  const filteredOrganizationUsers =
    allOrganizationUsers?.organizationUsers.data.filter(
      (member) => member.user.id !== user?.id,
    )

  return (
    <Stack
      alignItems="center"
      direction="row"
      justifyContent="space-between"
      p={2}
      pt={4}
    >
      {/* Left Section */}
      <Stack
        alignItems="center"
        direction="row"
        divider={
          <Divider
            flexItem={true}
            orientation="vertical"
            sx={{ alignSelf: 'center', height: 24 }}
          />
        }
        spacing={2}
      >
        {/* {inTasksPage ? (
          <>
            <TaskIcon />
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 'fontWeightBold',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t('my_tasks')}
            </Typography>
          </>
        ) : ( */}
        <Stack alignItems="center" direction="row" spacing={1}>
          {isLoadingPulse ? (
            <>
              <LoadingSkeleton height={32} variant="rounded" width={32} />
              <LoadingSkeleton height={20} variant="rounded" width={120} />
            </>
          ) : pulseCategory === PulseCategory.Onetoone && otherMember ? (
            <>
              <Box
                bgcolor={alpha(theme.palette.primary.main, 0.1)}
                borderRadius={2}
                p={0.5}
              >
                <Avatar
                  badgeColor={getPresenceColor(
                    presenceMap[otherMember.id] ||
                      otherMember.presence ||
                      UserPresence.Offline,
                  )}
                  isDarkMode={false}
                  placeholder={getFirstLetter(otherMember.name)?.toUpperCase()}
                  showBadge={true}
                  src={otherMember.gravatar || undefined}
                  sx={{ height: 32, width: 32 }}
                  variant="rounded"
                />
              </Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                {otherMember.name}
              </Typography>
            </>
          ) : pulseCategory === PulseCategory.Personal ? (
            <>
              <Stack
                alignItems="center"
                bgcolor={alpha(theme.palette.primary.main, 0.1)}
                borderRadius={2}
                color="primary.main"
                height={32}
                justifyContent="center"
                width={32}
              >
                <ChatbotIcon />
              </Stack>
              <Typography
                className="joyride-onboarding-tour-1"
                sx={{ fontSize: 16, fontWeight: 700 }}
              >
                {t('zunou_assistant')}
              </Typography>
            </>
          ) : (
            <>
              <PulseIcon icon={pulse?.icon} />
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pulse?.name}
              </Typography>
            </>
          )}
        </Stack>
        {/* )} */}

        {pulseCategory != PulseCategory.Personal && (
          <PulseSettingsButton handleOpenSetup={handleOpenSetup} />
        )}
      </Stack>

      {/* Right Section */}
      <Stack alignItems="center" direction="row" spacing={1}>
        {/* show task toolbar buttons if in tasks page */}
        {/* {inTasksPage && hasCreateAccess && (
          <Stack direction="row" spacing={1}>
            <Button
              onClick={handleCreateTaskList}
              sx={{
                borderRadius: 20,
              }}
              variant="outlined"
            >
              {t('new_task_list', { ns: 'tasks' })}
            </Button>
            <Button
              onClick={handleCreateTask}
              sx={{
                borderRadius: 20,
              }}
              variant="contained"
            >
              {t('new_task', { ns: 'tasks' })}
            </Button>
          </Stack>
        )} */}

        {pulseMembership?.role && pulseCategory !== PulseCategory.Personal && (
          <Stack>
            <Button
              onClick={handleOpenTeamModal}
              sx={{
                '&:hover': {
                  borderColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.1),
                },
                bgcolor: 'theme.palette.background.paper',
                borderColor: (theme) => alpha(theme.palette.text.primary, 0.2),
                borderRadius: 20,
                color: 'text.primary',
                py: 0.8,
              }}
              variant="outlined"
            >
              <Stack direction="row" spacing={1}>
                <Stack
                  alignItems="center"
                  direction="row-reverse"
                  spacing={-0.5}
                >
                  {isLoadingPulseMembers ? (
                    <LoadingSkeleton height={18} variant="rounded" width={18} />
                  ) : (
                    pulseMembers
                      .map((m) => ({
                        ...m,
                        presence: presenceMap[m.id] || m.presence,
                      }))
                      .slice(0, 3)
                      .map((member) => (
                        <Avatar
                          isDarkMode={false}
                          key={member.id}
                          src={member.gravatar || undefined}
                          sx={{
                            border: '1px solid',
                            borderColor: 'theme.palette.background.paper',
                            height: 18,
                            width: 18,
                          }}
                          variant="rounded"
                        />
                      ))
                  )}
                </Stack>
                {/* <MemberItemIcon isInMembersModal={true} /> */}
                <Typography fontSize={14}>{pulseMembers.length}</Typography>
              </Stack>
            </Button>
          </Stack>
        )}

        <MeetingsButton
          isMeetingOngoing={totalLive > 0}
          onInvitePulse={() => setIsInvitePulseManuallyModalOpen(true)}
          onMeetingsClick={openMeetingsDrawer}
        />

        <FeedButton onClick={openFeedDrawer} />
        <ContentButton onClick={openContentDrawer} />
        {/* {roleButtons.map(
          (button, index) =>
            button.side === 'right' && (
              <NavButton
                key={index}
                label={button.showLabel ? button.label : null}
                onClick={button.onClick}
                startIcon={button.icon}
              />
            ),
        )}
        <CollabButton /> */}
        {/* <NavButton
          label=""
          onClick={handleOpenTeamModal}
          startIcon={<ChatBubbleOutlineOutlined />}
        /> */}
        <NavButton
          customSx={{
            '&:hover': {
              bgcolor: 'theme.palette.background.paper',
              borderColor: (theme: Theme) =>
                alpha(theme.palette.primary.main, 0.1),
            },
            cursor: 'pointer',
          }}
          data-notification-button="true"
          endIcon={
            <KeyboardArrowDown
              sx={{
                transform: isNotificationsOpen
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out',
              }}
            />
          }
          label={pendingNotificationCount.toString()}
          onClick={(e) => {
            e.stopPropagation()
            handleNotificationToggle()
          }}
          startIcon={
            <Badge
              color="error"
              invisible={pendingNotificationCount === 0}
              variant="dot"
            >
              <NotificationsOutlined />
            </Badge>
          }
        />
      </Stack>

      <SetupSettingsModal
        handleClose={handleCloseSetup}
        isOpen={isSetupOpen}
        pulse={pulse}
      />

      <MembersAndAgentsModal
        handleClose={handleCloseTeamModal}
        isOpen={isTeamModalOpen}
        members={
          pulseCategory === PulseCategory.Personal
            ? filteredOrganizationUsers?.map((member) => ({
                ...member.user,
                one_to_one: member.one_to_one,
              })) ?? []
            : (pulseMembers as unknown as User[]).map((m) => ({
                ...m,
                presence: presenceMap[m.id] || m.presence,
              }))
        }
        pulse={pulse}
      />
      <DeleteOneToOneModal
        handleClose={handleCloseDeleteOneToOne}
        isOpen={isDeleteOneToOneOpen}
        otherMember={otherMember ?? null}
        pulse={pulse}
      />

      <AddMeetingLinkModal
        isOpen={isInvitePulseManuallyModalOpen}
        isVitalsMode={false}
        onClose={() => setIsInvitePulseManuallyModalOpen(false)}
      />
    </Stack>
  )
}
