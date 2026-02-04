import { ReplyThreadStatus } from '~/context/TeamChatContext'
import { ReplyThreadCard } from '~/pages/manager/ReplyThreadPage/components/ReplyThreadCard'
import { useMiniPulseChat } from '~/store/useMiniPulseChat'

interface ChatReplyCardProps {
  replyTeamThreadId: string
  title: string
  timestamp: string
  metadata: { status: string; excerpt?: string }
}

export const ChatReplyCard = ({
  replyTeamThreadId,
  title,
  timestamp,
  metadata,
}: ChatReplyCardProps) => {
  const {
    setCurrentReplyThreadId,
    setThreadTitle,
    setCurrentReplyThreadDate,
    setOpenMiniPulseChat,
  } = useMiniPulseChat()

  const handleClick = () => {
    setCurrentReplyThreadId(replyTeamThreadId)
    setThreadTitle(title)
    setCurrentReplyThreadDate(timestamp)
    setOpenMiniPulseChat(true)
  }

  return (
    <ReplyThreadCard
      disabled={
        (metadata.status as ReplyThreadStatus) === ReplyThreadStatus.PENDING
      }
      metadata={metadata}
      onClick={handleClick}
      timestamp={timestamp ?? ''}
    />
  )
}
