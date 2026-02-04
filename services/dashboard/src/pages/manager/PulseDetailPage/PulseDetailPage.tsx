import { withAuthenticationRequired } from '@auth0/auth0-react'
import { AutorenewOutlined, LightbulbOutlined } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import {
  MessageRole,
  MessageStatus,
  PulseCategory,
} from '@zunou-graphql/core/graphql'
import { Form } from '@zunou-react/components/form'
import { ErrorHandler } from '@zunou-react/components/utility'
import { useEffect, useMemo, useState } from 'react'
import { InView } from 'react-intersection-observer'

import { ChatHeader, DEFAULT_TOPIC } from '~/components/domain/chatHeader'
import { PulseChatSideTray } from '~/components/domain/pulse/PulseChatSideTray'
import { NavButton } from '~/components/domain/pulse/PulseNavbar/NavButton'
import { useContentParser } from '~/components/domain/threads/MessageListV2/hooks/useContentParser'
import { MessageListV2 } from '~/components/domain/threads/MessageListV2/MessageListV2'
import { SlateInput } from '~/components/ui/form/SlateInput'
import HeaderDecorator from '~/components/ui/HeaderDecorator'
import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { checkIfAIGenerated } from '~/utils/checkIfAIGenerated'

import Insights from './components/Insights'
import OnboardingMessage from './components/OnboardingMessage'
import { useHooks } from './hooks'

