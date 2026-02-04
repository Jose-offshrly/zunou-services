import { Box } from '@mui/material'
import { ReferenceUI } from '@zunou-react/components/form/FormattedContent'
import { useMemo } from 'react'
import { Descendant } from 'slate'

import { serializeToHTML } from '~/utils/textUtils'

import type { TopicReference } from './components/NewTopicUI'
import NewTopicUI from './components/NewTopicUI'
import TeamChatReference from './components/TeamChatReference'

export type { TopicReference }

export interface ParsedContentUI {
  message: string
  ui: {
    type: string
    references?: ReferenceUI[]
  }
}

export const MessageContentUI = ({
  content,
  isDeleted = false,
  onTopicSelect,
  showBorder = true,
  hasPadding = true,
  shrink = false,
  bgcolor,
}: {
  content: string | null
  isDeleted?: boolean
  onTopicSelect?: (topic: {
    id: string
    name: string
    unreadCount?: number
  }) => void
  showBorder?: boolean
  hasPadding?: boolean
  shrink?: boolean
  bgcolor?: string
}) => {
  const displayContent = isDeleted ? 'Message has been deleted.' : content

  const parse = (str: string): ParsedContentUI | null => {
    try {
      return JSON.parse(str)
    } catch (e) {
      return null
    }
  }

  const parsedContent = useMemo(() => parse(content ?? ''), [content])

  if (!parsedContent || !parsedContent?.ui?.type)
    return (
      <Box
        dangerouslySetInnerHTML={{
          __html: (() => {
            try {
              const parsed: Descendant[] = JSON.parse(displayContent ?? '')

              if (Array.isArray(parsed)) {
                return serializeToHTML(parsed)
              }
            } catch (_err) {
              // Not JSON → fallback to legacy HTML
            }
            return displayContent ?? ''
          })(),
        }}
        sx={{
          '& p': { margin: 0 },
          color: isDeleted ? 'text.secondary' : 'inherit',
          fontStyle: isDeleted ? 'italic' : 'normal',
          padding: '0 !important',
          wordBreak: 'break-word',
        }}
      />
    )

  if (parsedContent.ui.type === 'references')
    return (
      <TeamChatReference
        bgcolor={bgcolor}
        hasPadding={hasPadding}
        message={parsedContent.message ?? ''}
        references={parsedContent.ui.references ?? []}
        showBorder={showBorder}
        shrink={shrink}
      />
    )

  if (parsedContent.ui.type === 'new_topic') {
    const topicRef = parsedContent.ui.references?.[0] as
      | TopicReference
      | undefined
    if (!topicRef) return null

    return <NewTopicUI onTopicSelect={onTopicSelect} topic={topicRef} />
  }

  return null
}
