import { ArrowRight } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { PulseCategory, TopicEntityType } from '@zunou-graphql/core/graphql'
import { useGetPulseMembersQuery } from '@zunou-queries/core/hooks/useGetPulseMembersQuery'
import { useGetTopics } from '@zunou-queries/core/hooks/useGetTopicsQuery'
import { useUnreadTeamMessagesQuery } from '@zunou-queries/core/hooks/useUnreadTeamMessagesQuery'
import { Button } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { debounce } from 'lodash'
import React, {
  ReactNode,
  SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { usePusherContext } from '~/context/PusherContext'
import { useOrganization } from '~/hooks/useOrganization'
import { useLeftMenuStore } from '~/store/useLeftMenuStore'
import {
  SelectedTab,
  SelectedTopic,
  usePulseStore,
} from '~/store/usePulseStore'
import { useTeamStore } from '~/store/useTeamStore'

import NotificationBadge from '../NotificationBadge'
import { MenuLink } from '.'
import TopicsList from './TopicsList'
import UnreadTopicsList from './UnreadTopicsList'

interface Props {
  link: MenuLink
  onLinkClick?: (params: { pulseId: string; selectedTab?: SelectedTab }) => void
  collapsed?: boolean
}

export default function CollapsibleChatButton({
  link,
  onLinkClick,
  collapsed = false,
}: Props) {
  const { organizationId } = useOrganization()
  const { pulseId: pulseIdFromParams } = useParams()
  const { user } = useAuthContext()
  const { setUnreadCount } = useTeamStore()
  const { setCurrentTopic, currentTopic } = usePulseStore()
  const { isDragging } = useLeftMenuStore()
  const location = useLocation()
  const { usePusherNotification } = usePusherContext()

  const pulseId = link.pulseId
  const selected = pulseIdFromParams === pulseId
  const currentPath = location.pathname
  const isDirectMessage = link.category === PulseCategory.Onetoone

  const [expanded, setExpanded] = useState(false)

  // Queries
  const { data: unreadPulses, refetch: refetchUnreadPulses } =
    useUnreadTeamMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    })

  const topics = useGetTopics({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled:
      Boolean(organizationId && pulseId) &&
      (link.category === PulseCategory.Team ||
        link.category === PulseCategory.Onetoone),
    variables: {
      organizationId,
      pulseId,
      type: TopicEntityType.TeamThread,
    },
  })

  const { data: membersData, isLoading: isLoadingPulseMembers } =
    useGetPulseMembersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: isDirectMessage && Boolean(link.pulseId),
      variables: { pulseId: link.pulseId },
    })

  // Derived data
  const otherMember = useMemo(() => {
    if (!isDirectMessage || !membersData) return null
    return (
      membersData.pulseMembers.data.find(
        (member) => member.user.id !== user?.id,
      ) ?? null
    )
  }, [isDirectMessage, membersData, user?.id])

  const displayLabel = isDirectMessage ? otherMember?.user.name : link.label
  const displayIcon: ReactNode =
    isDirectMessage && otherMember ? (
      <Avatar
        placeholder={otherMember.user.name}
        size="extraSmall"
        src={otherMember.user.gravatar}
        variant="circular"
      />
    ) : (
      link.icon
    )

  const selectedTopics = topics.data?.topics.data.slice(0, 5) ?? []
  const unreadTopics = selectedTopics.filter((topic) => topic.unreadCount > 0)

  const generalUnreadCount = useMemo(() => {
    if (!Array.isArray(unreadPulses) || !pulseId) return 0
    return (
      unreadPulses.find((pulse) => pulse.id === pulseId)?.unread_team_messages
        .length ?? 0
    )
  }, [unreadPulses, pulseId])

  const totalUnread = useMemo(() => {
    const topicsUnread = selectedTopics.reduce(
      (sum, topic) => sum + topic.unreadCount,
      0,
    )
    return topicsUnread + generalUnreadCount
  }, [selectedTopics, generalUnreadCount])

  // Debounced refetch
  const debouncedRefetch = useRef(
    debounce(
      () => {
        refetchUnreadPulses()
        topics.refetch()
      },
      300,
      { leading: true, trailing: true },
    ),
  ).current

  // Pusher notifications
  const channelIds = useMemo(() => (pulseId ? [pulseId] : []), [pulseId])
  const eventNames = useMemo(() => ['.team-message-sent'], [])

  usePusherNotification({
    channelIds,
    eventNames,
    onMessageEvent: debouncedRefetch,
    shouldNotify: true,
    suppressFor: selected
      ? { organizationId, pulseId: pulseId ?? '' }
      : undefined,
    type: 'team',
  })

  // Update team unread count
  useEffect(() => {
    if (!pulseId || isDirectMessage) return
    setUnreadCount(
      'team',
      Array.isArray(unreadPulses) ? unreadPulses.length : 0,
    )
  }, [unreadPulses, pulseId, isDirectMessage, setUnreadCount])

  // Handlers
  const handleChange = (_event: SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded)
  }

  const handleButtonClick = (
    e: React.MouseEvent,
    selectedTab?: SelectedTab,
    topic?: SelectedTopic,
  ) => {
    e.stopPropagation()
    onLinkClick?.({ pulseId, selectedTab })
    if (topic) setCurrentTopic(topic)
  }

  // Loading state for DMs
  if (isDirectMessage && isLoadingPulseMembers) {
    return <LoadingSkeleton height={40} />
  }

  // Don't render DM if no other member found
  if (isDirectMessage && !otherMember) {
    return null
  }

  // Collapsed view
  if (collapsed) {
    return (
      <Tooltip disableInteractive={true} placement="right" title={displayLabel}>
        <Button
          onClick={handleButtonClick}
          sx={{
            '&:hover': { bgcolor: 'background.action' },
            bgcolor: selected ? 'action.hover' : undefined,
            color: selected ? 'primary.main' : 'text.primary',
            justifyContent: 'flex-start',
            py: 1,
            width: '100%',
          }}
        >
          <Stack
            alignItems="center"
            direction="row"
            gap={1.5}
            justifyContent="center"
            width="100%"
          >
            {totalUnread > 0 ? (
              <NotificationBadge
                count={totalUnread}
                offset={isDirectMessage ? '8%' : undefined}
              >
                {displayIcon}
              </NotificationBadge>
            ) : (
              displayIcon
            )}
          </Stack>
        </Button>
      </Tooltip>
    )
  }

  // Expanded view
  return (
    <Stack gap={0.5} width="100%">
      <Accordion
        expanded={expanded && !isDragging}
        onChange={handleChange}
        sx={{
          '&.Mui-expanded': { margin: 0 },
          '&:before': { display: 'none' },
          bgcolor: 'transparent',
          boxShadow: 'none',
          width: '100%',
        }}
      >
        <Tooltip
          disableInteractive={true}
          placement="right"
          title={displayLabel}
        >
          <AccordionSummary
            expandIcon={<ArrowRight />}
            sx={{
              '& .MuiAccordionSummary-content': {
                '&.Mui-expanded': { margin: 0 },
                alignItems: 'center',
                flexGrow: 1,
                gap: 0,
                justifyContent: 'space-between',
                margin: 0,
              },
              '& .MuiAccordionSummary-expandIconWrapper': {
                '& .MuiSvgIcon-root': { transition: 'transform 0.3s' },
                '&.Mui-expanded .MuiSvgIcon-root': {
                  transform: 'rotate(90deg)',
                },
                alignItems: 'center',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'center',
                margin: 0,
                padding: '8px 6px',
                transform: 'none',
                transition: 'none',
              },
              '&.Mui-expanded': { minHeight: 'auto' },
              '&:hover': { backgroundColor: 'action.hover' },
              bgcolor: selected ? 'action.hover' : undefined,
              borderRadius: 1,
              minHeight: 'auto',
              padding: 0,
            }}
          >
            <Button
              onClick={handleButtonClick}
              sx={{
                '&:hover': { bgcolor: 'transparent' },
                color: selected ? 'primary.main' : 'text.primary',
                fontWeight: 500,
                justifyContent: 'flex-start',
                py: 1,
                width: '100%',
              }}
            >
              <Stack
                alignItems="center"
                direction="row"
                gap={isDirectMessage ? 1.5 : 1}
                width="100%"
              >
                {displayIcon}
                <Typography
                  noWrap={true}
                  sx={{
                    fontWeight: 500,
                    maxWidth: 150,
                    overflow: 'hidden',
                    textAlign: 'left',
                    textOverflow: 'ellipsis',
                  }}
                  variant="body2"
                >
                  {displayLabel}
                </Typography>
              </Stack>
            </Button>
          </AccordionSummary>
        </Tooltip>

        <AccordionDetails sx={{ px: 0 }}>
          <TopicsList
            currentPath={currentPath}
            currentTopic={currentTopic}
            generalUnreadCount={generalUnreadCount}
            isLoading={topics.isLoading}
            onButtonClick={handleButtonClick}
            selected={selected}
            topics={selectedTopics}
          />
        </AccordionDetails>
      </Accordion>

      {/* Unread topics shown when accordion is collapsed */}
      <UnreadTopicsList
        currentPath={currentPath}
        currentTopic={currentTopic}
        generalUnreadCount={generalUnreadCount}
        onButtonClick={handleButtonClick}
        selected={selected}
        show={!expanded && (unreadTopics.length > 0 || generalUnreadCount > 0)}
        topics={unreadTopics}
      />
    </Stack>
  )
}
