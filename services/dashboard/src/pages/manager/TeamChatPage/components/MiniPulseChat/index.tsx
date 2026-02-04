import { Box, Stack, Typography } from '@mui/material'
import { Form } from '@zunou-react/components/form'
import { InView } from 'react-intersection-observer'
import { useParams } from 'react-router-dom'

import { PulseChatSideTray } from '~/components/domain/pulse/PulseChatSideTray'
import { DeleteMessageModal } from '~/components/ui/DeleteMessageModal'
import { SlateInput } from '~/components/ui/form/SlateInput'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { ReplyThreadMessages } from '~/pages/manager/ReplyThreadPage/components/ReplyThreadMessages'

import ReplyingToPreview from '../ReplyingToPreview'
import { ChatHeader } from './components/ChatHeader'
import { useMiniPulseChat } from './useHook'

interface MiniPulseChatProps {
  openMiniPulseChat: boolean
  setOpenMiniPulseChat: (open: boolean) => void
  replyTeamThreadId: string | null
  setCurrentReplyThreadId: (id: string | null) => void
  currentReplyThreadDate: string | null
  threadTitle: string | undefined
}

export const MiniPulseChat = ({
  openMiniPulseChat,
  setOpenMiniPulseChat,
  replyTeamThreadId,
  setCurrentReplyThreadId,
  currentReplyThreadDate,
  threadTitle,
}: MiniPulseChatProps) => {
  const { pulseId } = useParams()
  const { organizationId } = useOrganization()

  const {
    // UI State
    showSideTray,
    selectedAttachment,
    isDeleteModalOpen,
    messageToDelete,

    // Form
    control,
    isValidContent,
    isPendingCompletionCreation,

    // Messages
    messages,
    isLoadingMessages,
    displayThreadTitle,
    displayThreadDate,
    hasNextPage,
    isFetchingNextPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    hasLoadedLatestPage,
    initialPage,
    lastJumpedMessageId,

    // Refs
    messageContainerRef,
    slateEditorRef,

    // Computed
    mentionSuggestions,
    pulseAction,
    editingMessage,
    typingIndicatorText,
    slateInputBorderRadius,

    // Handlers
    handleConfirmDelete,
    handleCloseMiniPulseChat,
    handleSideTrayClose,
    handleSlateInputSubmit,
    handleAttachmentClick,
    handleDeleteMessage,
    handleFileUpload,
    handleImageUpload,
    handleRemoveFile,
    handleTyping,
    handleCancelEdit,
    handleLoadOldMessagesWithScroll,
    handleLoadNewMessagesWithScroll,
    handleBackToPresent,
    handleClearReplyingTo,
    setMentions,
    setLastJumpedMessageId,
    clearDeleteModal,
    isRefetchingMessages,
    isJumpThreadLoading,
    isJumpThreadRefetching,
  } = useMiniPulseChat({
    currentReplyThreadDate,
    currentReplyThreadId: replyTeamThreadId,
    isMiniPulse: true,
    onCloseMiniPulseChat: () => setOpenMiniPulseChat(false),
    onSetReplyThreadId: setCurrentReplyThreadId,
    organizationId,
    pulseId,
    threadTitle,
  })

  if (!openMiniPulseChat) return null

  // Side tray view
  if (pulseId && showSideTray && selectedAttachment) {
    return (
      <Stack
        sx={{
          height: '83vh',
          maxHeight: 900,
          minHeight: 600,
          width: '100%',
        }}
      >
        <PulseChatSideTray
          attachment={selectedAttachment}
          onClose={handleSideTrayClose}
          organizationId={organizationId}
          pulseId={pulseId}
        />
      </Stack>
    )
  }

  // Main chat view
  return (
    <Stack
      bgcolor="white"
      borderRadius={2}
      gap={1}
      height="100%"
      onClick={() => setLastJumpedMessageId(null)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      width="100%"
    >
      <ChatHeader
        currentReplyThreadDate={displayThreadDate}
        threadTitle={displayThreadTitle}
        toggleMiniPulseChat={handleCloseMiniPulseChat}
      />

      <Stack flex={1} sx={{ display: 'flex', flexDirection: 'column', mx: 2 }}>
        {/* Messages container */}
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
          {/* Load older messages */}
          {hasNextPage && !isLoadingMessages && (
            <InView
              onChange={handleLoadOldMessagesWithScroll}
              threshold={0.1}
              triggerOnce={false}
            >
              {({ ref }) => (
                <div
                  ref={ref}
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    flexShrink: 0,
                    justifyContent: 'center',
                    minHeight: 32,
                  }}
                >
                  {isFetchingNextPage && <LoadingSpinner />}
                </div>
              )}
            </InView>
          )}

          {/* Messages */}
          {replyTeamThreadId && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'end',
              }}
            >
              <ReplyThreadMessages
                handleDeleteMessage={handleDeleteMessage}
                initialPage={
                  hasLoadedLatestPage || !lastJumpedMessageId
                    ? null
                    : initialPage
                }
                isLoading={
                  isLoadingMessages ||
                  isJumpThreadLoading ||
                  isJumpThreadRefetching
                }
                messages={messages}
                onAttachmentClick={handleAttachmentClick}
                onBackToPresent={handleBackToPresent}
                readyToJump={
                  isLoadingMessages &&
                  isRefetchingMessages &&
                  isJumpThreadLoading &&
                  isJumpThreadRefetching
                }
                replyTeamThreadId={replyTeamThreadId}
              />
            </Box>
          )}

          {/* Load newer messages */}
          {hasPreviousPage && !isLoadingMessages && (
            <InView
              onChange={handleLoadNewMessagesWithScroll}
              threshold={0.1}
              triggerOnce={false}
            >
              {({ ref }) => (
                <div
                  ref={ref}
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    flexShrink: 0,
                    justifyContent: 'center',
                    minHeight: 32,
                  }}
                >
                  {isFetchingPreviousPage && <LoadingSpinner />}
                </div>
              )}
            </InView>
          )}
        </Box>

        {/* Typing indicator */}
        {typingIndicatorText && (
          <Stack direction="row" p={1}>
            <Typography color="text.secondary" variant="caption">
              {typingIndicatorText}
            </Typography>
          </Stack>
        )}

        {/* Message input form */}
        <Stack>
          <Form
            maxWidth="xl"
            onSubmit={handleSlateInputSubmit}
            sx={{ padding: 0, width: '100%' }}
          >
            {pulseAction?.replyingToMiniPulseChat && (
              <ReplyingToPreview
                clear={handleClearReplyingTo}
                replyingTo={pulseAction.replyingToMiniPulseChat}
              />
            )}

            <SlateInput
              attachmentFiles={pulseAction?.miniPulseChatAttachments}
              control={control}
              disableAddMenuTooltip="Upload limit reached. You can attach up to 5 files only."
              disabledSubmit={!isValidContent}
              editorRef={slateEditorRef}
              isLoading={isPendingCompletionCreation}
              mentionSuggestions={mentionSuggestions}
              mode={editingMessage ? 'edit' : 'default'}
              name="message"
              onCancel={handleCancelEdit}
              onFileUpload={handleFileUpload}
              onImageUpload={handleImageUpload}
              onRemoveFile={handleRemoveFile}
              onSubmit={handleSlateInputSubmit}
              onTyping={handleTyping}
              setMentions={setMentions}
              showAddMenu={true}
              sx={slateInputBorderRadius}
              type="TEAM_CHAT"
            />
          </Form>
        </Stack>

        {/* Delete confirmation modal */}
        <DeleteMessageModal
          isOpen={isDeleteModalOpen}
          message={{
            content: messageToDelete?.content || '',
            gravatar: messageToDelete?.gravatar,
            messageDate: messageToDelete?.date,
            name: messageToDelete?.name || '',
          }}
          onClose={clearDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      </Stack>
    </Stack>
  )
}
