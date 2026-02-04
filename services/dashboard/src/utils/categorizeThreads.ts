import { Thread } from '@zunou-graphql/core/graphql'

import { formatRelativeDate } from './formatRelativeDate'

interface CategorizedThreads {
  [key: string]: Thread[]
}

export const categorizeThreads = (threads?: Thread[]): CategorizedThreads => {
  return (threads || []).reduce<CategorizedThreads>((acc, thread) => {
    const category = formatRelativeDate(thread.createdAt)

    if (!acc[category]) {
      acc[category] = []
    }

    acc[category].push(thread)
    return acc
  }, {})
}
