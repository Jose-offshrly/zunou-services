import { Stack, Typography } from '@mui/material'
import { StrategyType } from '@zunou-graphql/core/graphql'
import { AttachmentData } from '@zunou-react/components/form/AttachmentItem'
import { formatMessage } from '@zunou-react/utils/messageUtils'
import { truncate } from 'lodash'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

interface SummaryOption {
  label: string
  prompt?: string
  status: 'available' | 'coming_soon'
}

interface MessageOptions {
  text_summary: SummaryOption[]
  audio_summary: SummaryOption[]
  video_summary: SummaryOption[]
}

export enum ContentType {
  ReviewTasks = 'review_tasks',
  SummaryOptions = 'summary_options',
  MeetingList = 'meeting_list',
  SurveyQuestionnaire = 'survey_questionnaire',
}

export interface ReferenceUI {
  id: string
  title: string
  type: string
  url?: string
}

export interface OptionUI {
  label: string
  suggested_reply: string
  type: string
  option_context: {
    organizer: string
    meeting_date: string
    source: string
  }
}

export interface ConfirmationUI {
  prompt: string
  actions: { label: string; suggested_reply: string }[]
}

export interface NewTopicUI {
  topic_name: string
  topic_message_count: string
  // participants: any[]
  created_by: string
  // latest_messages: any[]
}

export enum PulseChatUI {
  NEW_TOPIC = 'new_topic',
}

export interface ParsedContent {
  content?: AttachmentData[]
  summary?: string
  type: string
  message?: string
  options?: MessageOptions
  title?: string
  description?: string
  strategy?: StrategyType
  prompt_description?: string
  isSuccess?: boolean
  ui?: {
    type: string
    message?: string
    references?: ReferenceUI[]
    options?: OptionUI[]
    multi_select?: boolean
    confirmation?: ConfirmationUI
    topic?: NewTopicUI[]
  }
  data?: {
    summary_id: string
  }
}

interface Props {
  children: React.ReactNode
  parsedContent?: ParsedContent
  isTruncate?: boolean
}

const FormattedContent = ({
  parsedContent,
  children,
  isTruncate = false,
}: Props) => {
  const summary =
    parsedContent?.type === ContentType.MeetingList ||
    parsedContent?.type === ContentType.ReviewTasks ||
    parsedContent?.type === ContentType.SummaryOptions
      ? formatMessage(parsedContent.message) || ''
      : parsedContent?.summary || ''

  return (
    <Stack spacing={1}>
      {summary && (
        <Typography
          component="div"
          fontSize="inherit"
          sx={{
            '& p': {
              fontSize: 'inherit',
              fontWeight:
                parsedContent?.type === ContentType.ReviewTasks
                  ? 'bold'
                  : 'normal',
              margin: 0,
              padding: 0,
            },
          }}
        >
          <Markdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
            {isTruncate ? truncate(summary, { length: 200 }) : summary}
          </Markdown>
        </Typography>
      )}

      {parsedContent?.type === ContentType.ReviewTasks ? (
        <Typography color="text.secondary" variant="body2">
          Please click this to view.
        </Typography>
      ) : (
        children
      )}
    </Stack>
  )
}

export default FormattedContent
