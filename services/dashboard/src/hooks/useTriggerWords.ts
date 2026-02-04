import { theme } from '@zunou-react/services/Theme'
import { useMemo } from 'react'

interface TriggerWordsProps {
  triggers?: string[]
  text: string
}

export const useTriggerWords = ({
  triggers = ['@pulse'],
  text,
}: TriggerWordsProps) => {
  return useMemo(() => {
    if (!text) return text

    if (text === '\\') return '\\'

    if (text.includes('\\')) {
      return text.replace('\\', '\\')
    }

    const escapedWords = triggers.map((trigger) =>
      trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )

    const highlightRegex = new RegExp(`(${escapedWords.join('|')})`, 'gi')

    return text.replace(
      highlightRegex,
      (match) =>
        `<span style="
          font-weight: bold;
          color: ${theme.palette.primary.main};
          border-radius: ${theme.shape.borderRadius}px;
        ">${match}</span>`,
    )
  }, [triggers, text, theme])
}
