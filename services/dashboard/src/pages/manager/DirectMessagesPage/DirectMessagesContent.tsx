import {
  ConnectWithoutContactOutlined,
  ForumOutlined,
  Grade,
  PushPinOutlined,
  // SearchOutlined,
  StarBorderOutlined,
} from '@mui/icons-material'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { TeamMessage, UserPresence } from '@zunou-graphql/core/graphql'
import { Form } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { pathFor } from '@zunou-react/services/Routes'
import { useCallback, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { ReactEditor } from 'slate-react'

import { DeleteMessageModal } from '~/components/ui/DeleteMessageModal'
import { SlateInput } from '~/components/ui/form/SlateInput'
import { useDirectMessages } from '~/context/DirectMessagesContext'
import { usePusherContext } from '~/context/PusherContext'
import { useOrganization } from '~/hooks/useOrganization'
import { DirectMessagePinnedMessagesDropdown } from '~/pages/manager/DirectMessagesPage/components/DirectMessagePinnedMessagesDropdown'
import { Routes } from '~/services/Routes'
import { getPresenceColor } from '~/utils/presenceUtils'
import { getFirstLetter } from '~/utils/textUtils'

import { ChatMessageList } from '../TeamChatPage/components/MessageList'
import ReplyingToPreview from '../TeamChatPage/components/ReplyingToPreview'
import { DirectMessageSkeleton } from './DirectMessageSkeleton'
import { useDirectMessage, usePinOrganizationUser } from './hooks'
import { transformDirectMessagesToTeamMessages } from './utils'

export const DirectMessagesContent = () => {
  const { activeUserId, activeUser, setActiveUser } = useDirectMessages()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<{
    id: string
    content: string
    gravatar?: string | null
    name: string
  } | null>(null)
  const [pinnedAnchorEl, setPinnedAnchorEl] = useState<HTMLElement | null>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const slateEditorRef = useRef<ReactEditor | null>(null)

  const {
    messages,
    handleSubmit: handleSubmitForm,
    control,
    reset,
    isValidContent,
    handleDeleteMessage,
    handleEditMessage,
    handlePinMessage,
    handleReaction,
    handleUnpinMessage,
    isLoadingPinnedMessages,
    pinnedMessagesData,
    threadId,
    refreshMessages,
    isInitialLoading,
    attachments,
    clearAttachments,
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    isUploadingFiles,
    replyingToMessage,
    handleSetReplyingToMessage,
    handleClearReplyingToMessage,
  } = useDirectMessage({
    organizationId: organizationId || '',
    userId: activeUserId,
  })
  const handleRefreshMessages = useCallback(() => {
    refreshMessages()
  }, [refreshMessages])

  const { handleTogglePinUser } = usePinOrganizationUser({
    onError: (error) => {
      console.error('Failed to toggle pin:', error)
      const wasPinned = activeUser?.isPinned
      toast.error(`Could not ${wasPinned ? 'unstar' : 'star'} member.`)
    },
    onSuccess: () => {
      const wasPinned = activeUser?.isPinned
      setActiveUser((prev) =>
        prev ? { ...prev, isPinned: !prev.isPinned } : prev,
      )
      toast.success(
        `Member ${wasPinned ? 'unstarred' : 'starred'} successfully!`,
      )
    },
    organizationId: organizationId || '',
  })

  const { typingUsers, handleTyping } = usePusherContext().usePusherChat({
    channelName: threadId ? `direct.thread.${threadId}` : '',
    messageEventNames: [
      '.direct-message-sent',
      '.direct-message-updated',
      '.direct-message-deleted',
    ],
    onMessageEvent: () => {
      if (!isInitialLoading) {
        handleRefreshMessages()
      }
    },
    typingEventName: 'direct-user-typing',
  })

  const handleDeleteClick = (
    messageId: string,
    content: string,
    gravatar?: string | null,
    name?: string,
  ) => {
    setMessageToDelete({ content, gravatar, id: messageId, name: name || '' })
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (messageToDelete) {
      handleDeleteMessage(messageToDelete.id)
      setIsDeleteModalOpen(false)
      setMessageToDelete(null)
    }
  }

  const handleToggleStar = () => {
    if (!activeUser?.id) {
      console.warn('Cannot pin user: missing activeUser')
      toast.error('Cannot pin user')
      return
    }

    handleTogglePinUser(activeUser.id, activeUser.isPinned)
  }

  const handleOneToOneClick = () => {
    if (!activeUser?.one_to_one || !organizationId) return
    navigate(
      `/manager/${pathFor({
        pathname:
          user?.id === activeUser.userId
            ? Routes.PulseDetail
            : Routes.PulseTeamChat,
        query: {
          organizationId,
          pulseId: activeUser.one_to_one,
        },
      })}`,
    )
  }

  const handlePinnedClick = (event: React.MouseEvent<HTMLElement>) => {
    setPinnedAnchorEl(event.currentTarget)
  }

  const handlePinnedClose = () => {
    setPinnedAnchorEl(null)
  }

  const handlePinnedMessageClick = useCallback(() => {
    handlePinnedClose()
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  const handleTogglePinMessage = useCallback(
    (messageId: string) => {
      const message = messages.find((m) => m.id === messageId)

      if (message?.isPinned) {
        handleUnpinMessage(messageId)
      } else {
        handlePinMessage(messageId)
      }
    },
    [messages, handlePinMessage, handleUnpinMessage],
  )

  const transformedMessages: TeamMessage[] = useMemo(() => {
    return transformDirectMessagesToTeamMessages(messages)
  }, [messages])

  if (!activeUserId) {
    return (
      <Stack
        alignItems="center"
        bgcolor="common.white"
        flex={1}
        height="100%"
        justifyContent="center"
        px={2}
      >
        <Typography textAlign="center" variant="h5">
          Start a conversation with a team member
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack bgcolor="common.white" height="100%" width="100%">
      {/* Header */}
      <Stack
        alignItems="center"
        borderBottom="1px solid"
        borderColor="divider"
        direction="row"
        justifyContent="space-between"
        px={2}
        py={1.5}
        spacing={1}
        width="100%"
      >
        <Stack direction="row" spacing={1}>
          <Avatar
            badgeColor={getPresenceColor(
              activeUser?.user.presence ?? UserPresence.Offline,
            )}
            isDarkMode={false}
            placeholder={getFirstLetter(activeUser?.user.name)?.toUpperCase()}
            showBadge={true}
            src={activeUser?.user.gravatar || undefined}
            sx={{ flexShrink: 0, height: 40, width: 40 }}
            variant="circular"
          />
          <Stack>
            <Typography fontWeight="bold" variant="body1">
              {activeUser?.user.name}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Active now
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={handlePinnedClick}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <PushPinOutlined fontSize="inherit" />
          </IconButton>
          {/* <IconButton sx={{ border: '1px solid', borderColor: 'divider' }}>
            <SearchOutlined fontSize="inherit" />
          </IconButton> */}
          {activeUser?.one_to_one && (
            <IconButton
              onClick={handleOneToOneClick}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 6,
                gap: 0.5,
                px: 1.5,
                py: 0.5,
              }}
            >
              <ConnectWithoutContactOutlined fontSize="small" />
              <Typography fontSize="small">One to One</Typography>
            </IconButton>
          )}
          <IconButton
            onClick={handleToggleStar}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            {activeUser?.isPinned ? (
              <Grade fontSize="inherit" />
            ) : (
              <StarBorderOutlined fontSize="inherit" />
            )}
          </IconButton>
        </Stack>
      </Stack>

      {/* Chat Content */}
      <Stack direction="row" flex={1} height="100%" px={8} py={2}>
        <Stack
          flex={1}
          height="100%"
          position="relative"
          spacing={1}
          width="100%"
        >
          {/* Messages */}
          <Box
            ref={messageContainerRef}
            sx={{
              '&::-webkit-scrollbar': { width: '0px' },
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              height: 0,
              overflowY: 'auto',
            }}
          >
            {isInitialLoading ? (
              <DirectMessageSkeleton />
            ) : transformedMessages.length === 0 ? (
              <Stack
                alignItems="center"
                flex={1}
                justifyContent="center"
                spacing={2}
                sx={{
                  flex: '1 1 auto',
                }}
              >
                <ForumOutlined sx={{ color: 'text.secondary', fontSize: 48 }} />
                <Typography color="text.secondary" variant="body2">
                  No messages yet. Start a conversation now.
                </Typography>
              </Stack>
            ) : (
              <ChatMessageList
                handleDeleteMessage={(messageId: string) => {
                  const message = messages.find((m) => m.id === messageId)
                  if (message) {
                    handleDeleteClick(
                      messageId,
                      message.content || '',
                      message.sender?.gravatar,
                      message.sender?.name || '',
                    )
                  }
                  return Promise.resolve()
                }}
                isDeleting={false}
                isMiniPulseChatOpen={false}
                messages={transformedMessages}
                onEditMessage={handleEditMessage}
                onPinMessage={handleTogglePinMessage}
                onReaction={handleReaction}
                onReply={(message) => {
                  handleSetReplyingToMessage(message)
                }}
                onSetReplyThreadId={() => {
                  // No-op: reply threads not used in direct messages
                }}
                onUpdateComplete={refreshMessages}
                organizationId={organizationId || ''}
                showWelcomeMessage={false}
                threadId={threadId || ''}
                type="DIRECT_MESSAGE"
              />
            )}
          </Box>

          {/* Typing indicator */}
          <Stack direction="row" spacing={2}>
            {typingUsers && typingUsers.size > 0 && (
              <Typography color="text.secondary" variant="caption">
                {typingUsers.size === 1
                  ? `${Array.from(typingUsers)[0]} is typing...`
                  : typingUsers.size === 2
                    ? `${Array.from(typingUsers).join(' and ')} are typing...`
                    : typingUsers.size <= 3
                      ? `${Array.from(typingUsers)
                          .slice(0, -1)
                          .join(
                            ', ',
                          )} and ${Array.from(typingUsers).slice(-1)[0]} are typing...`
                      : 'Several users are typing...'}
              </Typography>
            )}
          </Stack>

          {/* Message Input */}
          <Form
            maxWidth="xl"
            onSubmit={handleSubmitForm}
            sx={{ padding: 0, width: '100%' }}
          >
            <Stack>
              {replyingToMessage && (
                <ReplyingToPreview
                  clear={(_) => handleClearReplyingToMessage()}
                  replyingTo={replyingToMessage}
                />
              )}
              <SlateInput
                attachmentFiles={attachments}
                control={control}
                disableAddMenu={attachments.length === 5}
                disableAddMenuTooltip="Upload limit reached. You can attach up to 5 files only."
                disabledSubmit={!isValidContent}
                editorRef={slateEditorRef}
                isLoading={isUploadingFiles}
                mentionSuggestions={[]}
                name="message"
                onCancel={() => {
                  reset()
                  clearAttachments()
                }}
                onFileUpload={handleFileUpload}
                onImageUpload={handleImageUpload}
                onRemoveFile={handleRemoveFile}
                onSubmit={handleSubmitForm}
                onTyping={handleTyping}
                setMentions={() => null}
                showAddMenu={true}
                sx={{
                  borderBottomLeftRadius: 1.5,
                  borderBottomRightRadius: 1.5,
                  borderTopLeftRadius: replyingToMessage ? 0 : 1.5,
                  borderTopRightRadius: replyingToMessage ? 0 : 1.5,
                }}
                type="TEAM_CHAT"
              />
            </Stack>
          </Form>

          {/* Delete Modal */}
          <DeleteMessageModal
            isOpen={isDeleteModalOpen}
            message={{
              content: messageToDelete?.content || '',
              gravatar: messageToDelete?.gravatar,
              name: messageToDelete?.name || '',
            }}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </Stack>
      </Stack>

      {/* Pinned Messages Dropdown */}
      <DirectMessagePinnedMessagesDropdown
        anchorEl={pinnedAnchorEl}
        isLoading={isLoadingPinnedMessages}
        onClose={handlePinnedClose}
        onMessageClick={handlePinnedMessageClick}
        onMouseDown={handleMouseDown}
        onUnpinMessage={handleUnpinMessage}
        open={Boolean(pinnedAnchorEl)}
        pinnedMessagesData={pinnedMessagesData}
      />
    </Stack>
  )
}
