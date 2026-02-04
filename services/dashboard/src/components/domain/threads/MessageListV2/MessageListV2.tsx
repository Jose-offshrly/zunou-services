import { alpha, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  type Message,
  MessageRole,
  MessageStatus,
} from '@zunou-graphql/core/graphql'
import { AttachmentData } from '@zunou-react/components/form'
import {
  ContentType,
  PulseChatUI,
} from '@zunou-react/components/form/FormattedContent'
import Avatar from '@zunou-react/components/utility/Avatar'
import { TypingIndicator } from '@zunou-react/components/utility/TypingIndicator'
import { useEffect, useMemo, useRef, useState } from 'react'

import pulseLogo from '~/assets/pulse-logo.png'
import { checkIfAIGenerated } from '~/utils/checkIfAIGenerated'

import { KeyPointsMessage, SummaryOption } from './aiMessages/KeyPointsMessage'
import LoaderMessage from './aiMessages/LoaderMessage'
import { MessageContent } from './components/MessageContent'
import Retry from './components/Retry'
import SaveButton from './components/SaveButton'
import { useContentParser } from './hooks/useContentParser'
import { useSummaryOptions } from './hooks/useSummaryOptions'

interface MessageListProps {
  messages: Message[]
  lastMessageElementRef?: (node: HTMLDivElement | null) => void
  onAttachmentClick?: (attachment: AttachmentData, type?: ContentType) => void
  onSaveMessage: (id: string) => Promise<void>
  onDeleteSavedMessage: (id: string) => Promise<void>
  onSummaryOptionSelect?: (option: SummaryOption) => void
  showMessageLoader?: boolean
  forceDisableInteractive: () => void
  threadId: string | null
}

