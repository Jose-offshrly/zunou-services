import type { GetPinnedDirectMessagesResponse } from '@zunou-queries/core/hooks/useGetPinnedDirectMessages'

import {
  PinnedMessage,
  PinnedMessagesDropdown,
} from '../../../../components/ui/PinnedMessagesDropdown/PinnedMessagesDropdown'

interface DirectMessagePinnedMessagesDropdownProps {
  anchorEl: HTMLElement | null
  open: boolean
  pinnedMessagesData?: GetPinnedDirectMessagesResponse
  isLoading?: boolean
  onClose?: () => void
  onMessageClick?: (message: PinnedMessage) => void
  onUnpinMessage?: (messageId: string) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

const transformDirectMessages = (
  data: GetPinnedDirectMessagesResponse | undefined,
): PinnedMessage[] => {
  if (!data?.pinnedDirectMessages?.data) return []

  return data.pinnedDirectMessages.data.map(
    (message: {
      id: string
      content: string | null
      createdAt: string
      deletedAt?: string | null
      sender?: {
        id: string
        name: string
        email?: string | null
        gravatar?: string | null
      } | null
    }) => {
      const isSentByPulse =
        message.sender?.email?.toLowerCase() === 'pulse@zunou.ai'

      return {
        dateCreated: message.createdAt
          ? new Date(message.createdAt).toLocaleDateString('en-US', {
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              month: 'short',
            })
          : '',
        fileAttachments: [], // Direct messages pinned query doesn't include files yet
        gravatar: message.sender?.gravatar || '',
        id: message.id,
        isDeleted: Boolean(message.deletedAt),
        isSentByPulse,
        message: message.content || '',
        name: message.sender?.name || 'Unknown',
      }
    },
  )
}

export const DirectMessagePinnedMessagesDropdown = (
  props: DirectMessagePinnedMessagesDropdownProps,
) => {
  return (
    <PinnedMessagesDropdown
      {...props}
      transformData={transformDirectMessages}
    />
  )
}
