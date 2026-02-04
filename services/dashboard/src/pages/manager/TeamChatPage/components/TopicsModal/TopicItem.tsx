import {
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  DeleteOutlined,
  EditOutlined,
} from '@mui/icons-material'
import {
  alpha,
  AvatarGroup,
  Box,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Button } from '@zunou-react/components/form/Button'
import { IconButton } from '@zunou-react/components/form/IconButton'
import Avatar from '@zunou-react/components/utility/Avatar'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { Descendant } from 'slate'

import pulseLogo from '~/assets/pulse-logo.png'
import { formatUnreadCount } from '~/utils/formatUnreadCount'
import { serializeToHTML } from '~/utils/textUtils'

interface TopicMember {
  id: string
  name: string
  avatar?: string
}

interface TopicLatestMessage {
  id: string
  sender: string
  content: string
  timestamp: string
  gravatar?: string
  isAIGenerated?: boolean
}

interface TopicListItem {
  id: string
  name: string
  unreadCount: number
  members: TopicMember[]
  latestMessage?: TopicLatestMessage
}

interface TopicItemProps {
  topic: TopicListItem
  onTopicClick: (topic: {
    id: string
    name: string
    unreadCount?: number
  }) => void
  onDeleteConfirm: (topicId: string) => Promise<void>
  onSave?: (topicId: string, newName: string) => Promise<void>
  isSaving?: boolean
  isDeleting?: boolean
}

