import { ArrowDropDown, Tag } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
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
import React, { SyntheticEvent, useMemo, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { usePusherContext } from '~/context/PusherContext'
import { useOrganization } from '~/hooks/useOrganization'
import { useLeftMenuStore } from '~/store/useLeftMenuStore'
import {
  SelectedTab,
  SelectedTabEnum,
  SelectedTopic,
  usePulseStore,
} from '~/store/usePulseStore'

import NotificationBadge from '../NotificationBadge'
import UnreadCounter from '../UnreadCounter'
import { MenuLink } from '.'

interface Props {
  link: MenuLink
  onLinkClick?: (params: { pulseId: string; selectedTab?: SelectedTab }) => void
  collapsed?: boolean
}

export default function DirectMessageButton({
  link,
  onLinkClick,
  collapsed = false,
}: Props) {
  const { organizationId } = useOrganization()
  const { pulseId: pulseIdFromParams } = useParams()
  const { user } = useAuthContext()
  const { setCurrentTopic, currentTopic } = usePulseStore()
  const location = useLocation()
  const { isDragging } = useLeftMenuStore() // if resorting pulses is set to true
  const { usePusherNotification } = usePusherContext()

  // Derived States
  const pulseId = link.pulseId
  const selected = pulseIdFromParams === pulseId
  const currentPath = location.pathname

  const [expanded, setExpanded] = useState(false)

  const handleChange = (_event: SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded)
  }

  const { data: unreadPulses, refetch: refetchUnreadPulses } =
    useUnreadTeamMessagesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    })

  const topics = useGetTopics({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled:
      Boolean(organizationId && pulseId) &&
      link.category === PulseCategory.Onetoone,
    variables: {
      organizationId,
      pulseId,
      type: TopicEntityType.TeamThread,
    },
  })

  const selectedTopics = topics.data?.topics.data.slice(0, 5) ?? []

  // Filter topics with unread messages
  const unreadTopics = selectedTopics.filter((topic) => topic.unreadCount > 0)

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

  const generalUnreadCount =
    Array.isArray(unreadPulses) && pulseId
      ? unreadPulses.find((pulse) => pulse.id === pulseId)?.unread_team_messages
          .length
      : 0

  const totalUnread =
    (selectedTopics.reduce((sum, topic) => sum + topic.unreadCount, 0) || 0) +
    (generalUnreadCount ?? 0)

  // Memoize channelIds and eventNames to avoid unnecessary re-subscribes
  const channelIds = useMemo(() => (pulseId ? [pulseId] : []), [pulseId])
  const eventNames = useMemo(() => ['.team-message-sent'], [])

  usePusherNotification({
    channelIds,
    eventNames,
    onMessageEvent: () => {
      debouncedRefetch()
    },
    shouldNotify: true,
    suppressFor: selected
      ? { organizationId, pulseId: pulseId ?? '' }
      : undefined,
    type: 'team',
  })

  const { data: membersData, isLoading: isLoadingPulseMembers } =
    useGetPulseMembersQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      enabled: Boolean(link.pulseId),
      variables: {
        pulseId: link.pulseId,
      },
    })

  const otherMember = useMemo(() => {
    return (
      membersData?.pulseMembers.data.find(
        (member) => member.user.id !== user?.id,
      ) ?? null
    )
  }, [membersData, user?.id])

  const handleButtonClick = (
    e: React.MouseEvent,
    selectedTab?: SelectedTab,
    topic?: SelectedTopic,
  ) => {
    e.stopPropagation() // Prevent accordion from toggling
    onLinkClick?.({ pulseId, selectedTab })

    if (topic) setCurrentTopic(topic)
  }

  if (isLoadingPulseMembers) return <LoadingSkeleton height={40} />

  if (!otherMember) return null

  if (collapsed)
    return (
      <Tooltip
        disableInteractive={true}
        placement="right"
        title={otherMember.user.name}
      >
        <Button
          onClick={handleButtonClick}
          sx={{
            '&:hover': {
              bgcolor: 'background.action',
            },
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
              <NotificationBadge count={totalUnread} offset="8%">
                <Avatar
                  placeholder={otherMember.user.name}
                  size="extraSmall"
                  src={otherMember.user.gravatar}
                  variant="circular"
                />
              </NotificationBadge>
            ) : (
              <Avatar
                placeholder={otherMember.user.name}
                size="extraSmall"
                src={otherMember.user.gravatar}
                variant="circular"
              />
            )}
          </Stack>
        </Button>
      </Tooltip>
    )

  return (
    <Stack gap={0.5} width="100%">
      <Accordion
        expanded={expanded && !isDragging}
        onChange={handleChange}
        sx={{
          '&.Mui-expanded': {
            margin: 0,
          },
          '&:before': {
            display: 'none',
          },
          bgcolor: 'transparent',
          boxShadow: 'none',
          width: '100%',
        }}
      >
        <Tooltip
          disableInteractive={true}
          placement="right"
          title={otherMember.user.name}
        >
          <AccordionSummary
            expandIcon={<ArrowDropDown />}
            sx={{
              '& .MuiAccordionSummary-content': {
                '&.Mui-expanded': {
                  margin: 0,
                },
                alignItems: 'center',
                flexGrow: 1,
                gap: 0,
                justifyContent: 'space-between',
                margin: 0,
              },
              '& .MuiAccordionSummary-expandIconWrapper': {
                '& .MuiSvgIcon-root': {
                  transition: 'transform 0.3s',
                },
                '&.Mui-expanded .MuiSvgIcon-root': {
                  transform: 'rotate(180deg)',
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
              '&.Mui-expanded': {
                minHeight: 'auto',
              },
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              bgcolor: selected ? 'action.hover' : undefined,
              borderRadius: 1,
              minHeight: 'auto',
              padding: 0,
            }}
          >
            <Button
              onClick={handleButtonClick}
              sx={{
                '&:hover': {
                  bgcolor: 'transparent',
                },
                color: selected ? 'primary.main' : 'text.primary',
                fontWeight: 500,
                justifyContent: 'flex-start',
                py: 1,
                width: '100%',
              }}
            >
              <Stack alignItems="center" direction="row" gap={1.5} width="100%">
                <Avatar
                  placeholder={otherMember.user.name}
                  size="extraSmall"
                  src={otherMember.user.gravatar}
                  variant="circular"
                />
                <Typography
                  noWrap={true}
                  sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textAlign: 'left',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  variant="body2"
                >
                  {otherMember.user.name}
                </Typography>

                {/* {totalUnread > 0 && !expanded && (
                  <UnreadCounter unread={totalUnread} />
                )} */}
              </Stack>
            </Button>
          </AccordionSummary>
        </Tooltip>

        <AccordionDetails sx={{ px: 0 }}>
          <Stack gap={1} pl={2}>
            <Tooltip
              disableInteractive={true}
              placement="right"
              title="General"
            >
              <Button
                fullWidth={true}
                onClick={(e) =>
                  handleButtonClick(e, SelectedTabEnum.TEAM_CHAT, {
                    hasUnread: false,
                    id: 'general',
                    name: 'General',
                  })
                }
                startIcon={<Tag fontSize="small" />}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  bgcolor:
                    currentTopic?.id === 'general' &&
                    currentPath.includes('team-chat') &&
                    selected
                      ? 'action.hover'
                      : undefined,
                  color:
                    currentTopic?.id === 'general' &&
                    currentPath.includes('team-chat') &&
                    selected
                      ? 'primary.main'
                      : 'text.secondary',
                  fontWeight: 500,
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                }}
              >
                <Stack alignItems="center" direction="row" gap={1}>
                  <Typography variant="body2">General</Typography>
                  {(generalUnreadCount ?? 0) > 0 && (
                    <UnreadCounter unread={generalUnreadCount} />
                  )}
                </Stack>
              </Button>
            </Tooltip>

            {!topics.isLoading &&
              (topics.data?.topics.data?.length ?? 0) > 0 && (
                <Typography
                  fontSize={10}
                  noWrap={true}
                  sx={{
                    color: 'text.secondary',
                    maxWidth: 150,
                    overflow: 'hidden',
                    pl: 1,
                    textAlign: 'left',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  textTransform="uppercase"
                >
                  Recent
                </Typography>
              )}

            {topics.isLoading ? (
              <>
                <LoadingSkeleton height={32} />
                <LoadingSkeleton height={32} />
                <LoadingSkeleton height={32} />
              </>
            ) : (
              selectedTopics.map((topic) => (
                <Tooltip
                  disableInteractive={true}
                  key={topic.id}
                  placement="right"
                  title={topic.name}
                >
                  <Button
                    fullWidth={true}
                    onClick={(e) =>
                      handleButtonClick(e, SelectedTabEnum.TEAM_CHAT, {
                        hasUnread: false,
                        id: topic.id,
                        name: topic.name,
                      })
                    }
                    startIcon={<Tag fontSize="small" />}
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                      bgcolor:
                        currentTopic?.id === topic.id &&
                        currentPath.includes('team-chat') &&
                        selected
                          ? 'action.hover'
                          : undefined,
                      color:
                        currentTopic?.id === topic.id &&
                        currentPath.includes('team-chat') &&
                        selected
                          ? 'primary.main'
                          : 'text.secondary',
                      fontWeight: 500,
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                    }}
                  >
                    <Stack alignItems="center" direction="row" gap={1}>
                      <Box
                        sx={{
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          display: '-webkit-box',
                          maxWidth: 150,
                          overflow: 'hidden',
                          overflowWrap: 'break-word',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                        }}
                      >
                        {topic.name}
                      </Box>
                      <UnreadCounter unread={topic.unreadCount} />
                    </Stack>
                  </Button>
                </Tooltip>
              ))
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Unread topics shown when collapsed */}
      <Stack
        gap={1}
        pl={2}
        sx={{
          maxHeight:
            !expanded &&
            (unreadTopics.length > 0 || (generalUnreadCount ?? 0) > 0)
              ? '500px'
              : '0px',
          opacity:
            !expanded &&
            (unreadTopics.length > 0 || (generalUnreadCount ?? 0) > 0)
              ? 1
              : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
        }}
      >
        {(generalUnreadCount ?? 0) > 0 && (
          <Tooltip placement="right" title="General">
            <Button
              fullWidth={true}
              onClick={(e) =>
                handleButtonClick(e, SelectedTabEnum.TEAM_CHAT, {
                  hasUnread: false,
                  id: 'general',
                  name: 'General',
                })
              }
              startIcon={<Tag fontSize="small" />}
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                bgcolor:
                  currentTopic?.id === 'general' &&
                  currentPath.includes('team-chat') &&
                  selected
                    ? 'action.hover'
                    : undefined,
                color:
                  currentTopic?.id === 'general' &&
                  currentPath.includes('team-chat') &&
                  selected
                    ? 'primary.main'
                    : 'text.secondary',
                fontWeight: 500,
                justifyContent: 'flex-start',
                textTransform: 'none',
              }}
            >
              <Stack alignItems="center" direction="row" gap={1}>
                <Typography variant="body2">General</Typography>
                <UnreadCounter unread={generalUnreadCount} />
              </Stack>
            </Button>
          </Tooltip>
        )}

        {!topics.isLoading && unreadTopics.length > 0 && (
          <Typography
            fontSize={10}
            noWrap={true}
            sx={{
              color: 'text.secondary',
              maxWidth: 150,
              overflow: 'hidden',
              pl: 1,
              textAlign: 'left',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            textTransform="uppercase"
          >
            Recent
          </Typography>
        )}

        {unreadTopics.map((topic) => (
          <Tooltip
            disableInteractive={true}
            key={topic.id}
            placement="right"
            title={topic.name}
          >
            <Button
              fullWidth={true}
              onClick={(e) =>
                handleButtonClick(e, SelectedTabEnum.TEAM_CHAT, {
                  hasUnread: false,
                  id: topic.id,
                  name: topic.name,
                })
              }
              startIcon={<Tag fontSize="small" />}
              sx={{
                '&:hover': { backgroundColor: 'action.hover' },
                bgcolor:
                  currentTopic?.id === topic.id &&
                  currentPath.includes('team-chat') &&
                  selected
                    ? 'action.hover'
                    : undefined,
                color:
                  currentTopic?.id === topic.id &&
                  currentPath.includes('team-chat') &&
                  selected
                    ? 'primary.main'
                    : 'text.secondary',
                fontWeight: 500,
                justifyContent: 'flex-start',
                textTransform: 'none',
              }}
            >
              <Stack alignItems="center" direction="row" gap={1}>
                <Box
                  sx={{
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    display: '-webkit-box',
                    maxWidth: 150,
                    overflow: 'hidden',
                    overflowWrap: 'break-word',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                  }}
                >
                  {topic.name}
                </Box>
                <UnreadCounter unread={topic.unreadCount} />
              </Stack>
            </Button>
          </Tooltip>
        ))}
      </Stack>
    </Stack>
  )
}
