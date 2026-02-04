import type { GetPinnedTeamMessagesQuery } from '@zunou-graphql/core/graphql'
import zunouIcon from '@zunou-react/assets/images/zunou-icon.png'

import { formatDateAndTime } from '~/utils/formatDateAndTime'

import {
  PinnedMessage,
  PinnedMessagesDropdown,
} from '../../../../../components/ui/PinnedMessagesDropdown/PinnedMessagesDropdown'

interface TeamPinnedMessagesDropdownProps {
  anchorEl: HTMLElement | null
  open: boolean
  pinnedMessagesData?: GetPinnedTeamMessagesQuery
  isLoading?: boolean
  onClose?: () => void
  onMessageClick?: (message: PinnedMessage) => void
  onUnpinMessage?: (messageId: string) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

const transformTeamMessages = (
  data: GetPinnedTeamMessagesQuery | undefined,
): PinnedMessage[] => {
  if (!data?.pinnedTeamMessages?.data) return []

  return data.pinnedTeamMessages.data.map((message) => {
    const isSentByPulse = message.user?.email.toLowerCase() === 'pulse@zunou.ai'

    return {
      dateCreated: message.createdAt
        ? formatDateAndTime(message.createdAt)
        : '',
      fileAttachments: message.files ?? [],
      gravatar: isSentByPulse ? zunouIcon : message.user?.gravatar || '',
      id: message.id,
      isDeleted: message.isDeleted,
      isSentByPulse,
      message: message.content || '',
      name: isSentByPulse ? 'Pulse' : message.user?.name || 'Unknown',
      replyTeamThreadId: message.replyTeamThreadId ?? null,
      status: message.metadata?.status ?? '',
      teamThreadId: message.teamThreadId ?? null,
      title: message.metadata?.excerpt ?? '',
      topic: {
        id: message.topic?.id ?? null,
        name: message.topic?.name ?? null,
      },
    }
  })
}

export const TeamPinnedMessagesDropdown = (
  props: TeamPinnedMessagesDropdownProps,
) => {
  return (
    <PinnedMessagesDropdown {...props} transformData={transformTeamMessages} />
  )
}
