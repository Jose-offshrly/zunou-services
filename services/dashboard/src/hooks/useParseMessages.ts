import { useMemo } from 'react'

interface ParsedContent {
  summary: string
  text: string
}

interface MessageContent {
  summary: string
  content: { text: string }[]
}

export function useParseMessages<T extends { data: { content: string } }>(
  messages: T[],
): (T & ParsedContent)[] {
  return useMemo(() => {
    return messages.map((message) => {
      try {
        const parsedData = JSON.parse(message.data.content) as MessageContent
        const summary = parsedData.summary || ''
        const text = parsedData.content?.[0]?.text || ''

        return {
          ...message,
          summary,
          text,
        }
      } catch (e) {
        return {
          ...message,
          summary: message.data.content,
          text: message.data.content,
        }
      }
    })
  }, [messages])
}
