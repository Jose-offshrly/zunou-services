import { createContext, useContext } from 'react'

export enum ReplyThreadStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
}

interface ReplyContextType {
  onOpenReply: (threadId: string, title?: string, date?: string) => boolean
  onSetReplyThreadId: (replyThreadId: string) => void
  title?: string
  timestamp?: string
  replyTeamThreadId?: string
  metadata?: {
    status: string
    excerpt?: string
  }
}

export const ReplyContext = createContext<ReplyContextType | undefined>(
  undefined,
)

export const useReplyContext = () => {
  const context = useContext(ReplyContext)
  if (!context) {
    throw new Error(
      'useReplyContext must be used within a ReplyContextProvider',
    )
  }
  return context
}