const PulseDetailPage = () => {
  const {
    activeThreadId,
    isLoadingMessages,
    isFetchingNextPage,
    hasNextPage,
    containerRef,
    handleAttachmentClick,
    handleDeleteSavedMessage,
    handleLoadMoreMessages,
    handleSaveMessage,
    handleSideTrayClose,
    handleSubmit,
    onSubmit,
    handleSummaryOptionSelect,
    isPendingCompletionCreation,
    messages,
    latestMessage,
    selectedAttachment,
    showSideTray,
    organizationId,
    pulseId,
    user,
    control,
    attachmentType,
    pulseDelayedLoader,
    topics,
    setCurrentPulseTopic,
    currentPulseTopic,
    pulseCategory,
    threadId,
    showOnboardingMessage,
    isPulseRefreshDisabled,
    createNewThread,
    pulseChatMode,
    setPulseChatMode,
    isValid,
    insightsLength,
  } = useHooks()

  const MAX_WIDTH = 800

  const { parseContent } = useContentParser()

  const isInputDisabled =
    !isValid ||
    isLoadingMessages ||
    isPendingCompletionCreation ||
    !activeThreadId ||
    (latestMessage &&
      (latestMessage.status === MessageStatus.Pending ||
        latestMessage.role === MessageRole.User))

  const [isInteractiveOverride, setIsInteractiveOverride] = useState(false)

  // If latest message is from AI and requires interaction
  const isLatestMessageInteractive = useMemo(() => {
    // If manually overridden, return false
    if (isInteractiveOverride) return false

    if (!latestMessage) return false

    const parsed = parseContent(latestMessage?.content ?? '')
    const isAIGenerated = checkIfAIGenerated(latestMessage.role)

    const isUIComponent = parsed?.type === 'UI'
    const isInteractive =
      isUIComponent &&
      parsed.ui?.type !== 'references' &&
      parsed.ui?.type !== 'new_topic'
    return isAIGenerated && isInteractive
  }, [latestMessage, isInteractiveOverride, parseContent])

  // Add the manual override function
  const forceDisableInteractive = () => {
    setIsInteractiveOverride(true)
  }

  // const forwardSubmit = ({
  //   message,
  // }: {
  //   message: string
  //   files?: FileList
  // }) => {
  //   console.log('message', message)

  //   handleSubmit({ message })
  // }

  const renderHeader = () => {
    if (pulseCategory === PulseCategory.Personal)
      return (
        <ChatHeader
          currentTopic={currentPulseTopic}
          disableCreate={true}
          onGeneralClick={() => setCurrentPulseTopic(DEFAULT_TOPIC)}
          onTopicChange={(topic) => setCurrentPulseTopic(topic)}
          recentTopics={topics?.data?.topics.data.map((topic) => ({
            hasUnread: false,
            id: topic.id,
            name: topic.name,
            threadId: topic.thread?.id,
          }))}
          // renderPinnedMessages={(props) => (
          //   <TeamPinnedMessagesDropdown
          //     anchorEl={props.anchorEl}
          //     isLoading={false}
          //     open={props.open}
          //     onClose={props.onClose}
          //     onMessageClick={() => console.log('Message Clicked!')}
          //     pinnedMessagesData={undefined}
          //   />
          // )}
          // searchConfig={{
          //   onClear: handleOnClear,
          //   onSearch: handleOnSearch,
          //   placeholder: 'Search messages',
          // }}
        >
          <Stack alignItems="center" direction="row" gap={2}>
            {pulseChatMode === 'CHAT' && insightsLength > 0 && (
              <NavButton
                customSx={{
                  color: 'primary.main',
                  fontSize: 'small',
                  fontWeight: 400,
                  px: 1.5,
                }}
                label="View All Insights"
                onClick={() => setPulseChatMode('INSIGHTS')}
                outlined={false}
                startIcon={<LightbulbOutlined fontSize="small" />}
              />
            )}

            <NavButton
              customSx={{
                fontSize: 'small',
                fontWeight: 400,
                px: 1.5,
              }}
              disabled={
                isPulseRefreshDisabled || currentPulseTopic.id !== 'general'
              }
              label="Refresh"
              onClick={createNewThread}
              outlined={false}
              startIcon={<AutorenewOutlined fontSize="small" />}
            />
          </Stack>
        </ChatHeader>
      )

    return null
  }

  useEffect(() => {
    setIsInteractiveOverride(false)
  }, [latestMessage?.id])

  if (!activeThreadId || isLoadingMessages) {
    return (
      <Stack alignItems="center" flex={1} height="100%" justifyContent="center">
        <LoadingSpinner />
      </Stack>
    )
  }

  if (pulseChatMode === 'INSIGHTS' && !showOnboardingMessage)
    return (
      <Stack height="100%">
        {renderHeader()}
        <Insights
          control={control}
          handleSubmit={handleSubmit}
          isInputDisabled={isInputDisabled}
          maxInputWidth={MAX_WIDTH}
          onSubmit={onSubmit}
        />
      </Stack>
    )

  return (
    <ErrorHandler>
      <Stack height="100%" position="relative">
        {renderHeader()}
        <Stack
          direction="row"
          height="100%"
          justifyContent="center"
          p={2}
          pb={0}
          spacing={2}
          width="100%"
        >
          <Stack
            alignItems="center"
            flex={1}
            height="100%"
            position="relative"
            px={2}
            spacing={2}
            width="100%"
          >
            {
              <Box
                ref={containerRef}
                sx={{
                  '&::-webkit-scrollbar': { width: '0px' },
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  height: 0,
                  maxWidth: showOnboardingMessage ? undefined : MAX_WIDTH,
                  overflowY: 'auto',
                  width: '100%',
                }}
              >
                {
                  // !welcomeMsgState || isLoadingMessages || !activeThreadId ? (
                  //   <Stack
                  //     alignItems="center"
                  //     height="100%"
                  //     justifyContent="center"
                  //     width="100%"
                  //   >
                  //     <LoadingSpinner />
                  //   </Stack>
                  // ) : !currentPulseTopic.threadId &&
                  //   (welcomeMsgState === ShowPulseWelcomeState.Show ||
                  //     welcomeMsgState === ShowPulseWelcomeState.FirstTime) ? (
                  //   <WelcomeMessage onReturn={handleReturnToPulseChat} />
                  // ) :
                  showOnboardingMessage &&
                  pulseCategory === PulseCategory.Personal ? (
                    <OnboardingMessage />
                  ) : (
                    <>
                      {messages.length === 0 && (
                        <Stack
                          alignItems="center"
                          justifyContent="center"
                          marginBottom={4}
                          mt="auto"
                          spacing={3}
                        >
                          <Typography
                            fontWeight="medium"
                            textAlign="center"
                            variant="h4"
                          >
                            {user
                              ? `Good day, ${user?.name.split(' ')[0]}!`
                              : 'Good day!'}
                          </Typography>
                          <HeaderDecorator />
                        </Stack>
                      )}
                      <InView
                        onChange={handleLoadMoreMessages}
                        skip={
                          !hasNextPage ||
                          isFetchingNextPage ||
                          isLoadingMessages
                        }
                        threshold={0.1}
                        triggerOnce={false}
                      >
                        {({ ref }) =>
                          isFetchingNextPage && messages.length > 0 ? (
                            <Stack
                              ref={ref}
                              sx={{
                                alignItems: 'center',
                                display: 'flex',
                                justifyContent: 'center',
                                minHeight: 32,
                                pb: 5,
                                pt: 2.5,
                              }}
                            >
                              <LoadingSpinner />
                            </Stack>
                          ) : (
                            <div ref={ref} />
                          )
                        }
                      </InView>
                      {messages.length > 0 && (
                        <MessageListV2
                          forceDisableInteractive={forceDisableInteractive}
                          messages={messages}
                          onAttachmentClick={handleAttachmentClick}
                          onDeleteSavedMessage={handleDeleteSavedMessage}
                          onSaveMessage={handleSaveMessage}
                          onSummaryOptionSelect={handleSummaryOptionSelect}
                          showMessageLoader={!pulseDelayedLoader.isShowing}
                          threadId={threadId}
                        />
                      )}
                    </>
                  )
                }
              </Box>
            }
            <Box
              sx={{
                flexShrink: 0,
                maxWidth: MAX_WIDTH,
                pb: 2,
                width: '100%',
              }}
            >
              <Stack className="joyride-onboarding-tour-3" width="100%">
                {/* <MessageField
                  control={control}
                  disabled={isLatestMessageInteractive}
                  handleSubmit={handleSubmit}
                  isLoadingSubmission={
                    isLoadingMessages ||
                    isLatestMessageInteractive ||
                    isPendingCompletionCreation ||
                    !activeThreadId ||
                    (latestMessage &&
                      (latestMessage.status === MessageStatus.Pending ||
                        latestMessage.role === MessageRole.User))
                  }
                  isValid={
                    isValid &&
                    Boolean(activeThreadId) &&
                    !isLatestMessageInteractive
                  }
                  placeholder={
                    isLatestMessageInteractive
                      ? 'Please interact with pulse to proceed'
                      : undefined
                  }
                  register={register}
                /> */}
                <Form maxWidth={false} onSubmit={handleSubmit(onSubmit)}>
                  <SlateInput
                    control={control}
                    disabledSubmit={
                      isInputDisabled || isLatestMessageInteractive
                    }
                    name="message"
                    onSubmit={handleSubmit(onSubmit)}
                    placeholder={
                      isLatestMessageInteractive
                        ? 'Interact with pulse to proceed'
                        : 'How can I help you today?'
                    }
                    plainTextMode={true}
                    sx={{
                      borderRadius: 3,
                    }}
                    type="PULSE_CHAT"
                  />
                </Form>
              </Stack>
            </Box>
          </Stack>
          {pulseId && showSideTray && selectedAttachment && (
            <Stack
              maxHeight="calc(100vh - 156px)"
              maxWidth={560}
              minWidth={400}
              width="33%"
            >
              <PulseChatSideTray
                attachment={selectedAttachment}
                attachmentType={attachmentType}
                onClose={handleSideTrayClose}
                organizationId={organizationId}
                pulseId={pulseId}
              />
            </Stack>
          )}
        </Stack>
      </Stack>
    </ErrorHandler>
  )
}

export default withAuthenticationRequired(PulseDetailPage, {
  onRedirecting: () => <div>Signing in...</div>,
})