export const TopicItem = ({
  topic,
  onTopicClick,
  onDeleteConfirm,
  onSave,
  isSaving = false,
  isDeleting = false,
}: TopicItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeletingState, setIsDeletingState] = useState(false)
  const [editName, setEditName] = useState(topic.name)

  // Sync editName with topic.name when topic changes
  useEffect(() => {
    if (!isEditing) {
      setEditName(topic.name)
    }
  }, [topic.name, isEditing])

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isEditing) {
      // Cancel edit
      setIsEditing(false)
      setEditName(topic.name)
    } else {
      // Start edit
      setIsEditing(true)
      setEditName(topic.name)
    }
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onSave || !editName.trim()) return

    try {
      await onSave(topic.id, editName.trim())
      setIsEditing(false)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setEditName(topic.name)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeletingState(true)
  }

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await onDeleteConfirm(topic.id)
      setIsDeletingState(false)
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeletingState(false)
  }

  return (
    <Stack
      sx={{
        border: 1,
        borderColor: theme.palette.divider,
        borderRadius: 2,
        marginBottom: 1,
        padding: 2,
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        sx={{ marginBottom: '12px' }}
      >
        <Typography
          sx={{
            color: theme.palette.text.primary,
            fontSize: 'small',
            fontWeight: theme.typography.fontWeightBold,
          }}
        >
          {topic.name}
        </Typography>
        <Stack alignItems="center" direction="row" gap={1}>
          {topic.id !== 'general' && (
            <Stack alignItems="center" direction="row" gap={1}>
              {!isDeletingState && (
                <IconButton
                  onClick={isEditing ? handleCancel : handleEditClick}
                  size="small"
                >
                  {isEditing ? (
                    <CloseIcon sx={{ fontSize: '20px' }} />
                  ) : (
                    <EditOutlined sx={{ fontSize: '20px' }} />
                  )}
                </IconButton>
              )}
              {!isEditing && (
                <IconButton
                  onClick={
                    isDeletingState ? handleDeleteCancel : handleDeleteClick
                  }
                  size="small"
                >
                  {isDeletingState ? (
                    <CloseIcon sx={{ fontSize: '20px' }} />
                  ) : (
                    <DeleteOutlined sx={{ fontSize: '20px' }} />
                  )}
                </IconButton>
              )}
            </Stack>
          )}
          <Stack
            sx={{
              backgroundColor:
                topic.unreadCount > 0
                  ? theme.palette.secondary.main
                  : alpha(theme.palette.text.secondary, 0.1),
              borderRadius: '12px',
              color:
                topic.unreadCount > 0
                  ? theme.palette.common.white
                  : theme.palette.text.primary,
              fontSize: 'small',
              padding: '3px 8px',
              textAlign: 'center',
            }}
          >
            {formatUnreadCount(topic.unreadCount)}
          </Stack>
        </Stack>
      </Stack>

      {isEditing && (
        <Stack
          spacing={1}
          sx={{
            backgroundColor: alpha(theme.palette.secondary.main, 0.04),
            marginBottom: '12px',
            padding: 1,
          }}
        >
          <Typography
            sx={{
              color: theme.palette.text.primary,
              fontSize: 'small',
              fontWeight: theme.typography.fontWeightBold,
            }}
          >
            Edit Title
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              autoFocus={true}
              fullWidth={true}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Topic Name"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: 'small',
                },
              }}
              value={editName}
            />
            <Button
              disabled={!editName.trim() || isSaving}
              onClick={handleSave}
              size="small"
              variant="contained"
            >
              Save
            </Button>
          </Stack>
        </Stack>
      )}

      {isDeletingState && (
        <Stack
          marginBottom="12px"
          padding={1}
          sx={{ backgroundColor: alpha(theme.palette.error.main, 0.04) }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              backgroundColor: 'white',
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.1),
              justifyContent: 'space-between',
              padding: 2,
            }}
          >
            <Typography
              sx={{
                color: theme.palette.text.secondary,
                fontSize: 'small',
              }}
            >
              Are you sure you want to delete &quot;{topic.name}&quot;? This
              action cannot be undone.
            </Typography>
            <Button
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.secondary.dark,
                },
                backgroundColor: theme.palette.secondary.main,
              }}
              variant="contained"
            >
              Delete Topic
            </Button>
          </Stack>
        </Stack>
      )}

      <Stack
        spacing={2}
        sx={{
          alignItems: 'flex-start',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          marginBottom: '12px',
        }}
      >
        {topic.members && topic.members.length > 0 && (
          <AvatarGroup
            max={4}
            sx={{
              '& .MuiAvatar-root': {
                fontSize: 'small',
                height: 32,
                width: 32,
              },
            }}
          >
            {topic.members.map((member: TopicMember) => (
              <Avatar
                alt={member.name}
                key={member.id}
                src={member.avatar}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.common.white,
                }}
              >
                {member.name.charAt(0)}
              </Avatar>
            ))}
          </AvatarGroup>
        )}

        {topic.latestMessage && topic.latestMessage.content ? (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ minWidth: 0, width: '100%' }}
          >
            {(() => {
              return (
                <>
                  <Avatar
                    placeholder=""
                    src={
                      topic.latestMessage.isAIGenerated
                        ? pulseLogo
                        : topic.latestMessage?.gravatar || undefined
                    }
                    sx={{
                      backgroundColor: theme.palette.secondary.main,
                      color: theme.palette.common.white,
                      flexShrink: 0,
                      fontSize: '8px',
                      height: 20,
                      width: 20, // Prevent avatar from shrinking
                    }}
                  >
                    {topic.latestMessage.sender?.charAt(0) || '?'}
                  </Avatar>

                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      flex: 1,
                      minWidth: 0,
                      // Allow flex child to shrink below content size
                      overflow: 'hidden',
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        color: theme.palette.text.primary,
                        flexShrink: 0,
                        fontSize: 'small',
                        fontWeight: theme.typography.fontWeightBold,
                        marginRight: '4px', // Keep sender name visible
                      }}
                    >
                      {topic.latestMessage.isAIGenerated
                        ? 'Pulse'
                        : topic.latestMessage.sender}
                      :
                    </Typography>
                    <Box
                      component="span"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          try {
                            const parsed = JSON.parse(
                              topic.latestMessage?.content ?? '',
                            )

                            if (Array.isArray(parsed)) {
                              return serializeToHTML(parsed as Descendant[])
                            }

                            return parsed.message
                          } catch {
                            // Not JSON → fallback to plain text
                          }
                          return topic.latestMessage?.content ?? ''
                        })(),
                      }}
                      sx={{
                        '& p': { margin: 0 },
                        color: theme.palette.text.primary,
                        fontSize: 'small',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', // Allow this to shrink and truncate
                      }}
                    />
                  </Box>
                </>
              )
            })()}
          </Stack>
        ) : (
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 'small',
              fontStyle: 'italic',
            }}
          >
            No messages yet
          </Typography>
        )}
      </Stack>

      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '12px',
          }}
          variant="caption"
        >
          {topic.latestMessage?.timestamp || ''}
        </Typography>
        <IconButton
          aria-label="open topic"
          onClick={(e) => {
            e.stopPropagation()
            onTopicClick({
              id: topic.id,
              name: topic.name,
              unreadCount: topic.unreadCount,
            })
          }}
          size="small"
        >
          <ChevronRightIcon
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '20px',
            }}
          />
        </IconButton>
      </Stack>
    </Stack>
  )
}