export const MessageListV2 = ({
  lastMessageElementRef,
  messages,
  onAttachmentClick,
  onSaveMessage,
  onDeleteSavedMessage,
  onSummaryOptionSelect,
  showMessageLoader = true,
  forceDisableInteractive,
  threadId,
}: MessageListProps) => {
  const theme = useTheme()
  const { summaryOptionsMap, handleSummaryOptionSelect, updateSummaryOptions } =
    useSummaryOptions({ onSummaryOptionSelect })
  const { parseContent } = useContentParser()

  const [disableInteraction, setDisableInteraction] = useState(false)

  // Track messages that should be hidden due to pending + showMessageLoader=false
  const hiddenPendingMessages = useRef<Map<string, boolean>>(new Map())

  const latestMessage = useMemo(
    () => messages[messages.length - 1] ?? null,
    [messages],
  )
  const latestUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === MessageRole.User) {
        return messages[i]
      }
    }
    return null
  }, [messages])

  useEffect(() => {
    setDisableInteraction(false)
  }, [latestMessage?.id])

  const forceDisableInteractiveHandler = () => {
    forceDisableInteractive()
    setDisableInteraction(true)
  }

  return (
    <Stack gap={4} marginX="auto" minHeight="20%" width="100%">
      {messages?.map(
        (
          { id, content, is_saved, role, status, savedMessages, topic_id },
          index,
        ) => {
          /**
           *  Logic to stop flickering between ordinary loader and delayed loader
           */
          // If message is pending and showMessageLoader is false, mark it as hidden
          if (status === MessageStatus.Pending && !showMessageLoader) {
            hiddenPendingMessages.current.set(id, true)
          }
          // If message becomes Complete, remove it from hidden list (allow it to show)
          if (status === MessageStatus.Complete) {
            hiddenPendingMessages.current.delete(id)
          }
          // If this message is marked as hidden, return LoaderMessage
          if (hiddenPendingMessages.current.get(id)) {
            return <LoaderMessage key={id} />
          }

          const isAIGenerated = checkIfAIGenerated(role)
          const parsedContent = parseContent(content ?? '')

          const isUIComponent = parsedContent?.type === 'UI'

          const isInteractive =
            isUIComponent &&
            parsedContent.ui?.type !== 'references' &&
            parsedContent.ui?.type !== 'new_topic'

          const isNewTopicBlock =
            isUIComponent && parsedContent.ui?.type === PulseChatUI.NEW_TOPIC

          const meetingList =
            parsedContent?.type === ContentType.MeetingList &&
            parsedContent.data?.meetings

          if (
            parsedContent?.type === ContentType.SummaryOptions &&
            !summaryOptionsMap.has(id)
          ) {
            updateSummaryOptions(id, parsedContent.message ?? '', {
              audio_summary: parsedContent.options?.audio_summary ?? [],
              text_summary: parsedContent.options?.text_summary ?? [],
              video_summary: parsedContent.options?.video_summary ?? [],
            })
          }

          const messageSummaryOptions = summaryOptionsMap.get(id)

          const chatBgColor =
            isAIGenerated && parsedContent?.type === ContentType.ReviewTasks
              ? alpha(theme.palette.error.main, 0.2)
              : isAIGenerated
                ? alpha(theme.palette.primary.main, 0.1)
                : 'common.white'

          const isLatestMessage = latestMessage.id === id

          const shouldDisableInteraction =
            !isLatestMessage || disableInteraction

          return (
            <Stack key={id}>
              <Stack
                alignItems="flex-start"
                direction={isAIGenerated ? 'row' : 'row-reverse'}
                id={id}
                key={id}
                position="relative"
                ref={
                  index + 1 === messages.length ? lastMessageElementRef : null
                }
                spacing={1}
                sx={{ width: '100%' }}
              >
                {isAIGenerated && (
                  <Avatar
                    placeholder={isNewTopicBlock ? '#' : 'assistant'}
                    size="medium"
                    src={isNewTopicBlock ? undefined : pulseLogo}
                    variant={isNewTopicBlock ? 'rounded' : 'circular'}
                  />
                )}
                <Stack
                  alignItems="flex-start"
                  direction="row"
                  flexGrow={meetingList ? 1 : 0}
                  gap={1}
                  justifyContent={isAIGenerated ? 'flex-start' : 'flex-end'}
                  maxWidth={
                    isAIGenerated
                      ? meetingList ||
                        parsedContent?.type === ContentType.SurveyQuestionnaire
                        ? '100%'
                        : '70%'
                      : '60%'
                  }
                  minWidth={isAIGenerated && isUIComponent ? 500 : undefined}
                >
                  <Stack alignItems="end" width="100%">
                    <Stack
                      border={isNewTopicBlock ? 0 : 1}
                      sx={{
                        bgcolor: isNewTopicBlock ? 'transparent' : chatBgColor,
                        borderColor: 'divider',
                        borderRadius: isAIGenerated
                          ? '0px 16px 16px 16px'
                          : '16px 0px 16px 16px',
                        padding: isNewTopicBlock ? 0 : 2,
                        width: '100%',
                      }}
                    >
                      {status === MessageStatus.Pending ? (
                        <TypingIndicator />
                      ) : (
                        <MessageContent
                          disableInteraction={shouldDisableInteraction}
                          onAttachmentClick={onAttachmentClick}
                          parsedContent={parsedContent}
                          threadId={threadId}
                          topicId={topic_id ?? undefined}
                        />
                      )}
                    </Stack>
                    {isAIGenerated &&
                      !isNewTopicBlock &&
                      status !== MessageStatus.Pending &&
                      isLatestMessage && (
                        <Retry
                          forceDisableInteractive={
                            forceDisableInteractiveHandler
                          }
                          messageId={latestUserMessage?.id || null}
                          showEnablePulseChat={isUIComponent && isInteractive}
                        />
                      )}
                  </Stack>
                  {!messageSummaryOptions &&
                    !meetingList &&
                    parsedContent?.type !== ContentType.SurveyQuestionnaire &&
                    isAIGenerated &&
                    !isNewTopicBlock &&
                    status === MessageStatus.Complete && (
                      <SaveButton
                        isSaved={is_saved ?? false}
                        msgId={id}
                        onDeleteSavedMessage={onDeleteSavedMessage}
                        onSaveMessage={onSaveMessage}
                        savedMessageId={savedMessages?.id ?? ''}
                      />
                    )}
                </Stack>
              </Stack>

              {messageSummaryOptions && (
                <KeyPointsMessage
                  onOptionSelect={handleSummaryOptionSelect}
                  options={messageSummaryOptions.options}
                />
              )}
            </Stack>
          )
        },
      )}
    </Stack>
  )
}
