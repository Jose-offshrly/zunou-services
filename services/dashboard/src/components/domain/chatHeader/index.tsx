import {
  Add,
  ArrowDropDown,
  ChevronRight,
  PushPinOutlined,
} from '@mui/icons-material'
import {
  alpha,
  ButtonGroup,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  Stack,
  Typography,
} from '@mui/material'
import {
  type GetPinnedTeamMessagesQuery,
  TopicEntityType,
} from '@zunou-graphql/core/graphql'
import { Button } from '@zunou-react/components/form/Button'
import { IconButton } from '@zunou-react/components/form/IconButton'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useMemo, useState } from 'react'

import { TopicCreationForm } from '~/pages/manager/TeamChatPage/components/TopicCreationForm/TopicCreationForm'
import { TopicsModal } from '~/pages/manager/TeamChatPage/components/TopicsModal/TopicsModal'
import { SimpleTopic } from '~/store/useTopicStore'

import MessageSearch, { MessageSearchProps } from './MessageSearch'

interface TeamChatHeaderProps {
  disableCreate?: boolean
  currentTopic?: SimpleTopic
  recentTopics?: SimpleTopic[]
  pinnedMessagesData?: GetPinnedTeamMessagesQuery
  isLoadingPinnedMessages?: boolean
  onSeeAllTopics?: () => void
  onTopicChange?: (topic: SimpleTopic) => void
  onGeneralClick?: () => void
  teamThreadId?: string
  onUnpinMessage?: (messageId: string) => void
  onTopicCreated?: () => void
  searchConfig?: MessageSearchProps
  renderPinnedMessages?: (props: {
    anchorEl: HTMLElement | null
    open: boolean
    onClose: () => void
    onMouseDown: (e: React.MouseEvent) => void
  }) => React.ReactNode
  children?: React.ReactNode
}

export const DEFAULT_TOPIC: SimpleTopic = {
  hasUnread: false,
  id: 'general',
  name: 'General',
  threadId: null,
}

