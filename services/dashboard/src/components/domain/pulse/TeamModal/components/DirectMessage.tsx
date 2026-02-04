import { Close } from '@mui/icons-material'
import { alpha, Divider, IconButton, Stack, Typography } from '@mui/material'
import { ChatInput } from '@zunou-react/components/layout/ChatInput'
import { theme } from '@zunou-react/services/Theme'
import { useCallback, useRef, useState } from 'react'

import { DeleteMessageModal } from '~/components/ui/DeleteMessageModal'
import { usePusherContext } from '~/context/PusherContext'
import { useOrganization } from '~/hooks/useOrganization'

import { useDirectMessage } from '../hooks'
import { DirectMessageList } from './DirectMessageList'

interface Props {
  userId: string
  vitalsMode: boolean
}

export const DirectMessage = ({ userId, vitalsMode }: Props) => {
  const { organizationId } = useOrganization()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<{
    id: string
    content: string
    gravatar?: string | null
    name: string
  } | null>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    handleSubmit: handleSubmitForm,
    control,
    register,
    reset,
    isValid,
    isGetOrCreateThreadLoading,
    handleEditMessage,
    handleDeleteMessage,
    editingMessage,
    setEditingMessage,
    threadId,
    refreshMessages,
    isLoading,
    loadMore,
    isLoadingMore,
    currentPage,
    totalPages,
  } = useDirectMessage({
    memberId: userId,
    organizationId: organizationId || '',
  })

  const handleRefreshMessages = useCallback(() => {
    refreshMessages()
  }, [refreshMessages])

  const { typingUsers, handleTyping } = usePusherContext().usePusherChat({
    channelName: threadId ? `direct.thread.${threadId}` : '',
    messageEventNames: [
      '.direct-message-sent',
      '.direct-message-updated',
      '.direct-message-deleted',
    ],
    onMessageEvent: () => {
      handleRefreshMessages()
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

  // Infinite scroll sentinel logic
  const showLoadMore = currentPage < totalPages && !isGetOrCreateThreadLoading

  return (
    <Stack height="100%" spacing={2}>
      <Stack
        flex={1}
        ref={messageContainerRef}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        <DirectMessageList
          isLoading={!threadId && isGetOrCreateThreadLoading}
          isLoadingMore={isLoadingMore}
          loadMore={loadMore}
          messages={messages}
          onDeleteMessage={(messageId) => {
            const message = messages.find((m) => m.id === messageId)
            handleDeleteClick(
              messageId,
              message?.content || '',
              message?.sender?.gravatar,
              message?.sender?.name || '',
            )
          }}
          onEditMessage={handleEditMessage}
          showLoadMore={showLoadMore}
          vitalsMode={vitalsMode}
        />
      </Stack>
      <Stack direction="row" px={5} spacing={2}>
        {typingUsers && typingUsers.size > 0 && (
          <Typography color="text.secondary" variant="caption">
            {typingUsers.size === 1
              ? `${Array.from(typingUsers)[0]} is typing...`
              : typingUsers.size === 2
                ? `${Array.from(typingUsers).join(' and ')} are typing...`
                : typingUsers.size <= 3
                  ? `${Array.from(typingUsers).slice(0, -1).join(', ')} and ${Array.from(typingUsers).slice(-1)[0]} are typing...`
                  : 'Several users are typing...'}
          </Typography>
        )}
      </Stack>
      <Divider
        sx={{
          borderColor: alpha(theme.palette.primary.main, 0.2),
        }}
      />
      <Stack bottom={0} left={0} position="sticky" right={0} zIndex={1}>
        {editingMessage && (
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            sx={{ px: 2, py: 1 }}
          >
            <Typography color="text.secondary" variant="caption">
              Editing message...
            </Typography>
            <IconButton
              onClick={() => {
                setEditingMessage(null)
                reset({ message: '' })
              }}
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'transparent',
                },
                color: 'text.secondary',
              }}
            >
              <Close />
            </IconButton>
          </Stack>
        )}
        <ChatInput
          control={control}
          editingMessage={editingMessage}
          handleSubmit={handleSubmitForm as unknown as () => void}
          isDirectMessage={true}
          isLoadingSubmission={isLoading}
          isValid={isValid}
          onTyping={handleTyping}
          placeholder={editingMessage ? editingMessage.content : undefined}
          register={register}
          reset={reset}
        />
      </Stack>
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
  )
}
