import { ParsedContent } from '@zunou-react/components/form/FormattedContent'
import { theme } from '@zunou-react/services/Theme'
import { formatMessage } from '@zunou-react/utils/messageUtils'

import { highlightMentions } from '~/utils/messageUtils'

interface Meeting {
  id: string
  pulse_id: string
  user_id: string
  meeting_id: string
  title: string
  date: string
  organizer_name: string
  organizer_profile: string
}

export interface Question {
  item_number: number
  type: 'multiple_choice'
  question: string
  choices: string[]
}

export interface ParsedContentWithMeetings extends Omit<ParsedContent, 'data'> {
  data?: {
    meetings?: Meeting[]
    topic?: string
    questions?: Question[]
  }
}

export const useContentParser = () => {
  const parseContent = (
    content: string | null,
  ): ParsedContentWithMeetings | null => {
    try {
      if (!content?.trim()) return null

      if (content.trim().startsWith('{')) {
        const parsed = JSON.parse(content)

        if (Object.prototype.hasOwnProperty.call(parsed, 'ui')) {
          return {
            ...parsed,
            type: 'UI',
          }
        }

        return {
          ...parsed,
          type: parsed.type || 'text',
        }
      }

      return {
        summary: highlightMentions({
          color: theme.palette.error.main,
          text: formatMessage(content),
        }),
        type: 'text',
      }
    } catch (error) {
      console.error('Error parsing content:', error)
      return {
        summary: formatMessage(content ?? ''),
        type: 'text',
      }
    }
  }

  return { parseContent }
}
