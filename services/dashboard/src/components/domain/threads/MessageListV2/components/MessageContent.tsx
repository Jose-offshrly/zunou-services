import { Typography } from '@mui/material'
import { AttachmentData } from '@zunou-react/components/form'
import {
  ContentType,
  ParsedContent,
} from '@zunou-react/components/form/FormattedContent'
import { useCallback } from 'react'

import { MeetingListMessage } from '~/components/domain/threads/MessageListV2/aiMessages/MeetingListMessage'
import MessageResponse from '~/components/domain/threads/MessageResponse/MessageResponse'

import Confirmation from '../aiMessages/Confirmation'
import NewTopic from '../aiMessages/NewTopic'
import Options from '../aiMessages/Options'
import Reference from '../aiMessages/Reference'
import { SurveyContainer } from '../aiMessages/SurveyContainer'
import { ParsedContentWithMeetings } from '../hooks/useContentParser'

interface MessageContentProps {
  parsedContent: ParsedContentWithMeetings | null
  disableInteraction: boolean
  onAttachmentClick?: (attachment: AttachmentData, type?: ContentType) => void
  isTruncate?: boolean
  showTextOnly?: boolean
  isMiniPulseChat?: boolean
  threadId: string | null
  replyTeamThreadId?: string
  topicId?: string
}

export const MAX_CHAR_PREV_MODE = 200

export const MessageContent = ({
  parsedContent,
  disableInteraction,
  onAttachmentClick,
  isTruncate = false,
  showTextOnly = false,
  isMiniPulseChat = false,
  threadId,
  replyTeamThreadId,
  topicId,
}: MessageContentProps) => {
  const isUIComponent = parsedContent?.type === 'UI'
  const meetingList =
    parsedContent?.type === ContentType.MeetingList &&
    parsedContent.data?.meetings

  const renderUIComponent = useCallback(
    (type: string | null, parsedContent: ParsedContentWithMeetings) => {
      if (type === 'references')
        return (
          <Reference
            isTruncate={isTruncate}
            message={parsedContent?.message ?? ''}
            references={parsedContent?.ui?.references ?? []}
            showTextOnly={showTextOnly}
          />
        )
      else if (type === 'options')
        return (
          <Options
            disableInteraction={disableInteraction}
            isMiniPulseChat={isMiniPulseChat}
            isTruncate={isTruncate}
            items={parsedContent?.ui?.options ?? []}
            message={parsedContent?.message ?? ''}
            multiSelect={parsedContent?.ui?.multi_select ?? false}
            replyTeamThreadId={replyTeamThreadId}
            showTextOnly={showTextOnly}
            threadId={threadId}
          />
        )
      else if (type === 'confirmation')
        return (
          <Confirmation
            actions={parsedContent?.ui?.confirmation?.actions ?? []}
            disableInteraction={disableInteraction}
            isMiniPulseChat={isMiniPulseChat}
            isTruncate={isTruncate}
            message={parsedContent?.message ?? ''}
            prompt={parsedContent?.ui?.confirmation?.prompt ?? ''}
            replyTeamThreadId={replyTeamThreadId}
            showTextOnly={showTextOnly}
            threadId={threadId}
          />
        )
      else if (type === 'new_topic')
        return <NewTopic topic={parsedContent.ui?.topic} topicId={topicId} />
      else
        return (
          <Typography>
            UI type of &apos;{type}&apos; is not supported yet.
          </Typography>
        )
    },
    [disableInteraction, isTruncate, showTextOnly],
  )

  return (
    <>
      {isUIComponent ? (
        renderUIComponent(parsedContent?.ui?.type ?? null, parsedContent)
      ) : (
        <MessageResponse
          isTruncate={isTruncate}
          onAttachmentClick={onAttachmentClick}
          parsedContent={(parsedContent || undefined) as ParsedContent}
          showTextOnly={showTextOnly}
        />
      )}
      {meetingList && <MeetingListMessage meetings={meetingList} />}
      {parsedContent?.type === ContentType.SurveyQuestionnaire && (
        <SurveyContainer
          questions={parsedContent.data?.questions ?? []}
          topic={parsedContent.data?.topic ?? ''}
        />
      )}
    </>
  )
}