export const ChatHeader = ({
  disableCreate = false,
  currentTopic = DEFAULT_TOPIC,
  recentTopics = [],
  onSeeAllTopics,
  onTopicChange,
  onGeneralClick,
  teamThreadId,
  onTopicCreated,
  searchConfig,
  renderPinnedMessages,
  children,
}: TeamChatHeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [pinnedAnchorEl, setPinnedAnchorEl] = useState<HTMLElement | null>(null)
  const [menuContent, setMenuContent] = useState<'topics' | 'create'>('topics')

  const open = Boolean(anchorEl)
  const pinnedOpen = Boolean(pinnedAnchorEl)
  const isGeneralTopic = currentTopic.id === 'general'

  const displayedTopics = useMemo(
    () => recentTopics.slice(0, 5),
    [recentTopics],
  )
  const hasMoreTopics = recentTopics.length > 5

  // const inlineRecentTopics = useMemo(
  //   () => recentTopics.filter((t) => t.id !== currentTopic.id).slice(0, 3),
  //   [recentTopics, currentTopic.id],
  // )

  const handleClose = useCallback(() => setAnchorEl(null), [])
  const handlePinnedClose = useCallback(() => setPinnedAnchorEl(null), [])
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  )

  const handleTopicSelect = useCallback(
    (topic: SimpleTopic) => {
      onTopicChange?.(topic)
      handleClose()
    },
    [handleClose, onTopicChange],
  )

  // const handleInlineTopicClick = useCallback(
  //   (topic: SimpleTopic) => (e: React.MouseEvent) => {
  //     e.stopPropagation()
  //     onTopicChange?.(topic)
  //   },
  //   [onTopicChange],
  // )

  const handleTopicSelectorClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (pinnedOpen) setPinnedAnchorEl(null)
      setAnchorEl(event.currentTarget)
      setMenuContent('topics')
    },
    [pinnedOpen],
  )

  const handleNewTopicClick = useCallback(
    (event?: React.MouseEvent<HTMLElement>) => {
      if (pinnedOpen) setPinnedAnchorEl(null)
      if (open) {
        setMenuContent('create')
      } else if (event) {
        setAnchorEl(event.currentTarget)
        setMenuContent('create')
      }
    },
    [open, pinnedOpen],
  )

  const handleMainButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (isGeneralTopic && !disableCreate) {
        if (pinnedOpen) setPinnedAnchorEl(null)
        setAnchorEl(event.currentTarget)
        setMenuContent('create')
      }
    },
    [isGeneralTopic, pinnedOpen, disableCreate],
  )

  const handlePinnedButtonClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      if (open) setAnchorEl(null)
      setPinnedAnchorEl(event.currentTarget)
    },
    [open],
  )

  const handleTopicCreated = useCallback(
    (_data: { title: string }) => {
      try {
        // Implementation here
      } catch (error) {
        console.error('Failed to create topic:', error)
      }
    },
    [handleClose, teamThreadId, onTopicChange, onTopicCreated],
  )

  const mainButtonSx =
    isGeneralTopic && !disableCreate
      ? {
          border: `0.5px solid ${theme.palette.divider}`,
          borderRadius: 1,
          cursor: 'pointer',
          minWidth: 'auto',
          padding: '4px 12px',
        }
      : {
          '&:hover': {
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'default',
          },
          border: 'none',
          minWidth: 'auto',
          padding: '4px 12px',
        }

  const topicDisplaySx = !isGeneralTopic
    ? {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
        border: 'none',
        borderRadius: 1,
        cursor: 'default',
        height: 'auto',
        padding: '2px 8px',
      }
    : {}

  const topicTextSx = isGeneralTopic
    ? { color: theme.palette.text.primary, fontSize: 'small' }
    : {
        color: theme.palette.primary.main,
        fontSize: 'small',
        fontWeight: theme.typography.fontWeightBold,
      }

  const [openTopicsModal, setOpenTopicsModal] = useState(false)

  const handleTopicSelectViaModal = (topic: {
    id: string
    name: string
    unreadCount?: number
    threadId?: string
  }) => {
    onTopicChange?.({
      hasUnread: (topic.unreadCount ?? 0) > 0,
      id: topic.id,
      name: topic.name,
      threadId: topic.threadId,
    })
  }

  return (
    <>
      <Stack
        sx={{
          backgroundColor: theme.palette.common.white,
          borderBottom: `1px solid ${theme.palette.divider}`,
          padding: '8px 16px',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack alignItems="center" direction="row" gap={1}>
            <Typography
              onClick={onGeneralClick}
              sx={{
                '&:hover': {
                  color: theme.palette.primary.main,
                },
                backgroundColor: isGeneralTopic
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
                borderRadius: 1,
                color: isGeneralTopic
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                cursor: !isGeneralTopic ? 'pointer' : 'default',
                fontSize: 'small',
                fontWeight: isGeneralTopic
                  ? theme.typography.fontWeightBold
                  : null,
                padding: '2px 8px',
              }}
              variant="body2"
            >
              # Main
            </Typography>

            <ChevronRight
              sx={{ color: theme.palette.text.secondary, fontSize: 'small' }}
            />

            {disableCreate ? (
              // Single button when create is disabled
              <Button
                onClick={handleTopicSelectorClick}
                sx={{
                  '&:hover': isGeneralTopic
                    ? {}
                    : {
                        backgroundColor: 'transparent',
                      },
                  border: isGeneralTopic
                    ? `0.5px solid ${theme.palette.divider}`
                    : 'none',
                  borderRadius: 1,
                  gap: 1,
                  minWidth: 'auto',
                  padding: '4px 8px',
                }}
              >
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="center"
                  spacing={1}
                  sx={topicDisplaySx}
                >
                  {!isGeneralTopic && (
                    <Typography sx={topicTextSx}>#</Typography>
                  )}
                  <Typography sx={topicTextSx}>
                    {isGeneralTopic ? 'Select a Topic' : currentTopic.name}
                  </Typography>
                </Stack>
                <ArrowDropDown
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: 'small',
                  }}
                />
                {currentTopic.hasUnread && (
                  <Stack
                    sx={{
                      backgroundColor: theme.palette.secondary.main,
                      borderRadius: '50%',
                      height: '6px',
                      marginLeft: '2px',
                      width: '6px',
                    }}
                  />
                )}
              </Button>
            ) : (
              // ButtonGroup when create is enabled
              <ButtonGroup
                sx={{
                  border: `0.5px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
                variant="outlined"
              >
                {/* Only show "Add Topics" button if NOT disabled */}
                {isGeneralTopic && (
                  <>
                    <Button onClick={handleMainButtonClick} sx={mainButtonSx}>
                      <Stack
                        alignItems="center"
                        direction="row"
                        justifyContent="center"
                        spacing={1}
                        sx={topicDisplaySx}
                      >
                        <Typography sx={topicTextSx}>+</Typography>
                        <Typography sx={topicTextSx}>Add Topics</Typography>
                      </Stack>
                    </Button>

                    <Divider
                      orientation="vertical"
                      sx={{ height: '28px', margin: '0 4px' }}
                    />
                  </>
                )}

                {/* Show current topic if not general */}
                {!isGeneralTopic && (
                  <>
                    <Button onClick={handleMainButtonClick} sx={mainButtonSx}>
                      <Stack
                        alignItems="center"
                        direction="row"
                        justifyContent="center"
                        spacing={1}
                        sx={topicDisplaySx}
                      >
                        <Typography sx={topicTextSx}>#</Typography>
                        <Typography sx={topicTextSx}>
                          {currentTopic.name}
                        </Typography>
                      </Stack>
                    </Button>

                    <Divider
                      orientation="vertical"
                      sx={{ height: '28px', margin: '0 4px' }}
                    />
                  </>
                )}

                {/* Always show dropdown button */}
                <Button
                  onClick={handleTopicSelectorClick}
                  size="small"
                  sx={{
                    border: `0.5px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    gap: 1,
                    minWidth: 'auto',
                    padding: '4px 8px',
                  }}
                >
                  <ArrowDropDown
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: 'small',
                    }}
                  />
                  {currentTopic.hasUnread && (
                    <Stack
                      sx={{
                        backgroundColor: theme.palette.secondary.main,
                        borderRadius: '50%',
                        height: '6px',
                        marginLeft: '2px',
                        width: '6px',
                      }}
                    />
                  )}
                </Button>
              </ButtonGroup>
            )}

            {/* {inlineRecentTopics.length > 0 && (
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: 'small',
                    fontWeight: theme.typography.fontWeightMedium,
                  }}
                >
                  Recent Topics:
                </Typography>
                {inlineRecentTopics.map((topic) => (
                  <Chip
                    key={topic.id}
                    label={
                      <Typography
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: 'small',
                        }}
                      >
                        #
                        <span
                          style={{
                            color: theme.palette.text.primary,
                            marginLeft: '4px',
                          }}
                        >
                          {topic.name}
                        </span>
                      </Typography>
                    }
                    onClick={handleInlineTopicClick(topic)}
                    sx={{
                      '& .MuiChip-label': { padding: 0 },
                      '&:hover': {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.15,
                        ),
                      },
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      border: 'none',
                      borderRadius: 1,
                      cursor: 'pointer',
                      height: 'auto',
                      padding: '2px 8px',
                    }}
                  />
                ))}
              </Stack>
            )} */}
          </Stack>

          {children ? (
            children
          ) : (
            <Stack alignItems="center" direction="row" spacing={2}>
              {renderPinnedMessages && (
                <IconButton onClick={handlePinnedButtonClick}>
                  <PushPinOutlined sx={{ fontSize: '20px' }} />
                </IconButton>
              )}
              {searchConfig && <MessageSearch {...searchConfig} />}
            </Stack>
          )}
        </Stack>

        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          autoFocus={false}
          onClose={handleClose}
          onMouseDown={handleMouseDown}
          open={open}
          slotProps={{
            paper: {
              style: {
                maxWidth: '100%',
                minWidth: 200,
                padding: '4px',
              },
            },
          }}
        >
          {menuContent === 'create' ? (
            <TopicCreationForm
              cancelButtonText="Cancel"
              isLoading={false}
              onCancel={handleClose}
              onSubmit={handleTopicCreated}
              placeholder="Topic Title"
              submitButtonText="Create"
            />
          ) : (
            [
              ...(!disableCreate
                ? [
                    <ListItem
                      disablePadding={true}
                      key="new-topic-item"
                      sx={{ width: '100%' }}
                    >
                      <ListItemButton
                        onClick={handleNewTopicClick}
                        sx={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0px',
                          width: '100%',
                        }}
                      >
                        <ListItemText
                          disableTypography={true}
                          primary={
                            <Typography
                              sx={{
                                color: theme.palette.primary.main,
                                fontSize: 'small',
                                fontWeight: theme.typography.fontWeightMedium,
                                textAlign: 'center',
                                width: '100%',
                              }}
                            >
                              <Add
                                sx={{ fontSize: '12px', marginRight: '4px' }}
                              />
                              New Topic
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>,

                    <Divider key="divider-1" sx={{ margin: '4px 0' }} />,
                  ]
                : []),

              <Stack
                key="recent-topics-header"
                sx={{ padding: '8px 16px 4px' }}
              >
                <Typography
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  Recent Topics
                </Typography>
              </Stack>,

              <Stack
                key="topics-list"
                sx={{ maxHeight: 200, overflowY: 'auto' }}
              >
                {displayedTopics.length === 0 ? (
                  <ListItem disablePadding={true}>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: 'small',
                            fontStyle: 'italic',
                            padding: '16px',
                            textAlign: 'center',
                          }}
                        >
                          No topics yet
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  displayedTopics.map((topic) => (
                    <ListItem disablePadding={true} key={topic.id}>
                      <ListItemButton
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTopicSelect(topic)
                        }}
                        sx={{ pr: 1, py: 0.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 'unset', mr: 1 }}>
                          <Typography
                            sx={{
                              color: theme.palette.text.secondary,
                              fontSize: 'small',
                              fontWeight: 700,
                            }}
                          >
                            #
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={topic.name}
                          primaryTypographyProps={{
                            color: theme.palette.text.primary,
                            fontSize: 'small',
                          }}
                        />
                        {topic.hasUnread && (
                          <Stack
                            sx={{
                              backgroundColor: theme.palette.secondary.main,
                              borderRadius: '50%',
                              height: '6px',
                              marginRight: '8px',
                              width: '6px',
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </Stack>,

              ...(hasMoreTopics
                ? [
                    <Divider key="divider-2" sx={{ margin: '4px 0' }} />,
                    <ListItem
                      disablePadding={true}
                      key="see-all-item"
                      sx={{ width: '100%' }}
                    >
                      <ListItemButton
                        onClick={(e) => {
                          e.stopPropagation()
                          onSeeAllTopics?.()
                          setOpenTopicsModal(true)
                          handleClose()
                        }}
                        sx={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0px',
                          width: '100%',
                        }}
                      >
                        <ListItemText
                          disableTypography={true}
                          primary={
                            <Typography
                              sx={{
                                color: theme.palette.primary.main,
                                fontSize: 'small',
                                fontWeight: theme.typography.fontWeightMedium,
                                textAlign: 'center',
                                width: '100%',
                              }}
                            >
                              See All Topics
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>,
                  ]
                : []),
            ]
          )}
        </Menu>

        {renderPinnedMessages?.({
          anchorEl: pinnedAnchorEl,
          onClose: handlePinnedClose,
          onMouseDown: handleMouseDown,
          open: pinnedOpen,
        })}
      </Stack>
      <TopicsModal
        isOpen={openTopicsModal}
        onClose={() => setOpenTopicsModal(false)}
        onTopicSelect={handleTopicSelectViaModal}
        topicType={TopicEntityType.Thread}
      />
    </>
  )
}
