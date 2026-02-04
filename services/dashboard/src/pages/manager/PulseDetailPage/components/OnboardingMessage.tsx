import {
  CalendarTodayOutlined,
  FlareOutlined,
  PersonAddAlt1Outlined,
  VideocamOutlined,
} from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { theme } from '@zunou-react/services/Theme'

import { showLinkToast } from '~/components/domain/dataSource/InvitePulseToMeetingModal'
import { SettingsTabIdentifier } from '~/components/domain/settings/SettingsModal'
import { useMeetingsContext } from '~/context/MeetingsContext'
import { useUserSettingsStore } from '~/store/useUserSettingsStore'

import OnboardingCard from './OnboardingCard'

export default function OnboardingMessage() {
  const {
    googleCalLinked,
    setIsCollabModalOpen,
    setIsInvitePulseManuallyModalOpen,
    setIsBrainDumpModalOpen,
  } = useMeetingsContext()

  const { setCurrentTab, setIsOpen } = useUserSettingsStore()

  const handleLinkGoogleCal = () => {
    setIsOpen(true)
    setCurrentTab(SettingsTabIdentifier['LINKED ACCOUNTS'])
  }

  const handleStartCollab = () => {
    if (googleCalLinked) setIsCollabModalOpen(true)
    else showLinkToast(() => handleLinkGoogleCal())
  }

  const handleInviteCompanion = () => setIsInvitePulseManuallyModalOpen(true)

  const handleMeetingWithYourself = () => setIsBrainDumpModalOpen(true)

  const cards = [
    ...(googleCalLinked
      ? []
      : [
          {
            color: theme.palette.onboardingCard.green,
            description:
              'Link your Google Calendar to automatically invite companions to your meetings.',
            icon: (
              <CalendarTodayOutlined
                sx={{
                  color: theme.palette.onboardingCard.green,
                }}
              />
            ),
            isDisabled: false,
            isRecommended: true,
            onClick: () => handleLinkGoogleCal(),
            title: 'Link your Google Calendar',
          },
        ]),
    {
      color: theme.palette.onboardingCard.purple,
      description:
        'Discuss workspace updates and ideas with your AI for quick clarity and actionable summaries.',
      icon: (
        <FlareOutlined
          sx={{
            color: theme.palette.onboardingCard.purple,
          }}
        />
      ),
      isDisabled: false,
      isRecommended: false,
      onClick: () => handleMeetingWithYourself(),
      title: 'Meeting with yourself',
    },
    {
      color: theme.palette.onboardingCard.blue,
      description:
        'Work with your team to get quick summaries and next steps after meetings.',
      icon: (
        <VideocamOutlined
          sx={{
            color: theme.palette.onboardingCard.blue,
          }}
        />
      ),
      isDisabled: false,
      isRecommended: false,
      onClick: () => handleStartCollab(),
      title: 'Start a collab',
    },
    {
      color: theme.palette.onboardingCard.violet,
      description:
        'Invite Companion to your meeting for note-taking and insights.',
      icon: (
        <PersonAddAlt1Outlined
          sx={{
            color: theme.palette.onboardingCard.violet,
          }}
        />
      ),
      isDisabled: false,
      isRecommended: false,
      onClick: () => handleInviteCompanion(),
      title: 'Invite a companion',
    },
  ]

  return (
    <Stack gap={8} height="100%" justifyContent="center" p={1}>
      {/* Header */}
      <Stack alignItems="center" gap={1}>
        <Typography fontWeight={500} textAlign="center" variant="h5">
          Get started with{' '}
          <Typography
            color="primary.main"
            component="span"
            fontWeight={500}
            variant="h5"
          >
            Zunou AI
          </Typography>
        </Typography>

        <Typography color="text.secondary" textAlign="center" variant="body1">
          Kick off your workflow—start a chat, sync your calendar, or invite
          your AI companion into your next meeting.
        </Typography>
      </Stack>

      <Stack
        alignItems="stretch"
        direction="row"
        spacing={2}
        sx={{ width: '100%' }}
      >
        {cards.map((card, i) => (
          <OnboardingCard
            color={card.color}
            description={card.description}
            icon={card.icon}
            isDisabled={card.isDisabled}
            isRecommended={card.isRecommended}
            key={i}
            onClick={card.onClick}
            title={card.title}
          />
        ))}
      </Stack>
    </Stack>
  )
}
